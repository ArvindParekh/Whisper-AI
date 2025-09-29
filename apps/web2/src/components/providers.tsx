"use client"

import {
   RealtimeKitProvider,
   useRealtimeKitClient,
} from "@cloudflare/realtimekit-react";
import { useEffect } from "react";

export default function Providers() {
   const [meeting, initMeeting] = useRealtimeKitClient();

   useEffect(() => {
      initMeeting({
         authToken: "<auth-token>",
         defaults: {
            audio: true,
            video: false,
         },
      });
   }, []);

   return <RealtimeKitProvider value={meeting}>
        <MeetingUI />
   </RealtimeKitProvider>;
}
