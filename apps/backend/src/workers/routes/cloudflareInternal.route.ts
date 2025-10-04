import { WhisperSessionDurableObject } from '../../durable-objects/session.do';

export const agentsInternalRoute = async (stub: WhisperSessionDurableObject, request: Request): Promise<Response> => {
	return await stub.fetch(request);
};

export const initRoute = async (stub: WhisperSessionDurableObject, request: Request, meetingId: string, env: Env): Promise<Response> => {
	const url = new URL(request.url);
	const authHeader = request.headers.get('Authorization');
	if (!authHeader) return new Response(null, { status: 401 });

	await stub.init(meetingId, meetingId, authHeader.split(' ')[1]!, url.host, env.ACCOUNT_ID, env.API_TOKEN);
	return new Response(null, { status: 200 });
};

export const deinitRoute = async (stub: WhisperSessionDurableObject): Promise<Response> => {
	await stub.deinit();
	return new Response(null, { status: 200 });
};
