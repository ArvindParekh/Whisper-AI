import { WhisperSessionDurableObject } from '../../durable-objects/session.do';
import axios from 'axios';

export const agentsInternalRoute = async (stub: DurableObjectStub<WhisperSessionDurableObject>, request: Request): Promise<Response> => {
	console.log(`[AgentsInternalRoute] Forwarding request: ${request.method} ${request.url}`);
	return await stub.fetch(request);
};

export const initRoute = async (
	stub: DurableObjectStub<WhisperSessionDurableObject>,
	request: Request,
	meetingId: string,
	env: Env,
): Promise<Response> => {
	const url = new URL(request.url);
	const authHeader = request.headers.get('Authorization');
	if (!authHeader) return new Response(null, { status: 401 });

	try {
		// Validate required environment variables
		if (!env.REALTIME_KIT_AUTH_HEADER) {
			console.error('[InitRoute] Missing REALTIME_KIT_AUTH_HEADER');
			return new Response(JSON.stringify({ error: 'Missing REALTIME_KIT_AUTH_HEADER configuration' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (!env.DEEPGRAM_API_KEY) {
			console.error('[InitRoute] Missing DEEPGRAM_API_KEY');
			return new Response(JSON.stringify({ error: 'Missing DEEPGRAM_API_KEY configuration' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (!env.ELEVENLABS_API_KEY) {
			console.error('[InitRoute] Missing ELEVENLABS_API_KEY');
			return new Response(JSON.stringify({ error: 'Missing ELEVENLABS_API_KEY configuration' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Validate Cloudflare account credentials for pipeline provisioning
		if (!env.ACCOUNT_ID || !env.API_TOKEN) {
			console.error('[InitRoute] Missing ACCOUNT_ID or API_TOKEN');
			return new Response(JSON.stringify({ error: 'Missing Cloudflare credentials (ACCOUNT_ID or API_TOKEN)' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		console.log('[InitRoute] Creating participant for meeting:', meetingId);
		let participantResponse;
		try {
			participantResponse = await axios.post(
				`https://api.realtime.cloudflare.com/v2/meetings/${meetingId}/participants`,
				{
					name: 'Whisper AI Agent',
					preset_name: 'Whisper',
					custom_participant_id: 'agent-' + meetingId,
				},
				{ headers: { Authorization: `${env.REALTIME_KIT_AUTH_HEADER}` } },
			);
		} catch (axiosError) {
			if (axios.isAxiosError(axiosError)) {
				const status = axiosError.response?.status;
				const statusText = axiosError.response?.statusText;
				const responseData = axiosError.response?.data;
				console.error('[InitRoute] Axios error creating participant:', {
					status,
					statusText,
					data: responseData,
					message: axiosError.message,
				});
				throw new Error(`Failed to create participant: ${status} ${statusText} - ${JSON.stringify(responseData)}`);
			}
			throw axiosError;
		}

		if (!participantResponse.data?.data?.token || !participantResponse.data?.data?.id) {
			console.error('[InitRoute] Invalid participant response:', participantResponse.data);
			throw new Error('Invalid response from participant creation API');
		}

		const participantToken = participantResponse.data.data.token;
		const agentId = participantResponse.data.data.id;

		// Map agentId to sessionId so /agentsInternal callbacks can be routed
		try {
			const sessionIdForMeeting = await env.WHISPER_TOKEN_STORE.get(`session:${meetingId}`);
			if (sessionIdForMeeting) {
				await env.WHISPER_TOKEN_STORE.put(`sessionByAgent:${agentId}`, sessionIdForMeeting);
			}
		} catch (mapErr) {
			console.warn('[InitRoute] Failed to map agentId to sessionId:', mapErr);
		}

		console.log('[InitRoute] Participant created, initializing agent pipeline');
		// Library expects workerUrlHost to be HOST ONLY (no scheme, no path)
		const workerUrlHost = url.host;
		console.log('[InitRoute] Init params:', {
			agentId,
			meetingId,
			workerUrlHost,
			accountId: env.ACCOUNT_ID ? 'set' : 'missing',
			apiToken: env.API_TOKEN ? 'set' : 'missing',
		});

		console.log('[InitRoute] About to call stub.init()...');
		const initStart = Date.now();
		try {
			// CRITICAL: Use meetingId as agentId (matches official Cloudflare example)
			// This ensures pipeline WebSocket URL is: wss://worker.dev/agentsInternal/ws?meetingId=<id>
			// Without this, Worker can't route /agentsInternal requests to the correct DO
			await stub.init(meetingId, meetingId, participantToken, workerUrlHost, env.ACCOUNT_ID, env.API_TOKEN);
			const initDuration = Date.now() - initStart;
			console.log(`[InitRoute] stub.init() completed in ${initDuration}ms`);
		} catch (initError) {
			console.error('[InitRoute] stub.init() threw an error:', initError);
			throw initError;
		}

		console.log('[InitRoute] Agent initialized successfully');
		return new Response(null, { status: 200 });
	} catch (error) {
		console.error('[InitRoute] Error initializing agent:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const errorStack = error instanceof Error ? error.stack : undefined;

		return new Response(
			JSON.stringify({
				error: 'Failed to initialize agent',
				message: errorMessage,
				stack: errorStack,
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};

export const deinitRoute = async (stub: DurableObjectStub<WhisperSessionDurableObject>): Promise<Response> => {
	await stub.deinit();
	return new Response(null, { status: 200 });
};
