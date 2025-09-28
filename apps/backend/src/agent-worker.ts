import { WhisperSessionDurableObject } from './session.do';
import type { syncFileType } from '@whisper/shared/types/watcher';
import axios from 'axios';

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
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// ===== TWO-WAY HANDSHAKE =====
		const generateSessionId = async (projectPath: string): Promise<string> => {
			const encoder = new TextEncoder();
			const data = encoder.encode(projectPath);
			const hashBuffer = await crypto.subtle.digest('SHA-256', data);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
			return hashHex.substring(0, 32); // Use first 32 chars
		};

		// frontend registers a token
		if (url.pathname === '/api/register-token') {
			const { token } = (await request.json()) as { token: string };

			await env.TOKENS.put(token, 'waiting', {
				expirationTtl: 300,
			});

			return new Response(JSON.stringify({ success: true, message: 'Token registered' }), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}

		// cli says it's connected
		if (url.pathname === '/api/cli-connected') {
			const { token, projectName, projectPath } = (await request.json()) as { token: string; projectName: string; projectPath: string };

			const sessionId = await generateSessionId(projectPath);

			const id = env.SESSIONS.idFromName(sessionId);
			const session = env.SESSIONS.get(id);

			// await session.init(sessionId, projectName, token, new URL(request.url).host, env.ACCOUNT_ID, env.API_TOKEN); - maybe not here

			await env.TOKENS.put(
				token,
				JSON.stringify({
					status: 'connected',
					projectName,
					sessionId,
					timestamp: Date.now(),
				}),
				{
					// keeping for 1 day
					expirationTtl: 3600,
				},
			);

			return new Response(JSON.stringify({ success: true, message: 'Connected to backend', sessionId }), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}

		// frontend polls for token status
		if (url.pathname === '/api/check-token') {
			const token = url.searchParams.get('token');
			if (!token) {
				return new Response(JSON.stringify({ success: false, error: 'Token is required' }), { status: 400 });
			}

			const tokenData = await env.TOKENS.get(token, 'json');
			if (!tokenData) {
				return new Response(JSON.stringify({ success: false, message: 'expired' }));
			}

			if (tokenData === 'waiting') {
				return new Response(JSON.stringify({ success: false, message: 'waiting' }));
			}

			return new Response(JSON.stringify({ success: true, message: 'connected', data: tokenData }));
		}

		// ===== FILE SYNC =====
		if (url.pathname === '/api/sync') {
			const { filePath, fileContent, sessionId, type, timestamp } = (await request.json()) as {
				filePath: string;
				fileContent: string;
				sessionId: string;
				type: string;
				timestamp: number;
			};

			if (!sessionId) {
				return new Response(JSON.stringify({ success: false, message: 'Session ID is required' }), { status: 400 });
			}

			const id = env.SESSIONS.idFromName(sessionId);
			const stub = env.SESSIONS.get(id);

			const result = await stub.syncFile(filePath, fileContent, sessionId, type as syncFileType, timestamp);

			return new Response(JSON.stringify(result), { status: 200 });
		}

		// ===== CREATE MEETING ENDPOINTS =====
		// frontend gets same meeting id for same user
		if (url.pathname === '/api/create-meeting') {
			const { sessionId } = (await request.json()) as { sessionId: string };

			let meetingId = await env.TOKENS.get(`meeting:${sessionId}`);

			if (!meetingId) {
				// create meeting
				try {
					const response = await axios.post(
						'https://api.realtimekit.cc/v1/meetings',
						{ title: `Session ${sessionId}` },
						{ headers: { Authorization: `Bearer ${env.REALTIMEKIT_API_KEY}` } },
					);

					meetingId = response.data.id as string;

					await env.TOKENS.put(`meeting:${sessionId}`, meetingId);
				} catch (error) {
					console.error('Error creating meeting:', error);
					return Response.json({ error: 'Error creating meeting' }, { status: 500 });
				}
			}

			return Response.json({ meetingId });
		}

		// create auth token for participant (user or agent)
		if (url.pathname === '/api/create-participant') {
			const { meetingId, participantName } = (await request.json()) as { meetingId: string; participantName: string };

			try {
				const response = await axios.post(
					'https://api.realtimekit.cc/v1/participants',
					{
						meetingId,
						name: participantName,
						preset_name: 'host',
					},
					{ headers: { Authorization: `Bearer ${env.REALTIMEKIT_API_KEY}` } },
				);

				const { authToken } = response.data;
				return Response.json({ authToken });
			} catch (error) {
				console.error('Error creating participant:', error);
				return Response.json({ error: 'Error creating participant' }, { status: 500 });
			}
		}

		// ===== VOICE ENDPOINTS =====
		const meetingId = url.searchParams.get('meetingId');
		if (meetingId) {
			// TODO get the same stub as above (defined uniquely by sessionId at the moment)
			// Solution: maybe use bi-directional mapping between sessionId and meetingId, or use meetingId as the unique identifier overall
			const id = env.SESSIONS.idFromName(meetingId);
			const stub = env.SESSIONS.get(id);

			if (url.pathname.startsWith('/agentsInternal')) {
				return stub.fetch(request);
			}

			if (url.pathname === '/init') {
				const authHeader = request.headers.get('Authorization');
				if (!authHeader) return new Response(null, { status: 401 });

				await stub.init(meetingId, meetingId, authHeader.split(' ')[1]!, url.host, env.ACCOUNT_ID, env.API_TOKEN);
				return new Response(null, { status: 200 });
			}

			if (url.pathname === '/deinit') {
				await stub.deinit();
				return new Response(null, { status: 200 });
			}
		} else {
			return new Response('Meeting ID is required', { status: 400 });
		}

		return new Response('Not found', { status: 404 });
	},

	// async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	// 	try {
	// 		const url = new URL(request.url);
	// 		const path = url.pathname;

	// 		// CORS headers for browser requests
	// 		const corsHeaders = {
	// 			'Access-Control-Allow-Origin': '*',
	// 			'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
	// 			'Access-Control-Allow-Headers': 'Content-Type, Session-ID',
	// 		};

	// 		// Handle CORS preflight requests
	// 		if (request.method === 'OPTIONS') {
	// 			return new Response(null, { headers: corsHeaders });
	// 		}

	// 		// Get session ID from various sources
	// 		const getSessionId = () => {
	// 			return request.headers.get('Session-ID') || url.searchParams.get('sessionId') || request.headers.get('X-Session-ID');
	// 		};

	// 		const sessionId = getSessionId();
	// 		if (!sessionId && !path.includes('/health')) {
	// 			return new Response(JSON.stringify({ error: 'Session ID is required' }), {
	// 				status: 400,
	// 				headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 			});
	// 		}

	// 		// Realtime Agents internal plumbing passthrough
	// 		if (path.startsWith('/agentsInternal')) {
	// 			const agentId = sessionId || 'default';
	// 			const id = env.SESSIONS.idFromName(agentId);
	// 			const stub = env.SESSIONS.get(id);
	// 			return stub.fetch(request);
	// 		}

	// 		// Helper to get session DO stub
	// 		const getSessionStub = (sessionId: string): WhisperSessionDurableObject => {
	// 			const id = env.SESSIONS.idFromName(sessionId);
	// 			return env.SESSIONS.get(id) as unknown as WhisperSessionDurableObject;
	// 		};

	// 		// File synchronization endpoint (existing functionality)
	// 		if (request.method === 'POST' && path === '/sync') {
	// 			try {
	// 				const body: syncFileRequestBody = await request.json();
	// 				const { filePath, fileContent, type, timestamp } = body;

	// 				// Validate required fields
	// 				if (!filePath || type === undefined) {
	// 					return new Response(
	// 						JSON.stringify({
	// 							success: false,
	// 							message: 'File path and type are required',
	// 						}),
	// 						{
	// 							status: 400,
	// 							headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 						},
	// 					);
	// 				}

	// 				const stub = getSessionStub(sessionId!);
	// 				const result = await stub.syncFile(filePath, fileContent, sessionId!, type, timestamp || Date.now());

	// 				return new Response(JSON.stringify(result), {
	// 					headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 				});
	// 			} catch (error) {
	// 				return new Response(
	// 					JSON.stringify({
	// 						success: false,
	// 						message: `Invalid request body: ${error instanceof Error ? error.message : 'Unknown error'}`,
	// 					}),
	// 					{
	// 						status: 400,
	// 						headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 					},
	// 				);
	// 			}
	// 		}

	// 		// // Get project context endpoint
	// 		// if (request.method === 'GET' && path === '/api/context') {
	// 		// 	const stub = getSessionStub(sessionId!);
	// 		// 	const context = await stub.getProjectContext(sessionId!);

	// 		// 	return new Response(JSON.stringify(context), {
	// 		// 		headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 		// 	});
	// 		// }

	// 		// // Get conversation history endpoint
	// 		// if (request.method === 'GET' && path === '/api/conversation') {
	// 		// 	const limit = url.searchParams.get('limit');

	// 		// 	const stub = getSessionStub(sessionId!);
	// 		// 	const history = await stub.getConversationHistory(sessionId!, limit ? parseInt(limit) : undefined);

	// 		// 	return new Response(JSON.stringify({ history }), {
	// 		// 		headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 		// 	});
	// 		// }

	// 		// // Send message to agent (new AI interaction endpoint)
	// 		// if (request.method === 'POST' && path === '/api/message') {
	// 		// 	try {
	// 		// 		const body = (await request.json()) as { message: string };

	// 		// 		if (!body.message) {
	// 		// 			return new Response(
	// 		// 				JSON.stringify({
	// 		// 					error: 'Message content is required',
	// 		// 				}),
	// 		// 				{
	// 		// 					status: 400,
	// 		// 					headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 		// 				},
	// 		// 			);
	// 		// 		}

	// 		// 		const stub = getSessionStub(sessionId!);
	// 		// 		const response = await stub.processMessage(sessionId!, body.message);

	// 		// 		return new Response(
	// 		// 			JSON.stringify({
	// 		// 				response,
	// 		// 				timestamp: Date.now(),
	// 		// 			}),
	// 		// 			{
	// 		// 				headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 		// 			},
	// 		// 		);
	// 		// 	} catch (error) {
	// 		// 		return new Response(
	// 		// 			JSON.stringify({
	// 		// 				error: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`,
	// 		// 			}),
	// 		// 			{
	// 		// 				status: 500,
	// 		// 				headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 		// 			},
	// 		// 		);
	// 		// 	}
	// 		// }

	// 		// Initialize Realtime Agent voice pipeline
	// 		if (request.method === 'POST' && path === '/init') {
	// 			console.log(`[Worker] Received init request for session: ${sessionId}`);

	// 			if (!sessionId) {
	// 				return new Response('Session ID required', { status: 400, headers: corsHeaders });
	// 			}
	// 			// Extract meetingId from query parameters
	// 			const meetingId = url.searchParams.get('meetingId');
	// 			if (!meetingId) {
	// 				return new Response('Meeting ID required', { status: 400, headers: corsHeaders });
	// 			}
	// 			const authHeader = request.headers.get('Authorization');
	// 			if (!authHeader) {
	// 				return new Response('Unauthorized', { status: 401, headers: corsHeaders });
	// 			}
	// 			const authToken = authHeader.split(' ')[1] || '';

	// 			console.log(`[Worker] Initializing agent for meeting: ${meetingId}`);

	// 			try {
	// 				const id = env.SESSIONS.idFromName(sessionId);
	// 				const stub = env.SESSIONS.get(id) as unknown as WhisperSessionDurableObject;

	// 				console.log('[Worker] Calling agent init...');
	// 				console.log(`[Worker] Durable Object ID: ${id.toString()}`);
	// 				console.log(`[Worker] Session ID: ${sessionId}`);
	// 				console.log(`[Worker] Meeting ID: ${meetingId}`);

	// 				const result = await stub.init(
	// 					sessionId, // agentId
	// 					meetingId, // meetingId
	// 					authToken,
	// 					new URL(request.url).host,
	// 					env.ACCOUNT_ID || '',
	// 					env.API_TOKEN || '',
	// 				);

	// 				console.log('[Worker] Agent init completed successfully');
	// 				console.log(`[Worker] Init result: ${JSON.stringify(result)}`);

	// 				return new Response(JSON.stringify({ success: true, message: 'Agent initialized successfully' }), {
	// 					status: 200,
	// 					headers: { 'Content-Type': 'application/json', ...corsHeaders }
	// 				});
	// 			} catch (error) {
	// 				console.error('[Worker] Agent init failed:', error);
	// 				return new Response(JSON.stringify({
	// 					success: false,
	// 					error: error instanceof Error ? error.message : 'Unknown error'
	// 				}), {
	// 					status: 500,
	// 					headers: { 'Content-Type': 'application/json', ...corsHeaders }
	// 				});
	// 			}
	// 		}

	// 		// Deinitialize Realtime Agent voice pipeline
	// 		if (request.method === 'POST' && path === '/deinit') {
	// 			if (!sessionId) {
	// 				return new Response('Session ID required', { status: 400, headers: corsHeaders });
	// 			}
	// 			const id = env.SESSIONS.idFromName(sessionId);
	// 			const stub = env.SESSIONS.get(id) as unknown as WhisperSessionDurableObject;
	// 			await stub.deinit();
	// 			return new Response(null, { status: 200, headers: corsHeaders });
	// 		}

	// 		// // Get session statistics endpoint
	// 		// if (request.method === 'GET' && path === '/api/session/stats') {
	// 		// 	const stub = getSessionStub(sessionId!);
	// 		// 	const stats = await stub.getSessionStats(sessionId!);

	// 		// 	return new Response(JSON.stringify(stats), {
	// 		// 		headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 		// 	});
	// 		// }

	// 		// WebRTC/Realtime Agent connection endpoint
	// 		if (request.headers.get('Upgrade') === 'websocket' || path === '/api/realtime') {
	// 			if (!sessionId) {
	// 				return new Response('Session ID is required for realtime connection', {
	// 					status: 400,
	// 					headers: corsHeaders,
	// 				});
	// 			}

	// 			// Get the Durable Object for this session
	// 			const id = env.SESSIONS.idFromName(sessionId);
	// 			const durableObject = env.SESSIONS.get(id) as unknown as WhisperSessionDurableObject;

	// 			// Forward the request to the Durable Object for WebSocket handling
	// 			return durableObject.fetch(request);
	// 		}

	// 		// Health check endpoint
	// 		if (request.method === 'GET' && path === '/health') {
	// 			return new Response(
	// 				JSON.stringify({
	// 					status: 'healthy',
	// 					timestamp: Date.now(),
	// 					version: '2.0.0',
	// 					features: ['realtime-agents', 'file-sync', 'ai-integration'],
	// 				}),
	// 				{
	// 					headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 				},
	// 			);
	// 		}

	// 		// Default 404 response
	// 		return new Response(JSON.stringify({ error: 'Not found' }), {
	// 			status: 404,
	// 			headers: { 'Content-Type': 'application/json', ...corsHeaders },
	// 		});
	// 	} catch (error) {
	// 		console.error('Worker error:', error);
	// 		return new Response(
	// 			JSON.stringify({
	// 				error: 'Internal server error',
	// 				message: error instanceof Error ? error.message : 'Unknown error',
	// 			}),
	// 			{
	// 				status: 500,
	// 				headers: { 'Content-Type': 'application/json' },
	// 			},
	// 		);
	// 	}
	// },
} satisfies ExportedHandler<Env>;
