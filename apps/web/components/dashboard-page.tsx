"use client"

import { motion } from "framer-motion"
import { Activity, Clock, Mic, Phone, TrendingUp, Users, Zap, Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const sessionData = [
  { time: "00:00", sessions: 0, quality: 95 },
  { time: "04:00", sessions: 2, quality: 98 },
  { time: "08:00", sessions: 8, quality: 96 },
  { time: "12:00", sessions: 15, quality: 94 },
  { time: "16:00", sessions: 12, quality: 97 },
  { time: "20:00", sessions: 6, quality: 99 },
  { time: "24:00", sessions: 1, quality: 98 },
]

const stats = [
  {
    title: "Active Sessions",
    value: "3",
    change: "+12%",
    icon: Activity,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Total Call Time",
    value: "2.4h",
    change: "+8%",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Voice Quality",
    value: "98%",
    change: "+2%",
    icon: Mic,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "AI Responses",
    value: "156",
    change: "+24%",
    icon: Brain,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
]

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor your AI co-pilot sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
            <Button className="bg-primary hover:bg-primary/90">
              <Phone className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Activity Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Session Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    sessions: {
                      label: "Sessions",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sessionData}>
                      <defs>
                        <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-xs" />
                      <YAxis axisLine={false} tickLine={false} className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="sessions"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#sessionGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Voice Processing</span>
                    <span className="text-green-500">98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">AI Response Time</span>
                    <span className="text-blue-500">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network Latency</span>
                    <span className="text-purple-500">96%</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Server Uptime</span>
                    <span className="text-green-500">99%</span>
                  </div>
                  <Progress value={99} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    time: "2 min ago",
                    action: "Voice session started",
                    user: "React Component Debug",
                    status: "active",
                  },
                  { time: "15 min ago", action: "Code review completed", user: "API Integration", status: "completed" },
                  {
                    time: "1 hour ago",
                    action: "Pair programming session",
                    user: "Database Schema",
                    status: "completed",
                  },
                  {
                    time: "3 hours ago",
                    action: "Bug fix assistance",
                    user: "Authentication Flow",
                    status: "completed",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${activity.status === "active" ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.user}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                      <Badge variant={activity.status === "active" ? "default" : "secondary"} className="text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
