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

	const participantResponse = await axios.post(
		`https://api.realtime.cloudflare.com/v2/meetings/${meetingId}/participants`,
		{
			name: 'Whisper AI Agent',
			preset_name: 'Whisper',
			custom_participant_id: 'agent-' + meetingId,
		},
		{ headers: { Authorization: `${env.REALTIME_KIT_AUTH_HEADER}` } },
	);

	const participantToken = participantResponse.data.data.token;
	const agentId = participantResponse.data.data.id;

	await stub.init(agentId, meetingId, participantToken, url.host, env.ACCOUNT_ID, env.API_TOKEN);
	return new Response(null, { status: 200 });
};

export const deinitRoute = async (stub: DurableObjectStub<WhisperSessionDurableObject>): Promise<Response> => {
	await stub.deinit();
	return new Response(null, { status: 200 });
};
