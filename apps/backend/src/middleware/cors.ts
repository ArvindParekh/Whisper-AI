const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// adds cors headers to all outgoing responses
export const corsMiddleware = (response: Response): Response => {
	const newHeaders = new Headers(response.headers);
	Object.entries(corsHeaders).forEach(([key, value]) => {
		newHeaders.set(key, value);
	});

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: newHeaders,
	});
};
