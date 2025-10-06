export const apiCheckToken = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const url = new URL(request.url);
	const token = url.searchParams.get('token');

	if (!token) {
		return new Response(JSON.stringify({ success: false, error: 'Token is required' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	const tokenData = await env.WHISPER_TOKEN_STORE.get(token, 'json');
	if (!tokenData) {
		return new Response(JSON.stringify({ success: false, message: 'expired' }), {
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	if (tokenData === 'waiting') {
		return new Response(JSON.stringify({ success: false, message: 'waiting' }), {
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	return new Response(JSON.stringify({ success: true, message: 'connected', data: tokenData }), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const apiCliConnected = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const { token, projectName, projectPath } = (await request.json()) as { token: string; projectName: string; projectPath: string };

	const sessionId = await generateSessionId(projectPath);

	const id = env.SESSIONS.idFromName(sessionId);
	const session = env.SESSIONS.get(id);

	// await session.init(sessionId, projectName, token, new URL(request.url).host, env.ACCOUNT_ID, env.API_TOKEN); - maybe not here

	await env.WHISPER_TOKEN_STORE.put(
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
};

export const apiRegisterToken = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const { token } = (await request.json()) as { token: string };

	await env.WHISPER_TOKEN_STORE.put(token, JSON.stringify('waiting'), {
		expirationTtl: 300,
	});

	return new Response(JSON.stringify({ success: true, message: 'Token registered' }), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

const generateSessionId = async (projectPath: string): Promise<string> => {
	const encoder = new TextEncoder();
	const data = encoder.encode(projectPath);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex.substring(0, 32);
};
