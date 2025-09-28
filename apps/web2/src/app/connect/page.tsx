"use client"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Terminal, Copy, CheckCircle, Folder, Mic, Play, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const steps = [
  {
    id: 1,
    title: "Connect CLI",
    description: "Run the command in your project directory",
    icon: Terminal,
  },
  {
    id: 2,
    title: "Project Sync",
    description: "Analyzing your codebase structure",
    icon: Folder,
  },
  {
    id: 3,
    title: "Start Session",
    description: "Launch your voice coding session",
    icon: Mic,
  },
]

const projectFiles = [
  "src/components/ui/button.tsx",
  "src/lib/utils.ts",
  "package.json",
  "tsconfig.json",
  "src/app/layout.tsx",
  "src/components/navigation.tsx",
  "src/hooks/use-auth.ts",
  "src/types/index.ts",
]

export default function ConnectPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [copiedToken, setCopiedToken] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [fileCount, setFileCount] = useState(0)
  const [isSessionReady, setIsSessionReady] = useState(false)

  const token = "cp_1a2b3c4d5e6f7g8h9i0j"

  const copyToken = () => {
    navigator.clipboard.writeText(`npx copair --token=${token}`)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  // Simulate connection flow
  useEffect(() => {
    if (currentStep === 1) {
      // Simulate CLI connection after 3 seconds
      const timer = setTimeout(() => {
        setIsConnected(true)
        setCurrentStep(2)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  useEffect(() => {
    if (currentStep === 2) {
      // Simulate file sync progress
      const interval = setInterval(() => {
        setSyncProgress((prev) => {
          const newProgress = prev + Math.random() * 15
          if (newProgress >= 100) {
            setCurrentStep(3)
            setIsSessionReady(true)
            return 100
          }
          return newProgress
        })

        setFileCount((prev) => {
          const newCount = prev + Math.floor(Math.random() * 3) + 1
          return Math.min(newCount, projectFiles.length)
        })
      }, 500)

      return () => clearInterval(interval)
    }
  }, [currentStep])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Connect Your Project</h1>
            <p className="text-muted-foreground text-lg">Get started with voice coding in three simple steps</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300",
                    currentStep >= step.id ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      currentStep > step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.id
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <span className="font-medium hidden sm:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-2 transition-all duration-300",
                      currentStep > step.id ? "bg-primary" : "bg-muted",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-8">
            {/* Step 1: Connect CLI */}
            {currentStep >= 1 && (
              <Card
                className={cn(
                  "glass-card transition-all duration-500",
                  currentStep === 1 ? "ring-2 ring-primary/20" : "",
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Step 1: Connect CLI
                    {currentStep > 1 && (
                      <Badge variant="secondary" className="ml-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Run this command in your project directory to establish connection:
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm flex items-center justify-between">
                    <code>npx copair --token={token}</code>
                    <Button variant="ghost" size="sm" onClick={copyToken} className="ml-2">
                      {copiedToken ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  {currentStep === 1 && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-muted-foreground">Waiting for connection...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Project Sync */}
            {currentStep >= 2 && (
              <Card
                className={cn(
                  "glass-card transition-all duration-500",
                  currentStep === 2 ? "ring-2 ring-primary/20" : "",
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="w-5 h-5" />
                    Step 2: Project Sync
                    {currentStep > 2 && (
                      <Badge variant="secondary" className="ml-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Analyzing your project structure and dependencies...</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Scanning files...</span>
                      <span className="text-muted-foreground">
                        {fileCount}/{projectFiles.length} files
                      </span>
                    </div>
                    <Progress value={syncProgress} className="h-2" />
                  </div>

                  {currentStep >= 2 && (
                    <div className="bg-muted/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <div className="text-xs font-mono space-y-1">
                        {projectFiles.slice(0, fileCount).map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {file}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Start Session */}
            {currentStep >= 3 && (
              <Card
                className={cn(
                  "glass-card transition-all duration-500",
                  currentStep === 3 ? "ring-2 ring-primary/20" : "",
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Step 3: Start Session
                    {isSessionReady && (
                      <Badge variant="secondary" className="ml-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    Your project is ready! Configure your session and start coding with voice.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Audio Settings</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Microphone detected
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Project Info</h4>
                      <div className="text-sm text-muted-foreground">
                        {projectFiles.length} files • TypeScript • React
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">Ready to launch</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Estimated setup time: ~3 seconds
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-100 shadow-lg hover:shadow-primary/25"
                      disabled={!isSessionReady}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Launch Voice Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
