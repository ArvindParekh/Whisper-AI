"use client"

import { VideoCallInterface } from "@/components/video-call-interface"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Video } from "lucide-react"

export default function VideoCallPage() {
  const [isInCall, setIsInCall] = useState(false)
  const [meetingId, setMeetingId] = useState("demo-meeting-123")
  const [participantId, setParticipantId] = useState("Ricky Robinett")
  const [authToken, setAuthToken] = useState("demo-token-123")

  const handleStartCall = () => {
    if (meetingId && participantId && authToken) {
      setIsInCall(true)
    }
  }

  const handleEndCall = () => {
    setIsInCall(false)
  }

  if (isInCall) {
    return (
      <VideoCallInterface
        meetingId={meetingId}
        participantId={participantId}
        authToken={authToken}
        onCallEnd={handleEndCall}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Video Call Setup</h1>
              <p className="text-gray-400 mt-1">Start a live video call with AI assistance</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="meetingId" className="text-white text-sm font-medium mb-3 block">
                  Meeting ID
                </Label>
                <Input
                  id="meetingId"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="Enter meeting ID"
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
                />
              </div>
              
              <div>
                <Label htmlFor="participantId" className="text-white text-sm font-medium mb-3 block">
                  Your Name
                </Label>
                <Input
                  id="participantId"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="authToken" className="text-white text-sm font-medium mb-3 block">
                Auth Token
              </Label>
              <Input
                id="authToken"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Enter auth token"
                className="bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
                type="password"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleStartCall}
                disabled={!meetingId || !participantId || !authToken}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 text-lg rounded-xl shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Start Video Call
              </Button>
              
              <Button
                onClick={() => {
                  setMeetingId("demo-meeting-123")
                  setParticipantId("Ricky Robinett")
                  setAuthToken("demo-token-123")
                }}
                variant="outline"
                className="flex-1 border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20 rounded-xl"
              >
                Use Demo Values
              </Button>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  Demo Mode
                </Badge>
                <span className="text-sm text-gray-400">Pre-configured for testing</span>
              </div>
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>Meeting ID:</strong> demo-meeting-123</p>
                <p><strong>Name:</strong> Ricky Robinett</p>
                <p><strong>Token:</strong> demo-token-123</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Powered by Cloudflare Realtime Kit
          </p>
        </div>
      </div>
    </div>
  )
}
