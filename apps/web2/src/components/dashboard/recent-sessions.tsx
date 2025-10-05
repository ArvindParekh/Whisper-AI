"use client"

import { Clock, Mic, Calendar } from "lucide-react"

const mockSessions = [
  {
    id: "1",
    projectName: "auth-service",
    duration: "45 min",
    date: "2 hours ago",
    topics: ["Refactoring", "Dependency Injection"],
  },
  {
    id: "2",
    projectName: "frontend-app",
    duration: "1h 20min",
    date: "Yesterday",
    topics: ["State Management", "Performance"],
  },
  {
    id: "3",
    projectName: "api-gateway",
    duration: "30 min",
    date: "2 days ago",
    topics: ["Error Handling", "Logging"],
  },
]

export function RecentSessions() {
  return (
    <div className="card-subtle p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-6">Recent Sessions</h2>

      <div className="space-y-3">
        {mockSessions.length > 0 ? (
          mockSessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{session.projectName}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    {session.date}
                    <span>•</span>
                    {session.duration}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {session.topics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-orange-600/10 text-xs text-orange-400"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Mic className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No sessions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

