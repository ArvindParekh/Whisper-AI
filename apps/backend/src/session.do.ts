import type { ConversationMessage, ProjectContext, SessionStats, syncFileType, syncFileResponseBody } from '@whisper/shared/types/watcher';
import { RealtimeAgent, TextComponent, RealtimeKitTransport, DeepgramSTT, ElevenLabsTTS } from '@cloudflare/realtime-agents';

/**
 * Session state interface for storing project files and conversation history
 */
interface SessionState {
	files: Map<string, { content: string; lastModified: number }>;
	conversationHistory: ConversationMessage[];
	sessionId: string;
	createdAt: number;
	lastActivity: number;
}

/**
 * Custom TextProcessor for AI responses with project context
 */
class WhisperTextProcessor extends TextComponent {
	env: Env;

	constructor(env: Env) {
		super();
		this.env = env;
	}

	async onTranscript(text: string, reply: (text: string) => void) {
		console.log(`[Agent] Received transcript: "${text}"`);
		const { response } = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
			prompt: text,
		});
		console.log(`[Agent] Response: "${response}"`);
		reply(response!);
		console.log(`[Agent] Reply sent to elevenlabs: "${response}"`);
	}
}

export class WhisperSessionDurableObject extends RealtimeAgent<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async init(agentId: string, meetingId: string, authToken: string, workerUrlHost: string, accountId: string, apiToken: string) {
		console.log('[Agent] Starting init');

		const textProcessor = new WhisperTextProcessor(this.env);
		const rtkTransport = new RealtimeKitTransport(meetingId, authToken);

		console.log('here 1');

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

		console.log('here 2');

		const { meeting } = rtkTransport;

		console.log('here 3');

		meeting.participants.joined.on('participantJoined', (participant) => {
			textProcessor.speak(`participant joined ${participant.name}`);
		});

		meeting.participants.joined.on('participantLeft', (participant) => {
			textProcessor.speak(`participant left ${participant.name}`);
		});

		console.log('here 4');

		await meeting.join();
		await meeting.self.enableAudio();
		// await meeting.audio.play();
		await meeting.chat.sendTextMessage('Hello, how are you?');

		setTimeout(() => {
			console.log('Agent speaking test:');
			textProcessor.speak('Testing audio output');
		}, 5000);
		console.log('[Agent] Init complete');

		// Return a serializable success response
	}

	async deinit() {
		console.log('[Agent] Deinitializing voice pipeline...');
		await this.deinitPipeline();
		console.log('[Agent] Voice pipeline deinitialized successfully');
	}
}
