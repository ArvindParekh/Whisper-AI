"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Settings,
  Volume2,
  VolumeX,
  Monitor,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useRealtimeKit } from "@/hooks/use-realtime-kit"

interface VoiceVideoCallProps {
  meetingId?: string
  participantId?: string
  onCallEnd?: () => void
}

export function VoiceVideoCall({
  meetingId = "whisper-session",
  participantId = "user-1",
  onCallEnd,
}: VoiceVideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [volume, setVolume] = useState([80])
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

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

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive && isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isCallActive, isConnected])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartCall = async () => {
    try {
      // Get auth token from API
      const response = await fetch("/api/realtime/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, participantId }),
      })

      const { authToken } = await response.json()

      await initialize({ authToken, meetingId, participantId })
      await joinMeeting()
      setIsCallActive(true)
      setCallDuration(0)
    } catch (err) {
      console.error("[v0] Failed to start call:", err)
    }
  }

  const handleEndCall = async () => {
    await leaveMeeting()
    setIsCallActive(false)
    setCallDuration(0)
    onCallEnd?.()
  }

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setIsScreenSharing(true)
        console.log("[v0] Screen sharing started")
      } else {
        setIsScreenSharing(false)
        console.log("[v0] Screen sharing stopped")
      }
    } catch (err) {
      console.error("[v0] Screen sharing error:", err)
    }
  }

  if (!isCallActive) {
    return (
      <Card className="w-full max-w-md mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Phone className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Start AI Session</h3>
            <p className="text-muted-foreground mb-6">Connect with your AI co-pilot for pair programming</p>
            <Button
              onClick={handleStartCall}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isLoading ? "Connecting..." : "Start Call"}
            </Button>
            {error && <p className="text-destructive text-sm mt-4">{error}</p>}
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
            <span className="text-sm text-muted-foreground">{formatDuration(callDuration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-muted/20">
          {/* Remote Video */}
          <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />

          {/* Local Video (Picture-in-Picture) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-border/50 bg-muted/50"
          >
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </motion.div>

          {/* AI Status Overlay */}
          <div className="absolute top-4 left-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">AI Co-Pilot Active</span>
              </div>
            </motion.div>
          </div>

          {/* Screen Sharing Indicator */}
          {isScreenSharing && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                <Monitor className="w-3 h-3 mr-1" />
                Screen Sharing
              </Badge>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6">
          <div className="flex items-center justify-center gap-4">
            {/* Audio Toggle */}
            <Button
              variant={isAudioEnabled ? "default" : "destructive"}
              size="lg"
              onClick={toggleAudio}
              className="rounded-full w-12 h-12 p-0"
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            {/* Video Toggle */}
            <Button
              variant={isVideoEnabled ? "default" : "destructive"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full w-12 h-12 p-0"
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            {/* Screen Share */}
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="lg"
              onClick={handleScreenShare}
              className="rounded-full w-12 h-12 p-0"
            >
              <Monitor className="w-5 h-5" />
            </Button>

            {/* End Call */}
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full w-12 h-12 p-0 bg-red-500 hover:bg-red-600"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-border/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Audio Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Audio Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Volume</span>
                        <div className="flex items-center gap-2">
                          <VolumeX className="w-4 h-4 text-muted-foreground" />
                          <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-20" />
                          <Volume2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Noise Cancellation</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  {/* Video Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Video Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">HD Quality</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Background Blur</span>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}
