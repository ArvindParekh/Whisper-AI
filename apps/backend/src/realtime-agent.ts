import { RealtimeAgent, TextComponent, RealtimeKitTransport, DeepgramSTT, ElevenLabsTTS } from '@cloudflare/realtime-agents';
import type { syncFileType, syncFileResponseBody, SessionStats, ConversationMessage, ProjectContext } from '@whisper/shared/types/watcher';

/**
 * Custom TextProcessor for WhisperAgent that handles AI responses with project context
 */
class WhisperTextProcessor extends TextComponent {
	private env: Env;
	private sessionId: string;

	constructor(env: Env, sessionId: string) {
		super();
		this.env = env;
		this.sessionId = sessionId;
	}

	async onTranscript(text: string, reply: (text: string) => void) {
		try {
			// Get project context for AI response
			const context = await this.getSessionStub().getProjectContext(this.sessionId);

			// Build system prompt with project context
			const fileCount = Object.keys(context.files).length;
			const fileList = Object.keys(context.files).slice(0, 5);

			const systemPrompt = `You are an AI pair programming assistant with access to the user's project files.

Project Context:
- Total files: ${fileCount}
- Key files: ${fileList.join(', ')}

File contents preview:
${fileList
	.map((filename) => {
		const file = context.files[filename];
		if (!file) return `${filename}: (file not found)`;
		const preview = file.content.substring(0, 500);
		return `${filename}:\n${preview}${file.content.length > 500 ? '...' : ''}`;
	})
	.join('\n\n')}

Please help the user with their coding question in the context of this project.`;

			// Use Workers AI for response generation
			const response = (await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: text },
				],
			})) as { response: string };

			reply(response.response || 'I apologize, but I encountered an issue generating a response.');
		} catch (error) {
			console.error('Error generating AI response:', error);
			reply('Sorry, I encountered an error processing your request.');
		}
	}

	private getSessionStub(): SessionsStub {
		if (!this.sessionId) throw new Error('Session not initialized');
		const id = this.env.SESSIONS.idFromName(this.sessionId);
		return this.env.SESSIONS.get(id) as unknown as SessionsStub;
	}
}
// Narrow stub interface to the RPC surface we use to avoid heavy type instantiation
type SessionsStub = {
	syncFile: (
		filePath: string,
		fileContent: string,
		sessionId: string,
		type: syncFileType,
		timestamp: number,
	) => Promise<syncFileResponseBody>;
	getProjectContext: (sessionId: string) => Promise<ProjectContext>;
	addConversationMessage: (sessionId: string, type: 'user' | 'assistant', content: string, metadata?: Record<string, any>) => Promise<void>;
	getConversationHistory: (sessionId: string, limit?: number) => Promise<ConversationMessage[]>;
	getSessionStats: (sessionId: string) => Promise<SessionStats>;
	clearSession: (sessionId: string) => Promise<void>;
};

// /**
//  * Session state interface for storing project files and conversation history
//  */
// interface SessionState {
// 	files: Map<string, { content: string; lastModified: number }>;
// 	conversationHistory: ConversationMessage[];
// 	sessionId: string;
// 	createdAt: number;
// 	lastActivity: number;
// }

/**
 * WhisperAgent - AI Pair Programming Assistant
 *
 * This agent provides:
 * - Real-time voice conversation with AI (via RealtimeAgent integration)
 * - Project file synchronization and context
 * - Conversation history management
 * - Code-aware AI responses
 */
export class WhisperAgent extends RealtimeAgent<Env> {
	private sessionId: string;

	/**
	 * Constructor with environment
	 */
	constructor(ctx: DurableObjectState, env: Env, sessionId: string) {
		super(ctx, env);
		this.sessionId = sessionId;
	}

	// /**
	//  * Initialize the agent with session data and set up the pipeline
	//  */
	// async initialize(sessionId: string) {
	// 	this.sessionId = sessionId;
	// 	// Touch DO to ensure state exists and update last-activity
	// 	await this.getProjectContext();

	// 	// Minimal default pipeline; voice pipeline is set up in init()
	// 	const textProcessor = new WhisperTextProcessor(this.env, sessionId);
	// 	await this.initPipeline([textProcessor], sessionId, '', '', '');

	// 	console.log(`WhisperAgent initialized for session: ${sessionId}`);
	// }

	/**
	 * Realtime Agents docs-compliant init: wire a voice pipeline.
	 * Accepts (agentId, meetingId, authToken, workerUrlHost, accountId, apiToken)
	 */
	async init(
		agentId: string,
		meetingId: string,
		authToken: string,
		workerUrlHost: string,
		accountId: string,
		apiToken: string,
	): Promise<void> {
		// Construct your text processor for generating responses to text
		const textProcessor = new WhisperTextProcessor(this.env, agentId);

		// Construct a Meeting object to join the RTK meeting
		const rtkTransport = new RealtimeKitTransport(meetingId, authToken);

		// Construct a pipeline to take in meeting audio, transcribe it using
		// Deepgram, and pass our generated responses through ElevenLabs to
		// be spoken in the meeting
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

		// The RTK meeting object is accessible to us, so we can register handlers
		// on various events like participant joins/leaves, chat, etc.
		// This is optional
		meeting.participants.joined.on('participantJoined', (participant) => {
			textProcessor.speak(`Participant Joined ${participant.name}`);
		});
		meeting.participants.joined.on('participantLeft', (participant) => {
			textProcessor.speak(`Participant Left ${participant.name}`);
		});

		// Make sure to actually join the meeting after registering all handlers
		await meeting.join();
	}

	async deinit(): Promise<void> {
		await this.deinitPipeline();
	}

	/**
	 * Get session stub for Durable Object RPC calls
	 */
	private getSessionStub(): SessionsStub {
		if (!this.sessionId) throw new Error('Session not initialized');
		const id = this.env.SESSIONS.idFromName(this.sessionId);
		return this.env.SESSIONS.get(id) as unknown as SessionsStub;
	}

	/**
	 * Persist session state (handled by Durable Object)
	 */
	private async saveSessionState(): Promise<void> {
		// No-op: persistence handled by Durable Object
	}

	/**
	 * Handle file synchronization from local watcher (migrated from Durable Object)
	 */
	async syncFile(filePath: string, fileContent: string, type: syncFileType, timestamp: number): Promise<syncFileResponseBody> {
		const stub = this.getSessionStub();
		return await stub.syncFile(filePath, fileContent, this.sessionId!, type, timestamp);
	}

	/**
	 * Get the full project context for AI processing
	 */
	async getProjectContext(): Promise<ProjectContext> {
		const stub = this.getSessionStub();
		return await stub.getProjectContext(this.sessionId!);
	}

	/**
	 * Handle incoming voice/text messages and generate AI responses
	 */
	async onMessage(message: string): Promise<string> {
		try {
			await this.addConversationMessage('user', message);

			// For now, use the old method until we have proper RealtimeAgent integration
			const context = await this.getProjectContext();
			const aiResponse = await this.generateCodeAwareResponse(message, context);

			await this.addConversationMessage('assistant', aiResponse);
			return aiResponse;
		} catch (error) {
			console.error('Error processing message:', error);
			return 'Sorry, I encountered an error processing your request.';
		}
	}

	/**
	 * Generate code-aware AI response using project context and Workers AI
	 */
	private async generateCodeAwareResponse(userMessage: string, context: ProjectContext): Promise<string> {
		try {
			const fileCount = Object.keys(context.files).length;
			const fileList = Object.keys(context.files).slice(0, 5);

			// Build context for AI
			const systemPrompt = `You are an AI pair programming assistant with access to the user's project files.
			
Project Context:
- Total files: ${fileCount}
- Key files: ${fileList.join(', ')}

File contents preview:
${fileList
	.map((filename) => {
		const file = context.files[filename];
		if (!file) return `${filename}: (file not found)`;
		const preview = file.content.substring(0, 500);
		return `${filename}:\n${preview}${file.content.length > 500 ? '...' : ''}`;
	})
	.join('\n\n')}

Please help the user with their coding question in the context of this project.`;

			// Use Workers AI for response generation
			const response = (await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userMessage },
				],
			})) as { response: string };

			return response.response || 'I apologize, but I encountered an issue generating a response. Please try again.';
		} catch (error) {
			console.error('Error generating AI response:', error);

			// Fallback response
			const fileCount = Object.keys(context.files).length;
			const fileList = Object.keys(context.files).slice(0, 5).join(', ');

			return `I can see your project has ${fileCount} files including: ${fileList}. Regarding "${userMessage}" - I'm having trouble with AI processing right now, but I'd be happy to help you analyze your code!`;
		}
	}

	/**
	 * Add a message to the conversation history
	 */
	async addConversationMessage(type: 'user' | 'assistant', content: string, metadata?: Record<string, any>): Promise<void> {
		const stub = this.getSessionStub();
		await stub.addConversationMessage(this.sessionId!, type, content, metadata);
	}

	/**
	 * Get conversation history
	 */
	async getConversationHistory(limit?: number): Promise<ConversationMessage[]> {
		const stub = this.getSessionStub();
		return await stub.getConversationHistory(this.sessionId!, limit);
	}

	/**
	 * Get session statistics
	 */
	async getSessionStats(): Promise<SessionStats> {
		const stub = this.getSessionStub();
		return await stub.getSessionStats(this.sessionId!);
	}

	/**
	 * Clear session data
	 */
	async clearSession(): Promise<void> {
		const stub = this.getSessionStub();
		await stub.clearSession(this.sessionId!);
	}
}
