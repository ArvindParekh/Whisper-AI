import { WhisperSessionDurableObject } from '../../durable-objects/session.do';
import axios from 'axios';

export const agentsInternalRoute = async (stub: DurableObjectStub<WhisperSessionDurableObject>, request: Request): Promise<Response> => {
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

	// Validate required env vars
	const requiredEnvVars = ['REALTIME_KIT_AUTH_HEADER', 'DEEPGRAM_API_KEY', 'ELEVENLABS_API_KEY', 'ACCOUNT_ID', 'API_TOKEN'];
	for (const envVar of requiredEnvVars) {
		if (!(env as any)[envVar]) {
			return Response.json({ error: `Missing ${envVar}` }, { status: 500 });
		}
	}

	try {
		// Create agent participant with unique ID
		const uniqueAgentId = `agent-${meetingId}-${Date.now()}`;
		const participantResponse = await axios.post(
			`https://api.realtime.cloudflare.com/v2/meetings/${meetingId}/participants`,
			{
				name: 'Whisper AI Agent',
				preset_name: 'Whisper',
				custom_participant_id: uniqueAgentId,
			},
			{ headers: { Authorization: env.REALTIME_KIT_AUTH_HEADER } },
		);

		const { token: participantToken, id: agentId } = participantResponse.data.data;
		if (!participantToken || !agentId) {
			throw new Error('Invalid participant response');
		}

		// Map agentId to sessionId for routing
		const sessionId = await env.WHISPER_TOKEN_STORE.get(`session:${meetingId}`);
		if (sessionId) {
			await env.WHISPER_TOKEN_STORE.put(`sessionByAgent:${agentId}`, sessionId);
		}

		// Initialize agent pipeline
		// Note: First param is meetingId (used for WebSocket routing)
		await stub.init(meetingId, meetingId, participantToken, url.host, env.ACCOUNT_ID, env.API_TOKEN);

		console.log('[Init] Agent initialized for meeting:', meetingId);
		return new Response(null, { status: 200 });
	} catch (error) {
		console.error('[Init] Error:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return Response.json({ error: message }, { status: 500 });
	}
};

export const deinitRoute = async (stub: DurableObjectStub<WhisperSessionDurableObject>): Promise<Response> => {
	await stub.deinit();
	return new Response(null, { status: 200 });
};
