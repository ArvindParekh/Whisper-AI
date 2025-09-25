"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, User, Bot, Copy, ThumbsUp, ThumbsDown, MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  codeSnippet?: string
  fileName?: string
}

interface LiveConversationDisplayProps {
  isCallActive: boolean
}

export function LiveConversationDisplay({ isCallActive }: LiveConversationDisplayProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Simulate conversation when call is active
  useEffect(() => {
    if (isCallActive && messages.length === 0) {
      // Add initial messages
      const initialMessages: Message[] = [
        {
          id: "1",
          type: "ai",
          content:
            "Hello! I can see your React project. I'm ready to help you with any coding questions or improvements.",
          timestamp: new Date(),
        },
        {
          id: "2",
          type: "user",
          content: "Can you help me optimize this component?",
          timestamp: new Date(Date.now() + 1000),
        },
        {
          id: "3",
          type: "ai",
          content:
            "I can see the component you're referring to. Let me suggest some optimizations using React.memo and useMemo to prevent unnecessary re-renders.",
          timestamp: new Date(Date.now() + 2000),
          codeSnippet: `const OptimizedComponent = React.memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true
    }))
  }, [data])

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} data={item} onUpdate={onUpdate} />
      ))}
    </div>
  )
})`,
          fileName: "components/optimized-component.tsx",
        },
      ]
      setMessages(initialMessages)
    }
  }, [isCallActive])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Code copied",
        description: "Code snippet copied to clipboard.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      })
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!isCallActive) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Live Conversation
          </CardTitle>
          <CardDescription>Your conversation history will appear here during voice sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">No Active Conversation</h3>
              <p className="text-sm text-muted-foreground">
                Start a voice session to begin chatting with your AI pair programmer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Live Conversation
            </CardTitle>
            <CardDescription>Real-time conversation with your AI pair programmer.</CardDescription>
          </div>
          <Badge variant="default" className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "user" ? "bg-primary" : "bg-accent"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Bot className="w-4 h-4 text-accent-foreground" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 space-y-2 ${message.type === "user" ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{message.type === "user" ? "You" : "AI Assistant"}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                  </div>

                  <div
                    className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>

                  {/* Code Snippet */}
                  {message.codeSnippet && (
                    <div className="bg-black/50 rounded-lg p-4 border max-w-[90%]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                          </div>
                          {message.fileName && (
                            <span className="text-xs text-muted-foreground">{message.fileName}</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(message.codeSnippet!)}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <pre className="text-xs font-mono text-foreground overflow-x-auto">
                        <code>{message.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* Message Actions */}
                  {message.type === "ai" && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">AI Assistant</span>
                    <span className="text-xs text-muted-foreground">typing...</span>
                  </div>
                  <div className="inline-block p-3 rounded-lg bg-muted">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Conversation Stats */}
        <div className="border-t mt-4 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">{messages.length} messages</span>
              <span className="text-muted-foreground">
                {messages.filter((m) => m.codeSnippet).length} code snippets
              </span>
            </div>
            <Button variant="outline" size="sm">
              Export Chat
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
