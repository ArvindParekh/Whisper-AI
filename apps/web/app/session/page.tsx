"use client"

import { VideoCallInterface } from "@/components/video-call-interface"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy, Bot, Settings } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"

export default function Session() {
  const [isInCall, setIsInCall] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [npxCommand, setNpxCommand] = useState("")
  const [sessionId, setSessionId] = useState("")
  const { toast } = useToast()

  const NPX_COMMAND = `npx @whisper/watcher --session=`

  useEffect(() => {
    const uuid = self.crypto.randomUUID();
    setSessionId(uuid)
    setNpxCommand(`${NPX_COMMAND}${uuid}`)
  }, [])

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(npxCommand)
      toast({
        title: "Copied!",
        description: "NPX command copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy command",
        variant: "destructive",
      })
    }
  }

  const handleStartCall = () => {
    if (projectName.trim()) {
      setIsInCall(true)
    }
  }

  const handleEndCall = () => {
    setIsInCall(false)
  }

  if (isInCall) {
    return (
      <VideoCallInterface
        meetingId={sessionId}
        participantId={projectName}
        authToken="demo-token"
        onCallEnd={handleEndCall}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Session Configuration</h1>
              <p className="text-gray-400 mt-1">Configure your AI assistant and start your development session</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - System Prompt */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="space-y-6">
                <div>
                  <Label className="text-white text-sm font-medium mb-4 block">
                    System Prompt (Optional)
                  </Label>
                  <Textarea
                    placeholder="Enter a custom system prompt to guide the AI's behavior during your session..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[400px] bg-white/5 border-white/10 text-white placeholder-gray-400 resize-none focus:border-orange-500 focus:ring-orange-500/20 rounded-xl"
                  />
                  <p className="text-xs text-gray-400 mt-3">
                    Leave empty to use the default AI assistant behavior
                  </p>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-400 bg-white/5 rounded-lg p-4">
                  <Settings className="w-4 h-4" />
                  <span>Advanced settings available after starting the session</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Project Setup */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 sticky top-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-6">Start Session</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <Label className="text-white text-sm font-medium mb-3 block">
                        Project Name *
                      </Label>
                      <Input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="What's your project about?"
                        className="bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-sm font-medium mb-3 block">
                        NPX Command
                      </Label>
                      <div className="relative">
                        <div className="bg-black/20 border border-white/10 rounded-lg p-4 pr-12">
                          <code className="text-sm text-gray-300 font-mono break-all">
                            {npxCommand}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCopyCommand}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        Run this command in your project directory to start monitoring
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleStartCall}
                    disabled={!projectName.trim()}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 text-lg rounded-xl shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Start Meeting
                  </Button>
                </div>

                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Session ID:</span>
                    <span className="text-gray-300 font-mono">{sessionId}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>AI Assistant:</span>
                    <span className="text-gray-300">{systemPrompt ? "Custom" : "Default"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
