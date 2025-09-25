"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, RefreshCw, Terminal, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SessionSetupPanelProps {
  sessionId: string
  onSessionIdGenerated: (id: string) => void
}

export function SessionSetupPanel({ sessionId, onSessionIdGenerated }: SessionSetupPanelProps) {
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generateSessionId = () => {
    setIsGenerating(true)
    // Simulate session ID generation
    setTimeout(() => {
      const newId = Math.random().toString(36).substring(2, 15)
      onSessionIdGenerated(newId)
      setIsGenerating(false)
      toast({
        title: "Session ID Generated",
        description: "Your new session is ready to connect.",
      })
    }, 1000)
  }

  const copyCommand = async () => {
    const command = `npx @whisper/watcher --session=${sessionId}`
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "Run this command in your project directory.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the command manually.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!sessionId) {
      generateSessionId()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Session Setup</h2>
        <p className="text-muted-foreground">
          Generate a session ID and run the watcher command in your project directory.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Session ID Card */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Session ID
              </CardTitle>
              <Button variant="outline" size="sm" onClick={generateSessionId} disabled={isGenerating}>
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? "Generating..." : "New ID"}
              </Button>
            </div>
            <CardDescription>Your unique session identifier for this coding session.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="font-mono text-lg font-semibold text-center">{sessionId || "Generating..."}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-1" />
                  Active
                </Badge>
                <span className="text-xs text-muted-foreground">Expires in 24 hours</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NPX Command Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Installation Command
            </CardTitle>
            <CardDescription>Run this command in your project root to start file watching.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <div className="p-4 rounded-lg bg-black/50 border font-mono text-sm overflow-x-auto">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs">Terminal</span>
                  </div>
                  <div className="text-green-400">
                    $ <span className="text-foreground">npx @whisper/watcher --session={sessionId || "..."}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 bg-transparent"
                  onClick={copyCommand}
                  disabled={!sessionId}
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>This command will:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Install the Whisper file watcher</li>
                  <li>Sync your project files securely</li>
                  <li>Enable real-time code context</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Quick Setup Guide</CardTitle>
          <CardDescription>Follow these steps to get started with your AI pair programming session.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <h4 className="font-semibold">Generate Session</h4>
              <p className="text-sm text-muted-foreground">
                Click "New ID" to generate a unique session identifier for your project.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <h4 className="font-semibold">Run Command</h4>
              <p className="text-sm text-muted-foreground">
                Copy and run the NPX command in your project's root directory.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <h4 className="font-semibold">Start Coding</h4>
              <p className="text-sm text-muted-foreground">
                Once connected, start your voice session and begin pair programming.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
