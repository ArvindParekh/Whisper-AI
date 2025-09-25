"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type AppState = "disconnected" | "file-watching" | "voice-ready" | "in-call" | "error"

interface VoiceInterfacePanelProps {
  appState: AppState
  isCallActive: boolean
  onCallToggle: (active: boolean) => void
  onStateChange: (state: AppState) => void
}

export function VoiceInterfacePanel({ appState, isCallActive, onCallToggle, onStateChange }: VoiceInterfacePanelProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const { toast } = useToast()

  // Simulate audio level animation
  useEffect(() => {
    if (isCallActive && isListening) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setAudioLevel(0)
    }
  }, [isCallActive, isListening])

  const handleStartCall = () => {
    if (appState !== "voice-ready" && appState !== "file-watching") {
      toast({
        title: "Not Ready",
        description: "Please ensure your project is connected first.",
        variant: "destructive",
      })
      return
    }

    onCallToggle(true)
    onStateChange("in-call")
    toast({
      title: "Call Started",
      description: "Your AI pair programmer is now listening.",
    })
  }

  const handleEndCall = () => {
    onCallToggle(false)
    setIsListening(false)
    onStateChange("voice-ready")
    toast({
      title: "Call Ended",
      description: "Session ended. You can start a new call anytime.",
    })
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: isMuted ? "AI can now hear you." : "AI cannot hear you.",
    })
  }

  const toggleListening = () => {
    if (!isCallActive) return
    setIsListening(!isListening)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Voice Interface</h2>
        <p className="text-muted-foreground">Control your voice session with your AI pair programmer.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Main Voice Control */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Voice Control
            </CardTitle>
            <CardDescription>Start or end your voice session with the AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Call Button */}
            <div className="flex flex-col items-center space-y-4">
              {!isCallActive ? (
                <Button
                  size="lg"
                  onClick={handleStartCall}
                  className="w-24 h-24 rounded-full pulse-glow"
                  disabled={appState === "disconnected" || appState === "error"}
                >
                  <Phone className="w-8 h-8" />
                </Button>
              ) : (
                <Button size="lg" variant="destructive" onClick={handleEndCall} className="w-24 h-24 rounded-full">
                  <PhoneOff className="w-8 h-8" />
                </Button>
              )}

              <div className="text-center">
                <div className="font-semibold">
                  {isCallActive ? "Call Active" : appState === "voice-ready" ? "Ready to Call" : "Not Ready"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isCallActive
                    ? "AI is listening and ready to help"
                    : appState === "voice-ready"
                      ? "Click to start your session"
                      : "Connect your project first"}
                </div>
              </div>
            </div>

            {/* Call Status */}
            <div className="flex justify-center">
              <Badge variant={isCallActive ? "default" : "secondary"} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isCallActive ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`}
                />
                {isCallActive ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Audio Controls */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Audio Controls
            </CardTitle>
            <CardDescription>Manage your microphone and audio settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Push to Talk */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Push to Talk</span>
                <Button
                  variant={isListening ? "default" : "outline"}
                  size="sm"
                  onClick={toggleListening}
                  disabled={!isCallActive}
                  className={isListening ? "pulse-glow" : ""}
                >
                  {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {isListening ? "Listening" : "Hold to Talk"}
                </Button>
              </div>

              {/* Audio Visualization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Audio Level</span>
                  <span className="text-muted-foreground">{Math.round(audioLevel)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mute Control */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Microphone</span>
              <Button variant="outline" size="sm" onClick={toggleMute} disabled={!isCallActive}>
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMuted ? "Muted" : "Active"}
              </Button>
            </div>

            {/* Voice Activity Indicator */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Voice Activity</div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-4 rounded-full transition-all duration-150 ${
                        isListening && audioLevel > i * 20 ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {isListening ? "Detecting speech..." : "No activity"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common voice commands and shortcuts for your AI session.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="font-medium text-sm mb-1">"Explain this code"</div>
              <div className="text-xs text-muted-foreground">Get detailed explanations</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="font-medium text-sm mb-1">"Refactor this function"</div>
              <div className="text-xs text-muted-foreground">Improve code structure</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="font-medium text-sm mb-1">"Add error handling"</div>
              <div className="text-xs text-muted-foreground">Enhance robustness</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="font-medium text-sm mb-1">"Write tests for this"</div>
              <div className="text-xs text-muted-foreground">Generate test cases</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
