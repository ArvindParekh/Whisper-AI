"use client"

import { useState } from "react"
import { HeroSection } from "./hero-section"
import { SessionSetupPanel } from "./session-setup-panel"
import { VoiceInterfacePanel } from "./voice-interface-panel"
import { ConnectionStatusDashboard } from "./connection-status-dashboard"
import { LiveConversationDisplay } from "./live-conversation-display"
import { ProjectContextSidebar } from "./project-context-sidebar"

type AppState = "disconnected" | "file-watching" | "voice-ready" | "in-call" | "error"

export function WhisperApp() {
  const [appState, setAppState] = useState<AppState>("disconnected")
  const [sessionId, setSessionId] = useState<string>("")
  const [fileCount, setFileCount] = useState(0)
  const [isCallActive, setIsCallActive] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="relative z-10">
        {appState === "disconnected" && <HeroSection onStartSession={() => setAppState("file-watching")} />}

        {appState !== "disconnected" && (
          <div className="flex h-screen">
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <header className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">W</span>
                    </div>
                    <h1 className="text-xl font-semibold">Whisper</h1>
                  </div>
                  <ConnectionStatusDashboard appState={appState} fileCount={fileCount} />
                </div>
              </header>

              {/* Main Content Area */}
              <div className="flex-1 flex">
                <div className="flex-1 p-6 space-y-6">
                  <SessionSetupPanel sessionId={sessionId} onSessionIdGenerated={setSessionId} />

                  <VoiceInterfacePanel
                    appState={appState}
                    isCallActive={isCallActive}
                    onCallToggle={setIsCallActive}
                    onStateChange={setAppState}
                  />

                  <LiveConversationDisplay isCallActive={isCallActive} />
                </div>

                <ProjectContextSidebar fileCount={fileCount} onFileCountChange={setFileCount} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
