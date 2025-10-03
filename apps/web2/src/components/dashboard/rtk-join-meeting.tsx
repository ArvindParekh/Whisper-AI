
import { useRealtimeKitMeeting } from "@cloudflare/realtimekit-react";
import { RtkButton } from "@cloudflare/realtimekit-react-ui";

export default function RtkJoin() {
   const { meeting } = useRealtimeKitMeeting();

   return (
      <RtkButton
         size='lg'
         onClick={async () => {
            await meeting.join();
         }}
      >
         Join
      </RtkButton>
   );
}
