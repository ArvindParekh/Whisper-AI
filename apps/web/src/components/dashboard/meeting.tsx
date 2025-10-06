import { useEffect } from "react";
import { RealtimeKitProvider, useRealtimeKitClient } from "@cloudflare/realtimekit-react";
import MyMeetingUI from "./my-meeting-ui";

export default function MyMeeting({ authToken }: { authToken: string }) {
   const [meeting, initMeeting ] = useRealtimeKitClient();

   useEffect(() => {
    initMeeting({
      authToken: authToken,
      defaults: {
        audio: true,
        video: true,
      },
    });
  }, []);

   return (
      <RealtimeKitProvider value={meeting}>
        <MyMeetingUI />
      </RealtimeKitProvider>
   );
}
