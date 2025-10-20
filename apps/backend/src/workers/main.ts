import { WhisperSessionDurableObject } from '../durable-objects/session.do';
import { apiSyncFile } from './routes/sync.route';
import { preflightMiddleware } from '../middleware/preflight';
import { corsMiddleware } from '../middleware/cors';
import { apiCheckToken, apiCliConnected, apiRegisterToken } from './routes/token.route';
import { agentsInternalRoute, deinitRoute, initRoute } from './routes/cloudflareInternal.route';
import { apiCreateMeeting, apiCreateParticipant } from './routes/meeting.route';

export { WhisperSessionDurableObject };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		const preflightResponse = preflightMiddleware(request);
		if (preflightResponse) return preflightResponse;

		try {
			// handle routes that require meetingId first
			const meetingId = url.searchParams.get('meetingId');
			if (meetingId) {
				// get sessionId from meetingId
				// sessionId is the unique identifier for durable objects
				const sessionId = await env.WHISPER_TOKEN_STORE.get(`session:${meetingId}`);
				if (!sessionId) {
					return corsMiddleware(Response.json({ error: 'Session not found' }, { status: 404 }));
				}

				const id = env.SESSIONS.idFromName(sessionId);
				const stub = env.SESSIONS.get(id);

				if (pathname.startsWith('/agentsInternal')) {
					// cf needs this
					return await agentsInternalRoute(stub, request);
				}

				// cf internal routes
				switch (pathname) {
					case '/init': {
						const response = await initRoute(stub, request, meetingId, env);
						return corsMiddleware(response);
					}

					case '/deinit': {
						const response = await deinitRoute(stub);
						return corsMiddleware(response);
					}
				}
			}

			// handle all other routes
			switch (pathname) {
				case '/api/register-token': {
					const response = await apiRegisterToken(request, env, ctx);
					return corsMiddleware(response);
				}

				case '/api/cli-connected': {
					const response = await apiCliConnected(request, env, ctx);
					return corsMiddleware(response);
				}

				case '/api/check-token': {
					const response = await apiCheckToken(request, env, ctx);
					return corsMiddleware(response);
				}

				case '/api/sync': {
					const response = await apiSyncFile(request, env, ctx);
					return corsMiddleware(response);
				}

				case '/api/create-meeting': {
					const response = await apiCreateMeeting(request, env, ctx);
					return corsMiddleware(response);
				}

				case '/api/create-participant': {
					const response = await apiCreateParticipant(request, env, ctx);
					return corsMiddleware(response);
				}

				default: {
					// if we got here with a meetingId but no matching route
					if (meetingId) {
						return corsMiddleware(Response.json({ error: 'Route not found' }, { status: 404 }));
					}

					// no meetingId and no matching route
					return corsMiddleware(Response.json({ error: 'Not found' }, { status: 404 }));
				}
			}
		} catch (error) {
			console.error('Worker error:', error);
			return corsMiddleware(Response.json({ error: 'Internal server error' }, { status: 500 }));
		}
	},
} satisfies ExportedHandler<Env>;
