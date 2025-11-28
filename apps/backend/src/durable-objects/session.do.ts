import { RealtimeAgent, TextComponent, RealtimeKitTransport, DeepgramSTT, ElevenLabsTTS } from '@cloudflare/realtime-agents';
import { AIService } from '../services/AIService';
import { RetrievalService } from '../services/RetrievalService';
import { StateManagerService } from '../services/StateManagerService';
import type { ConversationMessage, ProjectContext, SessionStats, syncFileType, syncFileResponseBody, FocusContext } from '@whisper/shared/types/watcher';

class WhisperTextProcessor extends TextComponent {
	private aiService: AIService;
	private retrievalService: RetrievalService;
	private stateManagerService: StateManagerService;
	private currentFocus?: FocusContext;

	constructor(env: Env, stateManagerService: StateManagerService) {
		super();
		this.stateManagerService = stateManagerService;
		this.retrievalService = new RetrievalService(env);
		this.aiService = new AIService(env, this.retrievalService, this.stateManagerService);
	}

	updateFocus(focus: FocusContext) {
		this.currentFocus = focus;
		console.log(`[Agent] Focus updated: ${focus.filePath} (L${focus.cursorLine})`);
	}

	async onTranscript(text: string, reply: (text: string) => void) {
		if (!text?.trim()) return;
		console.log(`[Agent] User: "${text}"`);

		// echo command for testing
		if (text.toLowerCase().startsWith('echo ')) {
			const echoText = text.slice(5);
			console.log(`[Agent] Echo: "${echoText}"`);
			reply(echoText);
			return;
		}

		try {
			const sessionId = await this.stateManagerService.getSessionId();
			console.log(`[Agent] Using SessionID: ${sessionId}`);

			const context = await this.retrievalService.retrieveContext(text, sessionId, this.currentFocus); // retrieve relevant context from vectorize/d1/kv
			const aiResponse = await this.aiService.generateResponse(text, context, sessionId, this.currentFocus);
			console.log(`[Agent] Response: "${aiResponse.slice(0, 100)}..."`);
			reply(aiResponse);

			await this.stateManagerService.addConversationMessage('user', text);
			await this.stateManagerService.addConversationMessage('assistant', aiResponse);
		} catch (error) {
			console.error('[Agent] Error generating response:', error);
			reply('Sorry, I encountered an error.');
		}
	}
}

export class WhisperSessionDurableObject extends RealtimeAgent<Env> {
	private stateManagerService: StateManagerService;
	private textProcessor?: WhisperTextProcessor;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.stateManagerService = new StateManagerService(ctx);
	}

	// session state methods
	async syncFile(
		sessionId: string,
		filePath: string,
		fileContent: string,
		type: syncFileType,
		timestamp: number,
	): Promise<syncFileResponseBody> {
		const result = await this.stateManagerService.syncFile(sessionId, filePath, fileContent, type, timestamp);

		// send to indexer - fire and forget
		if (type !== 'delete' && this.env.INDEXER_WORKER_URL) {
			console.log(`[DO] Sending ${filePath} to indexer at ${this.env.INDEXER_WORKER_URL}`);
			fetch(`${this.env.INDEXER_WORKER_URL}/index`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId,
					files: [{ path: filePath, content: fileContent }],
				}),
			})
				.then(async (resp) => {
					await resp.body?.cancel();
					if (!resp.ok) console.error(`[DO] Indexer returned ${resp.status}`);
				})
				.catch((err) => console.error(`[DO] Indexer error for ${filePath}:`, err));
		} else {
			console.log(`[DO] Skipping indexer for ${filePath} (URL: ${this.env.INDEXER_WORKER_URL})`);
		}

		return result;
	}

	async getProjectContext(): Promise<ProjectContext> {
		return this.stateManagerService.getProjectContext();
	}

	async getConversationHistory(limit?: number): Promise<ConversationMessage[]> {
		return this.stateManagerService.getConversationHistory(limit);
	}

	async getSessionStats(): Promise<SessionStats> {
		return this.stateManagerService.getSessionStats();
	}

	async clearSession(): Promise<void> {
		return this.stateManagerService.clearSession();
	}

	async updateFocus(focus: FocusContext): Promise<void> {
		if (this.textProcessor) {
			this.textProcessor.updateFocus(focus);
		}
	}

	// voice/meeting methods
	async init(
		agentId: string,
		meetingId: string,
		authToken: string,
		workerUrlHost: string,
		accountId: string,
		apiToken: string,
	): Promise<void> {
		if (!this.env.DEEPGRAM_API_KEY) throw new Error('DEEPGRAM_API_KEY not set');
		if (!this.env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

		this.textProcessor = new WhisperTextProcessor(this.env, this.stateManagerService);
		const rtkTransport = new RealtimeKitTransport(meetingId, authToken);

		await this.initPipeline(
			[
				rtkTransport,
				new DeepgramSTT(this.env.DEEPGRAM_API_KEY),
				this.textProcessor,
				new ElevenLabsTTS(
					this.env.ELEVENLABS_API_KEY,
					(this.env as any).ELEVENLABS_VOICE_ID ? { voice_id: (this.env as any).ELEVENLABS_VOICE_ID } : undefined,
				),
				rtkTransport,
			],
			agentId,
			workerUrlHost,
			accountId,
			apiToken,
		);

		const { meeting } = rtkTransport;

		meeting.participants.joined.on('participantJoined', async (participant) => {
			console.log(`[Agent] ${participant.name} joined`);
			try {
				await this.textProcessor?.speak(`Hello ${participant.name || 'there'}, I am ready.`);
			} catch (err) {
				console.error('[Agent] Greeting error:', err);
			}
		});

		meeting.participants.joined.on('participantLeft', (participant) => {
			console.log(`[Agent] ${participant.name} left`);
		});

		await meeting.join();
		console.log('[Agent] Joined meeting');
	}

	async deinit(): Promise<void> {
		try {
			await this.deinitPipeline();
			console.log('[Agent] Left meeting');
		} catch (err) {
			console.error('[Agent] Deinit error:', err);
		}
	}
}
