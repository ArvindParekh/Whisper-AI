"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { VoiceVideoCall } from "@/components/voice-video-call"
import { LiveConversationDisplay } from "@/components/live-conversation-display"
import { ProjectContextSidebar } from "@/components/project-context-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, MessageSquare, FileText, Settings } from "lucide-react"

export function SessionPage() {
  const [activeTab, setActiveTab] = useState("call")

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Session</h1>
                <p className="text-muted-foreground mt-1">Your AI pair programming companion</p>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                Session Ready
              </Badge>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="call" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Call
                </TabsTrigger>
                <TabsTrigger value="conversation" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversation
                </TabsTrigger>
                <TabsTrigger value="context" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Context
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="call" className="mt-6">
                <VoiceVideoCall />
              </TabsContent>

              <TabsContent value="conversation" className="mt-6">
                <LiveConversationDisplay />
              </TabsContent>

              <TabsContent value="context" className="mt-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Project Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectContextSidebar />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Session Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">Configure your AI session preferences</p>
                      <Button variant="outline">Configure AI Model</Button>
                      <Button variant="outline">Audio Preferences</Button>
                      <Button variant="outline">Code Context Settings</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
