"use client"

import { useState, useEffect } from "react"
import axios from "axios"

type ConnectionStatus = "generating-token" | "waiting" | "connected" | "ready-to-join" | "error"

interface ProjectInfo {
  name: string
  sessionId: string
  projectId: string
}

export function useConnection() {
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("generating-token")
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [meetingId, setMeetingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Generate token
  useEffect(() => {
    const generateToken = () => {
      const newToken = crypto.randomUUID()
      setToken(newToken)
      setStatus("waiting")
    }
    generateToken()
  }, [])

  // Register token and poll for connection
  useEffect(() => {
    if (!token || status !== "waiting") return

    const registerAndPoll = async () => {
      try {
        // Register token with backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
        if (!backendUrl) {
          console.log("Backend URL not configured, using mock data")
          return
        }

        await axios.post(`${backendUrl}/api/register-token`, { token })

        // Start polling for connection
        const pollInterval = setInterval(async () => {
          try {
            const res = await axios.get(`${backendUrl}/api/check-token?token=${token}`)
            const data = res.data
            console.log(data);

            if (data.message === "connected") {
              clearInterval(pollInterval)
              setStatus("connected")
              setProjectInfo({
                name: data.projectName,
                sessionId: data.sessionId,
                projectId: data.projectId,
              })

              // Set up meeting
              setupMeeting(data.projectId)
            }
          } catch (err) {
            console.error("Polling error:", err)
          }
        }, 2000)

        return () => clearInterval(pollInterval)
      } catch (err) {
        console.error("Registration error:", err)
        setError("Failed to register token")
        setStatus("error")
      }
    }

    registerAndPoll()
  }, [token, status])

  const setupMeeting = async (projectId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      if (!backendUrl) return

      const res = await axios.post(`${backendUrl}/api/create-meeting`, { projectId })
      const data = res.data

      setMeetingId(data.meetingId)
      setStatus("ready-to-join")
    } catch (err) {
      console.error("Meeting setup error:", err)
      setError("Failed to set up meeting")
      setStatus("error")
    }
  }

  return {
    token,
    status,
    projectInfo,
    meetingId,
    error,
  }
}

