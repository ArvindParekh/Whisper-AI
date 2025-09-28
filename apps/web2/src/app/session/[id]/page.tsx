"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  ChevronLeft,
  ChevronRight,
  Folder,
  FileText,
  Clock,
  Activity,
  Lightbulb,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const fileTree = [
  {
    name: "src",
    type: "folder",
    children: [
      { name: "components", type: "folder" },
      { name: "hooks", type: "folder" },
      { name: "lib", type: "folder" },
      { name: "app", type: "folder" },
    ],
  },
  {
    name: "package.json",
    type: "file",
  },
  {
    name: "tsconfig.json",
    type: "file",
  },
]

const recentEdits = [
  {
    file: "components/auth/login.tsx",
    action: "Modified",
    time: "2 min ago",
    lines: "+12 -3",
  },
  {
    file: "hooks/use-auth.ts",
    action: "Created",
    time: "5 min ago",
    lines: "+45",
  },
  {
    file: "lib/utils.ts",
    action: "Modified",
    time: "8 min ago",
    lines: "+5 -1",
  },
]

const aiSuggestions = [
  "Add error handling to the login function",
  "Extract validation logic into a custom hook",
  "Consider adding loading states to the form",
]

export default function SessionPage({ params }: { params: { id: string } }) {
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [isListening, setIsListening] = useState(false)

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulate voice activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMuted) {
        setIsListening((prev) => !prev)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isMuted])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Top Bar */}
      <header className="glass border-b border-glass-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">copair-frontend</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDuration(sessionDuration)}
          </div>
          <Badge variant="secondary" className="text-xs">
            Connected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Collapsible Sidebar */}
        <aside
          className={cn(
            "border-r border-border/50 glass transition-all duration-300",
            sidebarCollapsed ? "w-12" : "w-80",
          )}
        >
          <div className="p-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="mb-4">
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>

            {!sidebarCollapsed && (
              <div className="space-y-6">
                {/* File Explorer */}
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Files
                  </h3>
                  <div className="space-y-1 text-sm">
                    {fileTree.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-1 rounded hover:bg-accent/50 cursor-pointer"
                      >
                        {item.type === "folder" ? (
                          <Folder className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <FileText className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Edits */}
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Edits
                  </h3>
                  <div className="space-y-2">
                    {recentEdits.map((edit, index) => (
                      <div key={index} className="p-2 rounded-lg bg-muted/30 text-xs">
                        <div className="font-medium truncate">{edit.file}</div>
                        <div className="flex items-center justify-between text-muted-foreground mt-1">
                          <span>{edit.action}</span>
                          <span>{edit.lines}</span>
                        </div>
                        <div className="text-muted-foreground">{edit.time}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Suggestions */}
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    AI Suggestions
                  </h3>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Session Area */}
        <main className="flex-1 flex flex-col">
          {/* Center Content - Voice Activity */}
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="glass-card p-12 text-center max-w-md">
              <div className="space-y-6">
                {/* Voice Activity Indicator */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-300",
                      isListening && !isMuted ? "bg-primary/20 ring-4 ring-primary/30 animate-pulse" : "bg-muted/50",
                    )}
                  >
                    {isMuted ? (
                      <MicOff className="w-8 h-8 text-muted-foreground" />
                    ) : (
                      <Mic
                        className={cn(
                          "w-8 h-8 transition-colors duration-300",
                          isListening ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                    )}
                  </div>
                  {isListening && !isMuted && (
                    <div className="absolute inset-0 w-24 h-24 rounded-full mx-auto border-2 border-primary/50 animate-ping"></div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {isListening && !isMuted ? "Listening..." : "Ready to code"}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {isMuted ? "Microphone is muted" : "Speak naturally to write code"}
                  </p>
                </div>

                {/* Live Transcription Area */}
                {isListening && !isMuted && (
                  <div className="bg-muted/30 rounded-lg p-4 text-left">
                    <div className="text-xs text-muted-foreground mb-2">Live transcription:</div>
                    <div className="font-mono text-sm">
                      "Create a new function called handleSubmit that validates the form data..."
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Bottom Controls */}
          <div className="border-t border-border/50 glass p-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "default" : "outline"}
                size="lg"
                onClick={() => setIsMuted(!isMuted)}
                className={cn("transition-all duration-100", isMuted && "bg-red-500 hover:bg-red-600 text-white")}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                variant={isSpeakerMuted ? "default" : "outline"}
                size="lg"
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={cn(
                  "transition-all duration-100",
                  isSpeakerMuted && "bg-red-500 hover:bg-red-600 text-white",
                )}
              >
                {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              <Button variant="destructive" size="lg" className="bg-red-500 hover:bg-red-600">
                <PhoneOff className="w-5 h-5 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
