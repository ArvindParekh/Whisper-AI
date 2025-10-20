import { corsMiddleware } from './cors';

// handles preflight option requests
export const preflightMiddleware = (request: Request): Response | undefined => {
	if (request.method === 'OPTIONS') {
		return corsMiddleware(
			new Response(null, {
				status: 204,
			}),
		);
	}
	return;
};
