import { useEffect, useRef, useCallback } from "react";
import {
  RealtimeKitProvider,
  useRealtimeKitClient,
} from "@cloudflare/realtimekit-react";
import MyMeetingUI from "./my-meeting-ui";

interface MyMeetingProps {
  authToken: string;
  meetingId: string;
}

export default function MyMeeting({ authToken, meetingId }: MyMeetingProps) {
  const [meeting, initMeeting] = useRealtimeKitClient();
  const hasCleanedUp = useRef(false);

  // Cleanup function to call when leaving
  const cleanup = useCallback(async () => {
    if (hasCleanedUp.current) return;
    hasCleanedUp.current = true;

    console.log("[User] Cleaning up agent...");

    // Call deinit to clean up the backend agent
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (backendUrl && meetingId) {
        await fetch(`${backendUrl}/deinit?meetingId=${meetingId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_AGENT_AUTH_TOKEN}`,
          },
        });
        console.log("[User] Agent deinit called successfully");
      }
    } catch (error) {
      console.error("[User] Error calling deinit:", error);
    }
  }, [meetingId]);

  useEffect(() => {
    initMeeting({
      authToken: authToken,
      defaults: {
        audio: true,
        video: true,
      },
    });
  }, []);

  // Listen for meeting end/leave events from RtkMeeting UI
  useEffect(() => {
    if (!meeting) return;

    // Called when user clicks "Leave" or "End meeting for all"
    const onRoomLeft = () => {
      console.log("[User] Room left event fired");
      cleanup();
    };

    const onMeetingEnded = () => {
      console.log("[User] Meeting ended event fired");
      cleanup();
    };

    // Listen for room/meeting events
    meeting.self.on("roomLeft", onRoomLeft);
    meeting.meta.on("meetingEnded", onMeetingEnded);

    return () => {
      meeting.self.off("roomLeft", onRoomLeft);
      meeting.meta.off("meetingEnded", onMeetingEnded);
    };
  }, [meeting, cleanup]);

  // Also cleanup on beforeunload (tab close, refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability on page unload
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (backendUrl && meetingId && !hasCleanedUp.current) {
        navigator.sendBeacon(
          `${backendUrl}/deinit?meetingId=${meetingId}`,
          JSON.stringify({}),
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [meetingId]);

  useEffect(() => {
    if (!meeting) return;

    const onParticipantJoined = (participant: any) => {
      console.log(
        "[User] Participant joined:",
        participant.name,
        participant.id,
      );

      if (participant.tracks && participant.tracks.started) {
        participant.tracks.started.on("trackStarted", (track: any) => {
          console.log(
            `[User] Track started for ${participant.name}:`,
            track.kind,
          );
        });
      } else {
        console.warn("[User] Participant has no tracks object:", participant);
      }
    };

    meeting.participants.joined.on("participantJoined", onParticipantJoined);

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
