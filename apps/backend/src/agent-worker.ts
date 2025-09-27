export { WhisperSessionDurableObject } from './session.do';

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    const url = new URL(request.url);
    const meetingId = url.searchParams.get('meetingId');
    if (!meetingId) {
      return new Response(null, { status: 400 });
    }

    const agentId = meetingId;
    const agent = env.SESSIONS.idFromName(meetingId);
    const stub = env.SESSIONS.get(agent);
    // The fetch method is implemented for handling internal pipeline logic
    if (url.pathname.startsWith('/agentsInternal')) {
      return stub.fetch(request);
    }

    // Your logic continues here
    switch (url.pathname) {
      case '/init':
        // This is the authToken for joining a meeting, it can be passed
        // in query parameters as well if needed
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
          return new Response(null, { status: 401 });
        }

        // We just need the part after `Bearer `
        await stub.init(agentId, meetingId, authHeader.split(' ')[1]!, url.host, env.ACCOUNT_ID, env.API_TOKEN);

        return new Response(null, { status: 200 });
      case '/deinit':
        await stub.deinit();
        return new Response(null, { status: 200 });
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;