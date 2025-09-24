import type { ConversationMessage, ProjectContext, SessionStats, syncFileType, syncFileResponseBody } from "@whisper/shared/types/watcher";
import { DurableObject } from "cloudflare:workers";
import { WhisperAgent } from './realtime-agent';

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
 * SessionsDurableObject manages the state for each user session including:
 * - File synchronization and storage
 * - Conversation history
 * - Project context
 */
export class SessionsDurableObject extends DurableObject<Env> {
	private sessionState: SessionState | null = null;
	private whisperAgent: WhisperAgent | null = null;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
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
					lastActivity: Date.now()
				};
			} else {
				// Create new session state
				this.sessionState = {
					files: new Map(),
					conversationHistory: [],
					sessionId,
					createdAt: Date.now(),
					lastActivity: Date.now()
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
				files: Object.fromEntries(this.sessionState.files)
			};
			await this.ctx.storage.put('sessionState', stateToSave);
		}
	}

	/**
	 * Synchronize file changes from the local watcher
	 */
	async syncFile(filePath: string, fileContent: string, sessionId: string, type: syncFileType, timestamp: number): Promise<syncFileResponseBody> {
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
				message: `File ${type} operation completed for ${filePath}`
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to sync file: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}

	/**
	 * Get the full project context (all files) for AI processing
	 */
	async getProjectContext(sessionId: string): Promise<ProjectContext> {
		const state = await this.ensureSessionState(sessionId);
		return {
			files: Object.fromEntries(state.files)
		};
	}

	/**
	 * Add a message to the conversation history
	 */
	async addConversationMessage(sessionId: string, type: 'user' | 'assistant', content: string, metadata?: Record<string, any>): Promise<void> {
		const state = await this.ensureSessionState(sessionId);
		
		const message: ConversationMessage = {
			id: crypto.randomUUID(),
			type,
			content,
			timestamp: Date.now(),
			...(metadata && { metadata })
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
			lastActivity: state.lastActivity
		};
	}

	/**
	 * Process a user message via the WhisperAgent pipeline and return AI response
	 */
	async processMessage(sessionId: string, content: string): Promise<string> {
		// Ensure state exists and agent is initialized
		await this.ensureSessionState(sessionId);
		if (!this.whisperAgent) {
			this.whisperAgent = new WhisperAgent(this.ctx, this.env);
			await this.whisperAgent.initialize(sessionId);
		}

		return await this.whisperAgent.onMessage(content);
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

		// Initialize WhisperAgent if not already done
		if (!this.whisperAgent) {
			this.whisperAgent = new WhisperAgent(this.ctx, this.env);
			await this.whisperAgent.initialize(sessionId);
		}

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
						const response = await this.whisperAgent!.onMessage(data.content);
						server.send(JSON.stringify({
							type: 'response',
							content: response,
							timestamp: Date.now()
						}));
					}
				} catch (error) {
					console.error('Error handling WebSocket message:', error);
					server.send(JSON.stringify({
						type: 'error',
						message: 'Failed to process message'
					}));
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