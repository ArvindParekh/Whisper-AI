const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// adds cors headers to all outgoing responses
export const corsMiddleware = (response: Response): Response => {
	return new Response(response.body, {
		headers: { ...response.headers, ...corsHeaders },
	});
};
