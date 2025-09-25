"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRealtimeKit } from "@/hooks/use-realtime-kit"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Hand, 
  Users, 
  MoreHorizontal, 
  Phone,
  PhoneOff,
  Bot
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Participant {
  id: string
  name: string
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isAI?: boolean
  videoRef?: React.RefObject<HTMLVideoElement>
}

interface VideoCallInterfaceProps {
  meetingId: string
  participantId: string
  authToken: string
  onCallEnd?: () => void
}

export function VideoCallInterface({ 
  meetingId, 
  participantId, 
  authToken, 
  onCallEnd 
}: VideoCallInterfaceProps) {
  const {
    isConnected,
    isAudioEnabled,
    isVideoEnabled,
    isLoading,
    error,
    initialize,
    joinMeeting,
    leaveMeeting,
    toggleAudio,
    toggleVideo,
  } = useRealtimeKit()

  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: participantId,
      name: "You",
      isVideoEnabled: false,
      isAudioEnabled: false,
    },
    {
      id: "ai-participant",
      name: "AI",
      isVideoEnabled: false,
      isAudioEnabled: true,
      isAI: true,
    }
  ])

  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [aiJoined, setAiJoined] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const aiVideoRef = useRef<HTMLVideoElement>(null)

  // Initialize and join meeting on mount
  useEffect(() => {
    const initCall = async () => {
      try {
        await initialize({
          authToken,
          meetingId,
          participantId,
        })
        await joinMeeting()
        setAiJoined(true)
      } catch (err) {
        console.error("Failed to initialize call:", err)
      }
    }

    initCall()
  }, [authToken, meetingId, participantId, initialize, joinMeeting])

  // Handle video stream
  useEffect(() => {
    if (isConnected && localVideoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: isVideoEnabled, 
        audio: isAudioEnabled 
      }).then(stream => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      }).catch(err => {
        console.error("Failed to get media stream:", err)
      })
    }
  }, [isConnected, isVideoEnabled, isAudioEnabled])

  const handleToggleAudio = async () => {
    await toggleAudio()
    setParticipants(prev => 
      prev.map(p => 
        p.id === participantId 
          ? { ...p, isAudioEnabled: !p.isAudioEnabled }
          : p
      )
    )
  }

  const handleToggleVideo = async () => {
    await toggleVideo()
    setParticipants(prev => 
      prev.map(p => 
        p.id === participantId 
          ? { ...p, isVideoEnabled: !p.isVideoEnabled }
          : p
      )
    )
  }

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        setIsScreenSharing(true)
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        setIsScreenSharing(false)
      }
    } catch (err) {
      console.error("Screen share error:", err)
    }
  }

  const handleHandRaise = () => {
    setIsHandRaised(!isHandRaised)
  }

  const handleEndCall = async () => {
    await leaveMeeting()
    onCallEnd?.()
  }

  const handleRemoveAI = () => {
    setParticipants(prev => prev.filter(p => !p.isAI))
    setAiJoined(false)
  }

  const handleHoldToTalk = () => {
    // Implement hold-to-talk functionality
    console.log("Hold to talk to AI")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Connecting...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 flex">
        {/* Local Participant */}
        <div className="flex-1 relative border-2 border-orange-500">
          <div className="relative w-full h-full bg-gray-800">
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">
                    {participants.find(p => p.id === participantId)?.name.charAt(0)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Participant Info Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isAudioEnabled ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm font-medium">
                {participants.find(p => p.id === participantId)?.name}
              </span>
            </div>
          </div>
        </div>

        {/* AI Participant */}
        <div className="flex-1 relative border-2 border-orange-500">
          <div className="relative w-full h-full bg-black">
            {participants.find(p => p.isAI) ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center">
                  <Bot className="w-16 h-16 text-orange-500" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-gray-500">Waiting for AI...</div>
              </div>
            )}
            
            {/* AI Info Overlay */}
            {participants.find(p => p.isAI) && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">AI</span>
              </div>
            )}

            {/* AI Joined Notification */}
            {aiJoined && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md flex items-center gap-2">
                <span className="text-sm">AI joined</span>
                <button 
                  onClick={handleRemoveAI}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 p-4 flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveAI}
            className="bg-gray-700/50 text-white border-gray-600 hover:bg-gray-600 hover:border-gray-500 transition-all"
          >
            REMOVE AI
          </Button>
          <Button
            onClick={handleHoldToTalk}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            HOLD TO TALK TO AI
          </Button>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleAudio}
            className={cn(
              "text-white hover:bg-gray-700/50 transition-all",
              isAudioEnabled ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            )}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleVideo}
            className={cn(
              "text-white hover:bg-gray-700/50 transition-all",
              isVideoEnabled ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            )}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleScreenShare}
            className={cn(
              "text-white hover:bg-gray-700/50 transition-all",
              isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-500"
            )}
          >
            <Monitor className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHandRaise}
            className={cn(
              "text-white hover:bg-gray-700/50 transition-all",
              isHandRaised ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-600 hover:bg-gray-500"
            )}
          >
            <Hand className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowParticipants(!showParticipants)}
            className="text-white hover:bg-gray-700/50 bg-gray-600 hover:bg-gray-500 transition-all"
          >
            <Users className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-700/50 bg-gray-600 hover:bg-gray-500 transition-all"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEndCall}
            className="text-white hover:bg-red-600 bg-red-500 hover:bg-red-600 transition-all hover:shadow-lg hover:shadow-red-500/25"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
