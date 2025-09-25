"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Wifi, WifiOff, Eye, Clock, FileText, AlertCircle, CheckCircle } from "lucide-react"

type AppState = "disconnected" | "file-watching" | "voice-ready" | "in-call" | "error"

interface ConnectionStatusDashboardProps {
  appState: AppState
  fileCount: number
}

export function ConnectionStatusDashboard({ appState, fileCount }: ConnectionStatusDashboardProps) {
  const [syncProgress, setSyncProgress] = useState(0)
  const [lastSync, setLastSync] = useState<Date>(new Date())

  // Simulate sync progress
  useEffect(() => {
    if (appState === "file-watching" || appState === "voice-ready" || appState === "in-call") {
      const interval = setInterval(() => {
        setSyncProgress((prev) => {
          const newProgress = prev + Math.random() * 10
          return newProgress > 100 ? 0 : newProgress
        })
        setLastSync(new Date())
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [appState])

  const getStatusColor = () => {
    switch (appState) {
      case "disconnected":
        return "bg-red-500"
      case "file-watching":
        return "bg-yellow-500"
      case "voice-ready":
        return "bg-blue-500"
      case "in-call":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = () => {
    switch (appState) {
      case "disconnected":
        return "Disconnected"
      case "file-watching":
        return "Syncing Files"
      case "voice-ready":
        return "Ready"
      case "in-call":
        return "In Call"
      case "error":
        return "Error"
      default:
        return "Unknown"
    }
  }

  const getStatusIcon = () => {
    switch (appState) {
      case "disconnected":
        return <WifiOff className="w-4 h-4" />
      case "file-watching":
        return <Eye className="w-4 h-4" />
      case "voice-ready":
        return <CheckCircle className="w-4 h-4" />
      case "in-call":
        return <Wifi className="w-4 h-4" />
      case "error":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Wifi className="w-4 h-4" />
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* File Count */}
      <div className="flex items-center gap-2 text-sm">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">{fileCount} files</span>
      </div>

      {/* Status Badge with Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
              {getStatusIcon()}
              <span className="text-sm">{getStatusText()}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Connection Status</h4>
                <div className="space-y-3">
                  {/* Current Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon()}
                      <span className="text-sm">{getStatusText()}</span>
                    </div>
                    <Badge variant={appState === "in-call" ? "default" : "secondary"}>{getStatusText()}</Badge>
                  </div>

                  {/* File Sync Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Files Synced</span>
                      <span className="font-medium">{fileCount}</span>
                    </div>
                    {(appState === "file-watching" || appState === "voice-ready" || appState === "in-call") && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Sync Progress</span>
                          <span className="text-muted-foreground">{Math.round(syncProgress)}%</span>
                        </div>
                        <Progress value={syncProgress} className="h-1" />
                      </div>
                    )}
                  </div>

                  {/* Last Sync */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Last sync: {lastSync.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Connection Health */}
              <div className="border-t pt-4">
                <h5 className="font-medium mb-3 text-sm">Connection Health</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">WebSocket</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">File Watcher</span>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          appState === "disconnected" ? "bg-red-400" : "bg-green-400"
                        }`}
                      />
                      <span className="text-xs">{appState === "disconnected" ? "Inactive" : "Active"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">AI Service</span>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${appState === "in-call" ? "bg-green-400" : "bg-yellow-400"}`}
                      />
                      <span className="text-xs">{appState === "in-call" ? "Active" : "Standby"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border-t pt-4">
                <h5 className="font-medium mb-3 text-sm">Session Stats</h5>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-primary">{fileCount}</div>
                    <div className="text-xs text-muted-foreground">Files Tracked</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-primary">{appState === "in-call" ? "Active" : "0"}</div>
                    <div className="text-xs text-muted-foreground">Voice Sessions</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}
