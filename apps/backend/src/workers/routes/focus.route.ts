import type { FocusContext } from '@whisper/shared/types/watcher';

export async function apiUpdateFocus(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
	}

	try {
		const body = (await request.json()) as { sessionId: string; focus: FocusContext };
		const { sessionId, focus } = body;

		if (!sessionId || !focus) {
			return new Response(JSON.stringify({ error: 'Missing sessionId or focus' }), { status: 400 });
		}

		const id = env.SESSIONS.idFromName(sessionId);
		const stub = env.SESSIONS.get(id);

		await stub.updateFocus(focus);

		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	} catch (error) {
		console.error('Error updating focus:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
	}
}
