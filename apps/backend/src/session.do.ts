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
	private env: Env;
	private sessionId: string;

	constructor(env: Env, sessionId: string) {
		super();
		this.env = env;
		this.sessionId = sessionId;
	}

	async onTranscript(text: string, reply: (text: string) => void) {
		console.log(`[Agent] Received transcript: "${text}"`);
		try {
			// Get project context for AI response
			const context = await this.getProjectContext();

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

			console.log('[Agent] Generating AI response...');
			// Use Workers AI for response generation
			const response = (await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: text },
				],
			})) as { response: string };

			const aiResponse = response.response || 'I apologize, but I encountered an issue generating a response.';
			console.log(`[Agent] AI response: "${aiResponse}"`);
			reply(aiResponse);
			this.speak(aiResponse);
		} catch (error) {
			console.error('[Agent] Error generating AI response:', error);
			reply('Sorry, I encountered an error processing your request.');
		}
	}

	async speak(text: string, contextId?: string): Promise<void> {
		console.log(`[Agent] Speaking: "${text}"`);
		await super.speak(text, contextId);
	}

	private async getProjectContext(): Promise<ProjectContext> {
		// Access the parent SessionsDurableObject's project context
		const parent = this.env.SESSIONS.get(this.env.SESSIONS.idFromName(this.sessionId));
		return await (parent as any).getProjectContext(this.sessionId);
	}
}

/**
 * SessionsDurableObject manages the state for each user session including:
 * - File synchronization and storage
 * - Conversation history
 * - Project context
 * - AI processing and voice pipeline
 */
export class WhisperSessionDurableObject extends RealtimeAgent<Env> {
	private sessionState: SessionState | null = null;
	private sessionId: string;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sessionId = '';
	}

	/**
	 * Initialize or load session state
	 */
	private async ensureSessionState(sessionId: string): Promise<SessionState> {
		if (!this.sessionState) {
			// Try to load existing state
			const stored = await this.ctx.storage.get<SessionState>('sessionState');

			if (stored) {
				this.sessionState = {
					...stored,
					files: new Map(Object.entries(stored.files || {})),
					lastActivity: Date.now(),
				};
			} else {
				// Create new session state
				this.sessionState = {
					files: new Map(),
					conversationHistory: [],
					sessionId,
					createdAt: Date.now(),
					lastActivity: Date.now(),
				};
			}
		}

		// Update last activity
		this.sessionState.lastActivity = Date.now();
		return this.sessionState;
	}

	/**
	 * Persist session state to durable storage
	 */
	private async saveSessionState(): Promise<void> {
		if (this.sessionState) {
			const stateToSave = {
				...this.sessionState,
				files: Object.fromEntries(this.sessionState.files),
			};
			await this.ctx.storage.put('sessionState', stateToSave);
		}
	}

	/**
	 * Synchronize file changes from the local watcher
	 */
	async syncFile(
		filePath: string,
		fileContent: string,
		sessionId: string,
		type: syncFileType,
		timestamp: number,
	): Promise<syncFileResponseBody> {
		try {
			const state = await this.ensureSessionState(sessionId);

			switch (type) {
				case 'add':
				case 'change':
					state.files.set(filePath, { content: fileContent, lastModified: timestamp });
					break;
				case 'delete':
					state.files.delete(filePath);
					break;
				default:
					throw new Error(`Unknown sync type: ${type}`);
			}

			await this.saveSessionState();

			return {
				success: true,
				message: `File ${type} operation completed for ${filePath}`,
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to sync file: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Get the full project context (all files) for AI processing
	 */
	async getProjectContext(sessionId: string): Promise<ProjectContext> {
		const state = await this.ensureSessionState(sessionId);
		return {
			files: Object.fromEntries(state.files),
		};
	}

	/**
	 * Add a message to the conversation history
	 */
	async addConversationMessage(
		sessionId: string,
		type: 'user' | 'assistant',
		content: string,
		metadata?: Record<string, any>,
	): Promise<void> {
		const state = await this.ensureSessionState(sessionId);

		const message: ConversationMessage = {
			id: crypto.randomUUID(),
			type,
			content,
			timestamp: Date.now(),
			...(metadata && { metadata }),
		};

		state.conversationHistory.push(message);
		await this.saveSessionState();
	}

	/**
	 * Get conversation history
	 */
	async getConversationHistory(sessionId: string, limit?: number): Promise<ConversationMessage[]> {
		const state = await this.ensureSessionState(sessionId);
		const history = state.conversationHistory;

		if (limit && limit > 0) {
			return history.slice(-limit);
		}

		return history;
	}

	/**
	 * Get session statistics
	 */
	async getSessionStats(sessionId: string): Promise<SessionStats> {
		const state = await this.ensureSessionState(sessionId);

		return {
			filesCount: state.files.size,
			conversationLength: state.conversationHistory.length,
			createdAt: state.createdAt,
			lastActivity: state.lastActivity,
		};
	}

	/**
	 * Realtime Agents init: wire a voice pipeline.
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
		console.log('[Agent] Starting init');

		const textProcessor = new WhisperTextProcessor(this.env, this.sessionId);
		const rtkTransport = new RealtimeKitTransport(meetingId, authToken);

		// Text goes: textProcessor -> TTS -> RTK
		await this.initPipeline(
			[
				rtkTransport, // audio IN from meeting
				new DeepgramSTT(this.env.DEEPGRAM_API_KEY), // audio → text
				textProcessor, // process text
				new ElevenLabsTTS(this.env.ELEVENLABS_API_KEY), // text → audio
				rtkTransport, // audio OUT to meeting
			],
			agentId,
			workerUrlHost,
			accountId,
			apiToken,
		);
		const { meeting } = rtkTransport;
		await meeting.join();
		// await meeting.audio.play();

		// Use textProcessor.speak(), not tts.speak()
		textProcessor.speak('Testing audio output');

		console.log('[Agent] Init complete');
	}

	async deinit(): Promise<void> {
		console.log('[Agent] Deinitializing voice pipeline...');
		await this.deinitPipeline();
		console.log('[Agent] Voice pipeline deinitialized successfully');
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
	 * Clear session data (useful for cleanup)
	 */
	async clearSession(sessionId: string): Promise<void> {
		await this.ctx.storage.deleteAll();
		this.sessionState = null;
	}

	/**
	 * Handle WebSocket/WebRTC connections for real-time communication
	 */
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const sessionId = url.searchParams.get('sessionId') || request.headers.get('Session-ID');

		if (!sessionId) {
			return new Response('Session ID is required', { status: 400 });
		}

		// Ensure session state exists
		await this.ensureSessionState(sessionId);

		// Handle WebSocket upgrade for real-time communication
		if (request.headers.get('Upgrade') === 'websocket') {
			const webSocketPair = new WebSocketPair();
			const [client, server] = Object.values(webSocketPair);

			if (!server) {
				return new Response('WebSocket creation failed', { status: 500 });
			}

			// Accept the WebSocket connection
			server.accept();

			// Set up message handling
			server.addEventListener('message', async (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type === 'message' && data.content) {
						// const response = await this.processMessage(sessionId, data.content);
						const response = 'hi';
						server.send(
							JSON.stringify({
								type: 'response',
								content: response,
								timestamp: Date.now(),
							}),
						);
					}
				} catch (error) {
					console.error('Error handling WebSocket message:', error);
					server.send(
						JSON.stringify({
							type: 'error',
							message: 'Failed to process message',
						}),
					);
				}
			});

			// Handle connection close
			server.addEventListener('close', () => {
				console.log(`WebSocket connection closed for session: ${sessionId}`);
			});

			return new Response(null, {
				status: 101,
				webSocket: client || null,
			});
		}

		// Handle regular HTTP requests
		return new Response('WebSocket connection required', { status: 400 });
	}
}
