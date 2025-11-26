import type { syncFileType } from '@whisper/shared/types/watcher';

export const apiSyncFile = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
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

	const result = await stub.syncFile(sessionId, filePath, fileContent, type as syncFileType, timestamp);

	return new Response(JSON.stringify(result), { status: 200 });
};
