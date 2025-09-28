"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Folder, Terminal, Activity, FileText, Mic, Phone } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import CopyButton from "@/components/dashboard/copy-button"
import axios from "axios"
import { Button } from "@/components/ui/button"

const recentProjects = [
  {
    name: "copair-frontend",
    path: "/Users/dev/projects/copair-frontend",
    lastActive: "2 minutes ago",
    status: "active",
    icon: "⚛️",
  },
  {
    name: "api-gateway",
    path: "/Users/dev/projects/api-gateway",
    lastActive: "1 hour ago",
    status: "idle",
    icon: "🔧",
  },
  {
    name: "mobile-app",
    path: "/Users/dev/projects/mobile-app",
    lastActive: "Yesterday",
    status: "idle",
    icon: "📱",
  },
]

const recentActivity = [
  {
    type: "session",
    message: "Started voice session in copair-frontend",
    time: "5 minutes ago",
    icon: Mic,
  },
  {
    type: "edit",
    message: "Modified components/auth/login.tsx",
    time: "12 minutes ago",
    icon: FileText,
  },
  {
    type: "session",
    message: "Ended session (45 minutes)",
    time: "1 hour ago",
    icon: Activity,
  },
]

export default function DashboardPage() {
  const [token] = useState(crypto.randomUUID());
  const [status, setStatus] = useState('waiting');
  const [projectInfo, setProjectInfo] = useState<{ name: string, sessionId: string, projectId: string } | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);

   useEffect(() => {
    // register token with backend
    const registerToken = async () => {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/register-token`, { token });
        if (res.status === 200) {
            startPolling();
        }
    }

    registerToken();
   }, [])

   const startPolling = async () => {
        const interval = setInterval(async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/check-token?token=${token}`);
            const data = res.data;

            if (data.status === 'connected') {
                clearInterval(interval);
                setStatus('connected');
                setProjectInfo({
                  name: data.projectName,
                  sessionId: data.sessionId,
                  projectId: data.projectId
                });

                // move to next step
                setUpMeeting(data.projectId);
        }

        }, 2000);
    }

    const setUpMeeting = async (projectId: string) => {
        // get or create meetingId for this project
        const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/create-meeting`, { projectId });
        const data = res.data;

        setStatus('ready-to-join');
        setMeetingId(data.meetingId);


    }

    const joinSession = async (meetingId: string) => {
        // get auth token for the user to join the meeting
        const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/create-participant`, { meetingId, participantName: projectInfo?.name });
        const {authToken} = res.data;

        initMeeting({
          authToken,
          defaults: { audio: true, video: true },
        });

        setStatus('in-call');
    }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="w-80 border-r border-border/50 glass h-screen sticky top-16">
          <div className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Recent Projects
            </h2>
            <div className="space-y-2">
              {recentProjects.map((project, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-100 cursor-pointer hover:bg-accent/50",
                    project.status === "active" ? "border-primary/50 bg-primary/5" : "border-border/50 glass-card",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{project.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        {project.status === "active" && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{project.path}</p>
                      <p className="text-xs text-muted-foreground">{project.lastActive}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Welcome Header */}
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, Alex</h1>
              <p className="text-muted-foreground">Ready to continue coding with your voice?</p>
            </div>

            {/* Active Session Card */}
            {/* <Card className="glass-card gradient-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Active Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">copair-frontend</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      45 minutes active
                    </p>
                  </div>
                  <Button className="bg-gradient-to-r from-primary to-primary/80">
                    <Play className="w-4 h-4 mr-2" />
                    Rejoin Session
                  </Button>
                </div>
              </CardContent>
            </Card> */}

            {/* Quick Start Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Connect your project with this command:</p>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm flex items-center justify-between">
                    <code>npx copair --token={token}</code>
                    <CopyButton token={token} />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {status === 'waiting' && 'Waiting for connection...'}
                    {status === 'connected' && 'CLI Connected'}
                    {status === 'ready-to-join' && 'Ready to join session'}
                    {status === 'in-call' && 'In call'}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    {status === 'ready-to-join' && 'Project Syncing'}
                    {status === 'in-call' && 'In call'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {status === 'ready-to-join' && meetingId && <Button onClick={() => joinSession(meetingId)}>
              <Phone className="w-4 h-4 mr-2" />
              Join Session
            </Button>}

            {/* Recent Activity */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                        <activity.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
