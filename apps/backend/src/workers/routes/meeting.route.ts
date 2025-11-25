import axios from 'axios';

export const apiCreateMeeting = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const { sessionId } = (await request.json()) as { sessionId: string };

	// Reuse existing meeting for this session if available
	let meetingId = await env.WHISPER_TOKEN_STORE.get(`meeting:${sessionId}`);

	if (!meetingId) {
		const response = await axios.post(
			`https://api.realtime.cloudflare.com/v2/meetings`,
			{ title: `Session ${sessionId}` },
			{
				headers: {
					Authorization: `${env.REALTIME_KIT_AUTH_HEADER}`,
					'Content-Type': 'application/json',
				},
			},
		);

		meetingId = response.data.data.id;
		await env.WHISPER_TOKEN_STORE.put(`meeting:${sessionId}`, meetingId!);
		await env.WHISPER_TOKEN_STORE.put(`session:${meetingId}`, sessionId);
	}

	return Response.json({ meetingId });
};

export const apiCreateParticipant = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const { meetingId, participantName } = (await request.json()) as {
		meetingId: string;
		participantName: string;
	};

	// Fresh participant each time to avoid stale state
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
