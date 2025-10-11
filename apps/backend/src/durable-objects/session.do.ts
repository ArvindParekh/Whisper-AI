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

	async onTranscript(text: string, reply: (text: string) => void) {
		console.log(`[Agent] Received transcript: "${text}"`);
		try {
			const context = await this.stateManagerService.getProjectContext();
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
			await this.stateManagerService.addConversationMessage('user', text);
			await this.stateManagerService.addConversationMessage('assistant', aiResponse);
		} catch (error) {
			console.error('[Agent] Error adding conversation messages:', error);
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
	async init(
		agentId: string,
		meetingId: string,
		authToken: string,
		workerUrlHost: string,
		accountId: string,
		apiToken: string,
	): Promise<void> {
		console.log('[Agent] Starting init');

		const textProcessor = new WhisperTextProcessor(this.env, this.stateManagerService);
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
