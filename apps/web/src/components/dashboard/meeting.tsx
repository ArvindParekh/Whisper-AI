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

  const cleanup = useCallback(async () => {
    if (hasCleanedUp.current) return;
    hasCleanedUp.current = true;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl || !meetingId) return;

    try {
      await fetch(`${backendUrl}/deinit?meetingId=${meetingId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AGENT_AUTH_TOKEN}`,
        },
      });
    } catch (error) {
      console.error("Failed to cleanup agent:", error);
    }
  }, [meetingId]);

  // Initialize meeting client
  useEffect(() => {
    initMeeting({
      authToken,
      defaults: { audio: true, video: true },
    });
  }, [authToken, initMeeting]);

  // Cleanup on room leave
  useEffect(() => {
    if (!meeting) return;

    const onRoomLeft = () => cleanup();
    meeting.self.on("roomLeft", onRoomLeft);

    return () => {
      meeting.self.off("roomLeft", onRoomLeft);
    };
  }, [meeting, cleanup]);

  // Cleanup on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (backendUrl && meetingId && !hasCleanedUp.current) {
        navigator.sendBeacon(`${backendUrl}/deinit?meetingId=${meetingId}`);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [meetingId]);

  return (
    <RealtimeKitProvider value={meeting}>
      <MyMeetingUI />
    </RealtimeKitProvider>
  );
}
