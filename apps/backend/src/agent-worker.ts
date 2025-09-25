import { WhisperSessionDurableObject } from './session.do';
import type { syncFileRequestBody } from '@whisper/shared/types/watcher';

export { WhisperSessionDurableObject };

// type WhisperSessionDurableObject = {
// 	syncFile: (
// 		filePath: string,
// 		fileContent: string,
// 		sessionId: string,
// 		type: import('@whisper/shared/types/watcher').syncFileType,
// 		timestamp: number,
// 	) => Promise<import('@whisper/shared/types/watcher').syncFileResponseBody>;
// 	getProjectContext: (sessionId: string) => Promise<import('@whisper/shared/types/watcher').ProjectContext>;
// 	getConversationHistory: (sessionId: string, limit?: number) => Promise<import('@whisper/shared/types/watcher').ConversationMessage[]>;
// 	addConversationMessage: (sessionId: string, type: 'user' | 'assistant', content: string, metadata?: Record<string, any>) => Promise<void>;
// 	getSessionStats: (sessionId: string) => Promise<import('@whisper/shared/types/watcher').SessionStats>;
// 	processMessage: (sessionId: string, content: string) => Promise<string>;
// 	init: (agentId: string, meetingId: string, authToken: string, workerUrlHost: string, accountId: string, apiToken: string) => Promise<void>;
// 	deinit: () => Promise<void>;
// };

export default {
	/**
	 * Main fetch handler that routes between RealtimeAgent and file sync endpoints
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const url = new URL(request.url);
			const path = url.pathname;

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

			// Get session ID from various sources
			const getSessionId = () => {
				return request.headers.get('Session-ID') || url.searchParams.get('sessionId') || request.headers.get('X-Session-ID');
			};

			const sessionId = getSessionId();
			if (!sessionId && !path.includes('/health')) {
				return new Response(JSON.stringify({ error: 'Session ID is required' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}

			// Realtime Agents internal plumbing passthrough
			if (path.startsWith('/agentsInternal')) {
				const agentId = sessionId || 'default';
				const id = env.SESSIONS.idFromName(agentId);
				const stub = env.SESSIONS.get(id);
				return stub.fetch(request);
			}

			// Helper to get session DO stub
			const getSessionStub = (sessionId: string): WhisperSessionDurableObject => {
				const id = env.SESSIONS.idFromName(sessionId);
				return env.SESSIONS.get(id) as unknown as WhisperSessionDurableObject;
			};

			// File synchronization endpoint (existing functionality)
			if (request.method === 'POST' && path === '/sync') {
				try {
					const body: syncFileRequestBody = await request.json();
					const { filePath, fileContent, type, timestamp } = body;

					// Validate required fields
					if (!filePath || type === undefined) {
						return new Response(
							JSON.stringify({
								success: false,
								message: 'File path and type are required',
							}),
							{
								status: 400,
								headers: { 'Content-Type': 'application/json', ...corsHeaders },
							},
						);
					}

					const stub = getSessionStub(sessionId!);
					const result = await stub.syncFile(filePath, fileContent, sessionId!, type, timestamp || Date.now());

					return new Response(JSON.stringify(result), {
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (error) {
					return new Response(
						JSON.stringify({
							success: false,
							message: `Invalid request body: ${error instanceof Error ? error.message : 'Unknown error'}`,
						}),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						},
					);
				}
			}

			// // Get project context endpoint
			// if (request.method === 'GET' && path === '/api/context') {
			// 	const stub = getSessionStub(sessionId!);
			// 	const context = await stub.getProjectContext(sessionId!);

			// 	return new Response(JSON.stringify(context), {
			// 		headers: { 'Content-Type': 'application/json', ...corsHeaders },
			// 	});
			// }

			// // Get conversation history endpoint
			// if (request.method === 'GET' && path === '/api/conversation') {
			// 	const limit = url.searchParams.get('limit');

			// 	const stub = getSessionStub(sessionId!);
			// 	const history = await stub.getConversationHistory(sessionId!, limit ? parseInt(limit) : undefined);

			// 	return new Response(JSON.stringify({ history }), {
			// 		headers: { 'Content-Type': 'application/json', ...corsHeaders },
			// 	});
			// }

			// // Send message to agent (new AI interaction endpoint)
			// if (request.method === 'POST' && path === '/api/message') {
			// 	try {
			// 		const body = (await request.json()) as { message: string };

			// 		if (!body.message) {
			// 			return new Response(
			// 				JSON.stringify({
			// 					error: 'Message content is required',
			// 				}),
			// 				{
			// 					status: 400,
			// 					headers: { 'Content-Type': 'application/json', ...corsHeaders },
			// 				},
			// 			);
			// 		}

			// 		const stub = getSessionStub(sessionId!);
			// 		const response = await stub.processMessage(sessionId!, body.message);

			// 		return new Response(
			// 			JSON.stringify({
			// 				response,
			// 				timestamp: Date.now(),
			// 			}),
			// 			{
			// 				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			// 			},
			// 		);
			// 	} catch (error) {
			// 		return new Response(
			// 			JSON.stringify({
			// 				error: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`,
			// 			}),
			// 			{
			// 				status: 500,
			// 				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			// 			},
			// 		);
			// 	}
			// }

			// Initialize Realtime Agent voice pipeline
			if (request.method === 'POST' && path === '/init') {
				console.log(`[Worker] Received init request for session: ${sessionId}`);
				
				if (!sessionId) {
					return new Response('Session ID required', { status: 400, headers: corsHeaders });
				}
				// Extract meetingId from query parameters
				const meetingId = url.searchParams.get('meetingId');
				if (!meetingId) {
					return new Response('Meeting ID required', { status: 400, headers: corsHeaders });
				}
				const authHeader = request.headers.get('Authorization');
				if (!authHeader) {
					return new Response('Unauthorized', { status: 401, headers: corsHeaders });
				}
				const authToken = authHeader.split(' ')[1] || '';

				console.log(`[Worker] Initializing agent for meeting: ${meetingId}`);
				
				try {
					const id = env.SESSIONS.idFromName(sessionId);
					const stub = env.SESSIONS.get(id) as unknown as WhisperSessionDurableObject;
					
					console.log('[Worker] Calling agent init...');
					console.log(`[Worker] Durable Object ID: ${id.toString()}`);
					console.log(`[Worker] Session ID: ${sessionId}`);
					console.log(`[Worker] Meeting ID: ${meetingId}`);
					
					const result = await stub.init(
						sessionId, // agentId
						meetingId, // meetingId
						authToken,
						new URL(request.url).host,
						env.ACCOUNT_ID || '',
						env.API_TOKEN || '',
					);
					
					console.log('[Worker] Agent init completed successfully');
					console.log(`[Worker] Init result: ${JSON.stringify(result)}`);
					
					return new Response(JSON.stringify({ success: true, message: 'Agent initialized successfully' }), { 
						status: 200, 
						headers: { 'Content-Type': 'application/json', ...corsHeaders } 
					});
				} catch (error) {
					console.error('[Worker] Agent init failed:', error);
					return new Response(JSON.stringify({ 
						success: false, 
						error: error instanceof Error ? error.message : 'Unknown error' 
					}), { 
						status: 500, 
						headers: { 'Content-Type': 'application/json', ...corsHeaders } 
					});
				}
			}

			// Deinitialize Realtime Agent voice pipeline
			if (request.method === 'POST' && path === '/deinit') {
				if (!sessionId) {
					return new Response('Session ID required', { status: 400, headers: corsHeaders });
				}
				const id = env.SESSIONS.idFromName(sessionId);
				const stub = env.SESSIONS.get(id) as unknown as WhisperSessionDurableObject;
				await stub.deinit();
				return new Response(null, { status: 200, headers: corsHeaders });
			}

			// // Get session statistics endpoint
			// if (request.method === 'GET' && path === '/api/session/stats') {
			// 	const stub = getSessionStub(sessionId!);
			// 	const stats = await stub.getSessionStats(sessionId!);

			// 	return new Response(JSON.stringify(stats), {
			// 		headers: { 'Content-Type': 'application/json', ...corsHeaders },
			// 	});
			// }

			// WebRTC/Realtime Agent connection endpoint
			if (request.headers.get('Upgrade') === 'websocket' || path === '/api/realtime') {
				if (!sessionId) {
					return new Response('Session ID is required for realtime connection', {
						status: 400,
						headers: corsHeaders,
					});
				}

				// Get the Durable Object for this session
				const id = env.SESSIONS.idFromName(sessionId);
				const durableObject = env.SESSIONS.get(id) as unknown as WhisperSessionDurableObject;

				// Forward the request to the Durable Object for WebSocket handling
				return durableObject.fetch(request);
			}

			// Health check endpoint
			if (request.method === 'GET' && path === '/health') {
				return new Response(
					JSON.stringify({
						status: 'healthy',
						timestamp: Date.now(),
						version: '2.0.0',
						features: ['realtime-agents', 'file-sync', 'ai-integration'],
					}),
					{
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					},
				);
			}

			// Default 404 response
			return new Response(JSON.stringify({ error: 'Not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			});
		} catch (error) {
			console.error('Worker error:', error);
			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}
	},
} satisfies ExportedHandler<Env>;
