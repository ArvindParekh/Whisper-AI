"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Mic,
  Video,
  Code,
  Clock,
  Bell,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Square,
  ChevronDown,
  Check,
  AlertCircle,
  Info,
  Zap,
  TrendingUp,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

const recentSessions = [
  {
    id: 1,
    title: "React Component Refactoring",
    duration: "45 min",
    date: "2 hours ago",
    status: "completed",
    participants: 2,
    type: "voice",
  },
  {
    id: 2,
    title: "API Integration Debug",
    duration: "32 min",
    date: "1 day ago",
    status: "completed",
    participants: 1,
    type: "video",
  },
  {
    id: 3,
    title: "Database Schema Design",
    duration: "1h 15min",
    date: "3 days ago",
    status: "completed",
    participants: 3,
    type: "voice",
  },
]

const aiInsights = [
  {
    type: "suggestion",
    title: "Code Optimization Opportunity",
    description: "Your React components could benefit from useMemo optimization",
    impact: "high",
    time: "5 min ago",
  },
  {
    type: "warning",
    title: "Potential Memory Leak",
    description: "Detected uncleaned event listeners in useEffect hooks",
    impact: "medium",
    time: "1 hour ago",
  },
  {
    type: "info",
    title: "New Best Practice",
    description: "Consider using React Server Components for better performance",
    impact: "low",
    time: "2 hours ago",
  },
]

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
]

export function AdvancedDashboard() {
  const [selectedFramework, setSelectedFramework] = useState("next.js")
  const [open, setOpen] = useState(false)
  const [sessionProgress, setSessionProgress] = useState(75)

  return (
    <div className="space-y-6">
      {/* Header with Command Palette */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Manage your AI pair programming sessions</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Command Palette */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-64 justify-start text-muted-foreground bg-transparent">
                <Search className="w-4 h-4 mr-2" />
                Search sessions, files, or ask AI...
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Command Palette</DialogTitle>
                <DialogDescription>Search for sessions, files, or ask your AI assistant</DialogDescription>
              </DialogHeader>
              <Command className="rounded-lg border shadow-md">
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Recent Sessions">
                    <CommandItem>
                      <Mic className="mr-2 h-4 w-4" />
                      <span>React Component Refactoring</span>
                    </CommandItem>
                    <CommandItem>
                      <Video className="mr-2 h-4 w-4" />
                      <span>API Integration Debug</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandGroup heading="AI Actions">
                    <CommandItem>
                      <Code className="mr-2 h-4 w-4" />
                      <span>Review my code</span>
                    </CommandItem>
                    <CommandItem>
                      <Zap className="mr-2 h-4 w-4" />
                      <span>Optimize performance</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>

          {/* Framework Selector */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between bg-transparent"
              >
                {selectedFramework
                  ? frameworks.find((framework) => framework.value === selectedFramework)?.label
                  : "Select framework..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search framework..." />
                <CommandEmpty>No framework found.</CommandEmpty>
                <CommandGroup>
                  {frameworks.map((framework) => (
                    <CommandItem
                      key={framework.value}
                      value={framework.value}
                      onSelect={(currentValue) => {
                        setSelectedFramework(currentValue === selectedFramework ? "" : currentValue)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedFramework === framework.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {framework.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative bg-transparent">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-2 p-2">
                <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New AI insight available</p>
                    <p className="text-xs text-muted-foreground">Code optimization suggestion for your React app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Session completed</p>
                    <p className="text-xs text-muted-foreground">React Component Refactoring - 45 minutes</p>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+12%</span> from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Saved</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18.5</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+8.2h</span> this week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+2%</span> improvement
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-500">2</span> new this week
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Recent Sessions */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your latest AI pair programming sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {recentSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: session.id * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {session.type === "voice" ? (
                              <Mic className="w-4 h-4 text-primary" />
                            ) : (
                              <Video className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{session.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.duration} • {session.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            {session.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Download Recording</DropdownMenuItem>
                              <DropdownMenuItem>Share</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Current Session Status */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Current Session</CardTitle>
                <CardDescription>Active AI assistance session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Progress</span>
                  <span className="text-sm text-muted-foreground">{sessionProgress}%</span>
                </div>
                <Progress value={sessionProgress} className="w-full" />

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI Assistant</p>
                      <p className="text-xs text-muted-foreground">Ready to help</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                      Online
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                    <Button size="sm" variant="outline">
                      <Pause className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Square className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights & Recommendations</CardTitle>
              <CardDescription>Personalized suggestions to improve your code and workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Alert
                      className={cn(
                        insight.type === "warning" && "border-orange-200 bg-orange-50",
                        insight.type === "suggestion" && "border-blue-200 bg-blue-50",
                        insight.type === "info" && "border-gray-200 bg-gray-50",
                      )}
                    >
                      {insight.type === "warning" && <AlertCircle className="h-4 w-4" />}
                      {insight.type === "suggestion" && <Zap className="h-4 w-4" />}
                      {insight.type === "info" && <Info className="h-4 w-4" />}
                      <AlertTitle className="flex items-center justify-between">
                        {insight.title}
                        <Badge
                          variant="outline"
                          className={cn(
                            insight.impact === "high" && "border-red-200 text-red-600",
                            insight.impact === "medium" && "border-orange-200 text-orange-600",
                            insight.impact === "low" && "border-blue-200 text-blue-600",
                          )}
                        >
                          {insight.impact} impact
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        {insight.description}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">{insight.time}</span>
                          <Button size="sm" variant="outline">
                            Apply Fix
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
