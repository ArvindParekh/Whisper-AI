import { useEffect } from "react";
import {
  RealtimeKitProvider,
  useRealtimeKitClient,
} from "@cloudflare/realtimekit-react";
import MyMeetingUI from "./my-meeting-ui";

export default function MyMeeting({ authToken }: { authToken: string }) {
  const [meeting, initMeeting] = useRealtimeKitClient();

  useEffect(() => {
    initMeeting({
      authToken: authToken,
      defaults: {
        audio: true,
        video: true,
      },
    });
  }, []);

  useEffect(() => {
    if (!meeting) return;

    const onParticipantJoined = (participant: any) => {
      console.log("[User] Participant joined:", participant.name, participant.id);
      
      if (participant.tracks && participant.tracks.started) {
        participant.tracks.started.on("trackStarted", (track: any) => {
          console.log(`[User] Track started for ${participant.name}:`, track.kind);
        });
      } else {
        console.warn("[User] Participant has no tracks object:", participant);
      }
    };

    meeting.participants.joined.on("participantJoined", onParticipantJoined);

    // Log existing participants - commented out to fix type error
    // meeting.participants.getAll().forEach(onParticipantJoined);

    return () => {
      meeting.participants.joined.off("participantJoined", onParticipantJoined);
    };
  }, [meeting]);

  return (
    <RealtimeKitProvider value={meeting}>
      <MyMeetingUI />
    </RealtimeKitProvider>
  );
}
