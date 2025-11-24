import axios from 'axios';

export const apiCreateMeeting = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const { sessionId } = (await request.json()) as { sessionId: string };

	// Always create a fresh meeting - reusing meetings causes stale participant state
	const response = await axios.post(
		`https://api.realtime.cloudflare.com/v2/meetings`,
		{ title: `Session ${sessionId} - ${Date.now()}` },
		{
			headers: {
				Authorization: `${env.REALTIME_KIT_AUTH_HEADER}`,
				'Content-Type': 'application/json',
			},
		},
	);

	const meetingId = response.data.data.id;
	// Store mapping for routing (overwrites any previous meeting for this session)
	await env.WHISPER_TOKEN_STORE.put(`meeting:${sessionId}`, meetingId);
	await env.WHISPER_TOKEN_STORE.put(`session:${meetingId}`, sessionId);

	return Response.json({ meetingId });
};

export const apiCreateParticipant = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const { meetingId, participantName } = (await request.json()) as {
		meetingId: string;
		participantName: string;
	};

	// Use unique participant ID each time to avoid stale state from reused participants
	const uniqueParticipantId = `user-${meetingId}-${Date.now()}`;
	const response = await axios.post(
		`https://api.realtime.cloudflare.com/v2/meetings/${meetingId}/participants`,
		{
			name: participantName,
			preset_name: 'Whisper',
			custom_participant_id: uniqueParticipantId,
		},
		{ headers: { Authorization: `${env.REALTIME_KIT_AUTH_HEADER}` } },
	);

	const { token } = response.data.data;
	return Response.json({ authToken: token });
};
