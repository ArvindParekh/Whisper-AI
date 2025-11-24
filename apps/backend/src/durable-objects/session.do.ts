import { RealtimeAgent, TextComponent, RealtimeKitTransport, DeepgramSTT, ElevenLabsTTS } from '@cloudflare/realtime-agents';
import { AIService } from '../services/AIService';
import { StateManagerService } from '../services/StateManagerService';
import type { ConversationMessage, ProjectContext, SessionStats, syncFileType, syncFileResponseBody } from '@whisper/shared/types/watcher';

class WhisperTextProcessor extends TextComponent {
	private aiService: AIService;
	private stateManagerService: StateManagerService;

	constructor(env: Env, stateManagerService: StateManagerService) {
		super();
		this.aiService = new AIService(env);
		this.stateManagerService = stateManagerService;
	}

	async speak(text: string, contextId?: string) {
		console.log(`[Agent] Speaking: "${text}"`);
		await super.speak(text, contextId);
	}

	async onTranscript(text: string, reply: (text: string) => void) {
		console.log(`[Agent] onTranscript: "${text}"`);

		if (!text || text.trim().length === 0) {
			return;
		}

		// Echo command for testing
		if (text.toLowerCase().startsWith('echo ')) {
			const echoText = text.slice(5);
			console.log(`[Agent] Echo: "${echoText}"`);
			reply(echoText);
			return;
		}

		try {
			const context = await this.stateManagerService.getProjectContext();
			const aiResponse = await this.aiService.generateResponse(text, context);
			console.log(`[Agent] AI response: "${aiResponse}"`);
			reply(aiResponse);

			// Save conversation
			await this.stateManagerService.addConversationMessage('user', text);
			await this.stateManagerService.addConversationMessage('assistant', aiResponse);
		} catch (error) {
			console.error('[Agent] Error:', error);
			reply('Sorry, I encountered an error.');
		}
	}
}

export class WhisperSessionDurableObject extends RealtimeAgent<Env> {
	private stateManagerService: StateManagerService;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.stateManagerService = new StateManagerService(ctx);
	}

	// ===== SESSION STATE METHODS =====
	async syncFile(filePath: string, fileContent: string, type: syncFileType, timestamp: number): Promise<syncFileResponseBody> {
		return this.stateManagerService.syncFile(filePath, fileContent, type, timestamp);
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

	// ===== VOICE/MEETING METHODS =====
	// Following the official Cloudflare example exactly:
	// https://developers.cloudflare.com/realtime/agents/getting-started/

	async init(
		agentId: string,
		meetingId: string,
		authToken: string,
		workerUrlHost: string,
		accountId: string,
		apiToken: string,
	): Promise<void> {
		console.log('[Agent] init() called');

		// Validate required environment variables
		if (!this.env.DEEPGRAM_API_KEY) throw new Error('DEEPGRAM_API_KEY is not set');
		if (!this.env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not set');

		// 1. Create text processor and transport
		const textProcessor = new WhisperTextProcessor(this.env, this.stateManagerService);
		const rtkTransport = new RealtimeKitTransport(meetingId, authToken);

		// 2. Initialize the pipeline FIRST
		console.log('[Agent] Initializing pipeline...');
		await this.initPipeline(
			[
				rtkTransport,
				new DeepgramSTT(this.env.DEEPGRAM_API_KEY),
				textProcessor,
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

		// 3. Register event handlers (optional per docs)
		meeting.participants.joined.on('participantJoined', async (participant) => {
			console.log(`[Agent] Participant joined: ${participant.name}`);
			try {
				await textProcessor.speak(`Hello ${participant.name || 'there'}, I am ready.`);
			} catch (err) {
				console.error('[Agent] Error speaking greeting:', err);
			}
		});

		meeting.participants.joined.on('participantLeft', (participant) => {
			console.log(`[Agent] Participant left: ${participant.name}`);
		});

		// 4. Join the meeting LAST (per docs: "Make sure to actually join the meeting after registering all handlers")
		console.log('[Agent] Joining meeting...');
		await meeting.join();
		console.log('[Agent] Joined meeting successfully');
	}

	async deinit(): Promise<void> {
		console.log('[Agent] deinit() called');
		try {
			await this.deinitPipeline();
			console.log('[Agent] Pipeline deinitialized');
		} catch (err) {
			console.error('[Agent] Error during deinit:', err);
		}
	}
}
