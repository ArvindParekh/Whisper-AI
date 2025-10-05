"use client"

import MyMeeting from "@/components/dashboard/meeting"
import { MeetingHeader } from "@/components/meeting/meeting-header"
import axios from "axios"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function MeetingPage() {
  const { id } = useParams<{ id: string }>()
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    const addParticipant = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
        if (!backendUrl) {
          console.log("Backend URL not configured")
          return
        }

        const res = await axios.post(`${backendUrl}/api/create-participant`, {
          meetingId: id,
          participantName: "Developer",
        })
        const data = res.data
        setAuthToken(data.authToken)
      } catch (error) {
        console.error("Failed to create participant:", error)
      }
    }
    addParticipant()
  }, [id])

  return (
    <div className="h-screen flex flex-col">
      <MeetingHeader />
      <div className="flex-1">
        {authToken ? (
          <MyMeeting authToken={authToken} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-600/20 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-400">Connecting to session...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
