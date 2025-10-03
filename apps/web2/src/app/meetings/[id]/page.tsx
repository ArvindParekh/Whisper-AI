"use client";

import MyMeeting from "@/components/dashboard/meeting";
import axios from "axios";
import { useParams } from "next/navigation";

import { useEffect, useState } from "react";

export default function MeetingPage() {
   const { id } = useParams<{ id: string }>();
   const [authToken, setAuthToken] = useState<string | null>(null);

   useEffect(() => {
      const addParticipant = async () => {
         const res = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/create-participant`,
            {
               meetingId: id,
               participantName: "John Doe",
            } //TODO: change this later
         );
         console.log(res.data);
         const data = res.data;
         setAuthToken(data.authToken);
      };
      addParticipant();
   }, []);

   return <div className="w-screen h-screen">{authToken && <MyMeeting authToken={authToken} />}</div>;
}
