"use client"

import { WelcomeSection } from "@/components/dashboard/welcome-section"
import { ConnectionPanel } from "@/components/dashboard/connection-panel"
import { RecentSessions } from "@/components/dashboard/recent-sessions"
import { useConnection } from "@/hooks/use-connection"

export default function DashboardPage() {
  const { token, status, projectInfo, meetingId, error } = useConnection()

  return (
    <div className="min-h-screen px-6 py-20">
      <div className="container mx-auto max-w-5xl">
        <WelcomeSection />

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <ConnectionPanel
              token={token}
              status={status}
              meetingId={meetingId}
              projectInfo={projectInfo}
            />
          </div>
          <div>
            <RecentSessions />
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <p className="font-semibold">Connection Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
