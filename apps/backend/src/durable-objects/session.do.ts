import { RealtimeAgent, TextComponent, RealtimeKitTransport, DeepgramSTT, ElevenLabsTTS } from '@cloudflare/realtime-agents';
import { AIService } from '../services/AIService';
import { SessionService } from '../services/SessionService';
import type { ConversationMessage, ProjectContext, SessionStats, syncFileType, syncFileResponseBody } from '@whisper/shared/types/watcher';

class WhisperTextProcessor extends TextComponent {
	private aiService: AIService;
	private sessionService: SessionService;

	constructor(env: Env, sessionService: SessionService) {
		super();
		this.aiService = new AIService(env);
		this.sessionService = sessionService;
	}

	async onTranscript(text: string, reply: (text: string) => void) {
		console.log(`[Agent] Received transcript: "${text}"`);
		try {
			const context = await this.sessionService.getProjectContext();
			const aiResponse = await this.aiService.generateResponse(text, context);

			console.log(`[Agent] AI response: "${aiResponse}"`);
			reply(aiResponse);

			await this.addConversationMessages(text, aiResponse);
		} catch (error) {
			console.error('[Agent] Error generating AI response:', error);
			reply('Sorry, I encountered an error processing your request.');
		}
	}

	private async addConversationMessages(text: string, aiResponse: string) {
		try {
			await this.sessionService.addConversationMessage('user', text);
			await this.sessionService.addConversationMessage('assistant', aiResponse);
		} catch (error) {
			console.error('[Agent] Error adding conversation messages:', error);
		}
	}
}

export class WhisperSessionDurableObject extends RealtimeAgent<Env> {
	private sessionService: SessionService;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sessionService = new SessionService(ctx);
	}

	// ===== SESSION STATE METHODS =====
	async syncFile(filePath: string, fileContent: string, type: syncFileType, timestamp: number): Promise<syncFileResponseBody> {
		return this.sessionService.syncFile(filePath, fileContent, type, timestamp);
	}

	async getProjectContext(): Promise<ProjectContext> {
		return this.sessionService.getProjectContext();
	}

	async getConversationHistory(limit?: number): Promise<ConversationMessage[]> {
		return this.sessionService.getConversationHistory(limit);
	}

	async getSessionStats(): Promise<SessionStats> {
		return this.sessionService.getSessionStats();
	}

	async clearSession(): Promise<void> {
		return this.sessionService.clearSession();
	}

	// ===== VOICE/MEETING METHODS =====
	async init(
		agentId: string,
		meetingId: string,
		authToken: string,
		workerUrlHost: string,
		accountId: string,
		apiToken: string,
	): Promise<void> {
		console.log('[Agent] Starting init');

		const textProcessor = new WhisperTextProcessor(this.env, this.sessionService);
		const rtkTransport = new RealtimeKitTransport(meetingId, authToken);

		await this.initPipeline(
			[
				rtkTransport,
				new DeepgramSTT(this.env.DEEPGRAM_API_KEY),
				textProcessor,
				new ElevenLabsTTS(this.env.ELEVENLABS_API_KEY),
				rtkTransport,
			],
			agentId,
			workerUrlHost,
			accountId,
			apiToken,
		);

		const { meeting } = rtkTransport;

		meeting.participants.joined.on('participantJoined', (participant) => {
			textProcessor.speak(`Participant Joined ${participant.name}`);
		});
		meeting.participants.joined.on('participantLeft', (participant) => {
			textProcessor.speak(`Participant Left ${participant.name}`);
		});

		await meeting.join();
		await meeting.self.enableAudio();
		await meeting.chat.sendTextMessage('Hello, how are you?');

		setTimeout(() => {
			console.log('Agent speaking test:');
			textProcessor.speak('Testing audio output');
		}, 5000);

		console.log('[Agent] Init complete');
	}

	async deinit(): Promise<void> {
		console.log('[Agent] Deinitializing voice pipeline...');
		await this.deinitPipeline();
		console.log('[Agent] Voice pipeline deinitialized successfully');
	}
}
