"use client";

import MyMeeting from "@/components/dashboard/meeting";
import axios from "axios";

import { useEffect, useState } from "react";

export default function MeetingPage() {
   // const { id } = params;
   const [authToken, setAuthToken] = useState<string | null>(
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6ImIwZmVhMzc4LTkwZjEtNDZkMy05OWVjLTRmOTRkYWQ4NTgwNiIsIm1lZXRpbmdJZCI6ImJiYmZjZmYwLTE0Y2YtNGJlYy05ZTM3LWEzNWQ4OWZlY2Y3ZSIsInBhcnRpY2lwYW50SWQiOiJhYWFhYWMzNi00ODY3LTRhODQtOGJmOS0yZmRhZTQ5OTEwZWUiLCJwcmVzZXRJZCI6IjgwOGZkMjNiLWNjYjYtNGNkZS05YjA4LWQ5NTI0Zjc5ZTVjNyIsImlhdCI6MTc1OTUxOTA5NywiZXhwIjoxNzYwMTIzODk3fQ.SXX-iwtcLFc4fHP75EI15NXQIMs--4J4OuovYKePb3Tic0onNMXqd4mI35q6-rnoze6WM7liVkFHDlto6rFEZBbopox0e5OJrLFETsK2EgMRwcuCy28k7b7-mcDsYLevgQWVkyIIM0VjGRXr3McR4hSRofWLzjuRq2s1m_jsxS79Qh6Q3Hoz8GCA9oaIZBumeCbzHvfVQPGIVlimhyMg-Izgcwt-7EcXcyQ5TNxhxebFb8u95ZCkmr2dquZpvGmhZV2xF0EQ3TA7CqrExgg_PKCfSC0cDxcpQxt6wmk0r8WZy6IrVRmCE1ughbR9HBSuUijdjDkXHzC25WPlu96o-Dg"
   );

   useEffect(() => {
      // call add participant here
      const addParticipant = async () => {
         const res = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/create-participant`,
            {
               meetingId: "bbb1e912-0aef-49a6-8be6-b98f7c499034",
               participantName: "John Doe",
            } //TODO: change this later
         );
         console.log(res.data);
         const data = res.data;
         setAuthToken(data.authToken);
      };
      addParticipant();
   }, []);

   return <div>{authToken && <MyMeeting authToken={authToken} />}</div>;
}
