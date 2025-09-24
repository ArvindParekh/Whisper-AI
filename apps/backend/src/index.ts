import { DurableObject } from 'cloudflare:workers';
import type { 
    syncFileRequestBody, 
    syncFileType, 
    syncFileResponseBody,
    SessionStats,
    ConversationMessage,
    ProjectContext
} from '@whisper/shared/types/watcher';

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
	 * Clear session data (useful for cleanup)
	 */
	async clearSession(sessionId: string): Promise<void> {
		await this.ctx.storage.deleteAll();
		this.sessionState = null;
	}
}

/**
 * Enhanced ingestion worker with proper routing and error handling
 */
export default {
	/**
	 * Main fetch handler for the ingestion worker
	 * Handles file synchronization, context retrieval, and WebSocket upgrades
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const url = new URL(request.url);
			const path = url.pathname;

			// Helper function to get durable object for session
			const getDurableObjectForSession = (sessionId: string) => {
				const id = env.SESSIONS.idFromName(sessionId);
				return env.SESSIONS.get(id);
			};

			// CORS headers for browser requests
			const corsHeaders = {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Session-ID',
			};

			// Handle CORS preflight requests
			if (request.method === 'OPTIONS') {
				return new Response(null, { headers: corsHeaders });
			}

			// File synchronization endpoint
			if (request.method === 'POST' && path === '/sync') {
				try {
					const body: syncFileRequestBody = await request.json();
					const { filePath, fileContent, sessionId, type, timestamp } = body;

					// Validate required fields
					if (!sessionId) {
						return new Response(JSON.stringify({ success: false, message: 'Session ID is required' }), {
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders }
						});
					}

					if (!filePath || type === undefined) {
						return new Response(JSON.stringify({ success: false, message: 'File path and type are required' }), {
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders }
						});
					}

					const durableObject = getDurableObjectForSession(sessionId);
					const result = await durableObject.syncFile(filePath, fileContent, sessionId, type, timestamp || Date.now());

					return new Response(JSON.stringify(result), {
						headers: { 'Content-Type': 'application/json', ...corsHeaders }
					});
				} catch (error) {
					return new Response(JSON.stringify({ 
						success: false, 
						message: `Invalid request body: ${error instanceof Error ? error.message : 'Unknown error'}` 
					}), {
						status: 400,
						headers: { 'Content-Type': 'application/json', ...corsHeaders }
					});
				}
			}

			// Get project context endpoint
			if (request.method === 'GET' && path === '/context') {
				const sessionId = request.headers.get('Session-ID') || url.searchParams.get('sessionId');
				
				if (!sessionId) {
					return new Response(JSON.stringify({ error: 'Session ID is required' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json', ...corsHeaders }
					});
				}

				const durableObject = getDurableObjectForSession(sessionId);
				const context = await durableObject.getProjectContext(sessionId);

				return new Response(JSON.stringify(context), {
					headers: { 'Content-Type': 'application/json', ...corsHeaders }
				});
			}

			// Get conversation history endpoint
			if (request.method === 'GET' && path === '/conversation') {
				const sessionId = request.headers.get('Session-ID') || url.searchParams.get('sessionId');
				const limit = url.searchParams.get('limit');
				
				if (!sessionId) {
					return new Response(JSON.stringify({ error: 'Session ID is required' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json', ...corsHeaders }
					});
				}

				const durableObject = getDurableObjectForSession(sessionId);
				const history = await durableObject.getConversationHistory(
					sessionId, 
					limit ? parseInt(limit) : undefined
				);

				return new Response(JSON.stringify({ history }), {
					headers: { 'Content-Type': 'application/json', ...corsHeaders }
				});
			}

			// Add conversation message endpoint
			if (request.method === 'POST' && path === '/conversation') {
				try {
					const body = await request.json() as {
						sessionId: string;
						type: 'user' | 'assistant';
						content: string;
						metadata?: Record<string, any>;
					};

					if (!body.sessionId || !body.type || !body.content) {
						return new Response(JSON.stringify({ 
							error: 'Session ID, type, and content are required' 
						}), {
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders }
						});
					}

					const durableObject = getDurableObjectForSession(body.sessionId);
					await durableObject.addConversationMessage(
						body.sessionId,
						body.type,
						body.content,
						body.metadata
					);

					return new Response(JSON.stringify({ success: true }), {
						headers: { 'Content-Type': 'application/json', ...corsHeaders }
					});
				} catch (error) {
					return new Response(JSON.stringify({ 
						error: `Invalid request body: ${error instanceof Error ? error.message : 'Unknown error'}` 
					}), {
						status: 400,
						headers: { 'Content-Type': 'application/json', ...corsHeaders }
					});
				}
			}

			// Get session statistics endpoint
			if (request.method === 'GET' && path === '/session/stats') {
				const sessionId = request.headers.get('Session-ID') || url.searchParams.get('sessionId');
				
				if (!sessionId) {
					return new Response(JSON.stringify({ error: 'Session ID is required' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json', ...corsHeaders }
					});
				}

				const durableObject = getDurableObjectForSession(sessionId);
				const stats = await durableObject.getSessionStats(sessionId);

				return new Response(JSON.stringify(stats), {
					headers: { 'Content-Type': 'application/json', ...corsHeaders }
				});
			}

			// WebSocket upgrade for real-time communication
			if (request.headers.get('Upgrade') === 'websocket') {
				const sessionId = request.headers.get('Session-ID') || url.searchParams.get('sessionId');
				
				if (!sessionId) {
					return new Response('Session ID is required for WebSocket connection', { status: 400 });
				}

				// TODO: Implement proper WebSocket handling with Cloudflare Realtime
				// For now, return a placeholder response
				return new Response('WebSocket support coming soon', { status: 501 });
			}

			// Health check endpoint
			if (request.method === 'GET' && path === '/health') {
				return new Response(JSON.stringify({ 
					status: 'healthy', 
					timestamp: Date.now(),
					version: '1.0.0'
				}), {
					headers: { 'Content-Type': 'application/json', ...corsHeaders }
				});
			}

			// Default 404 response
			return new Response(JSON.stringify({ error: 'Not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json', ...corsHeaders }
			});

		} catch (error) {
			console.error('Worker error:', error);
			return new Response(JSON.stringify({ 
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error'
			}), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	},
} satisfies ExportedHandler<Env>;
