"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  Code,
  ChevronRight,
  ChevronDown,
  Clock,
  Activity,
  BarChart3,
  X,
} from "lucide-react"

interface FileNode {
  name: string
  type: "file" | "folder"
  path: string
  children?: FileNode[]
  lastModified?: Date
  size?: number
  language?: string
}

interface RecentChange {
  id: string
  fileName: string
  action: "created" | "modified" | "deleted"
  timestamp: Date
}

interface ProjectContextSidebarProps {
  fileCount: number
  onFileCountChange: (count: number) => void
}

export function ProjectContextSidebar({ fileCount, onFileCountChange }: ProjectContextSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src", "components"]))
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([])
  const [projectStats, setProjectStats] = useState({
    totalFiles: 0,
    totalLines: 0,
    languages: {} as Record<string, number>,
  })

  // Mock file tree data
  const fileTree: FileNode[] = [
    {
      name: "src",
      type: "folder",
      path: "src",
      children: [
        {
          name: "components",
          type: "folder",
          path: "src/components",
          children: [
            {
              name: "Header.tsx",
              type: "file",
              path: "src/components/Header.tsx",
              lastModified: new Date(Date.now() - 1000 * 60 * 5),
              size: 2340,
              language: "typescript",
            },
            {
              name: "Sidebar.tsx",
              type: "file",
              path: "src/components/Sidebar.tsx",
              lastModified: new Date(Date.now() - 1000 * 60 * 15),
              size: 1890,
              language: "typescript",
            },
            {
              name: "ui",
              type: "folder",
              path: "src/components/ui",
              children: [
                {
                  name: "button.tsx",
                  type: "file",
                  path: "src/components/ui/button.tsx",
                  lastModified: new Date(Date.now() - 1000 * 60 * 30),
                  size: 1234,
                  language: "typescript",
                },
                {
                  name: "card.tsx",
                  type: "file",
                  path: "src/components/ui/card.tsx",
                  lastModified: new Date(Date.now() - 1000 * 60 * 45),
                  size: 987,
                  language: "typescript",
                },
              ],
            },
          ],
        },
        {
          name: "pages",
          type: "folder",
          path: "src/pages",
          children: [
            {
              name: "index.tsx",
              type: "file",
              path: "src/pages/index.tsx",
              lastModified: new Date(Date.now() - 1000 * 60 * 10),
              size: 3456,
              language: "typescript",
            },
            {
              name: "about.tsx",
              type: "file",
              path: "src/pages/about.tsx",
              lastModified: new Date(Date.now() - 1000 * 60 * 60),
              size: 1567,
              language: "typescript",
            },
          ],
        },
        {
          name: "utils",
          type: "folder",
          path: "src/utils",
          children: [
            {
              name: "helpers.ts",
              type: "file",
              path: "src/utils/helpers.ts",
              lastModified: new Date(Date.now() - 1000 * 60 * 20),
              size: 2100,
              language: "typescript",
            },
          ],
        },
      ],
    },
    {
      name: "public",
      type: "folder",
      path: "public",
      children: [
        {
          name: "favicon.ico",
          type: "file",
          path: "public/favicon.ico",
          lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24),
          size: 1024,
        },
      ],
    },
    {
      name: "package.json",
      type: "file",
      path: "package.json",
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2),
      size: 1890,
      language: "json",
    },
  ]

  // Simulate file count and recent changes
  useEffect(() => {
    const countFiles = (nodes: FileNode[]): number => {
      return nodes.reduce((count, node) => {
        if (node.type === "file") {
          return count + 1
        } else if (node.children) {
          return count + countFiles(node.children)
        }
        return count
      }, 0)
    }

    const totalFiles = countFiles(fileTree)
    onFileCountChange(totalFiles)

    // Simulate recent changes
    const changes: RecentChange[] = [
      {
        id: "1",
        fileName: "Header.tsx",
        action: "modified",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
      {
        id: "2",
        fileName: "index.tsx",
        action: "modified",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
      },
      {
        id: "3",
        fileName: "helpers.ts",
        action: "created",
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
      },
    ]
    setRecentChanges(changes)

    // Calculate project stats
    setProjectStats({
      totalFiles,
      totalLines: totalFiles * 45, // Mock calculation
      languages: {
        TypeScript: 8,
        JSON: 1,
        CSS: 2,
      },
    })
  }, [onFileCountChange]) // Removed fileTree from dependencies

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileIcon = (fileName: string, language?: string) => {
    if (language === "typescript" || fileName.endsWith(".tsx") || fileName.endsWith(".ts")) {
      return <Code className="w-4 h-4 text-blue-400" />
    }
    if (language === "json" || fileName.endsWith(".json")) {
      return <FileText className="w-4 h-4 text-yellow-400" />
    }
    return <File className="w-4 h-4 text-muted-foreground" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer ${
            depth > 0 ? `ml-${depth * 4}` : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => node.type === "folder" && toggleFolder(node.path)}
        >
          {node.type === "folder" ? (
            <>
              {expandedFolders.has(node.path) ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              {expandedFolders.has(node.path) ? (
                <FolderOpen className="w-4 h-4 text-primary" />
              ) : (
                <Folder className="w-4 h-4 text-primary" />
              )}
            </>
          ) : (
            <>
              <div className="w-4" />
              {getFileIcon(node.name, node.language)}
            </>
          )}
          <span className="text-sm flex-1 truncate">{node.name}</span>
          {node.type === "file" && node.size && (
            <span className="text-xs text-muted-foreground">{formatFileSize(node.size)}</span>
          )}
        </div>
        {node.type === "folder" && node.children && expandedFolders.has(node.path) && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ))
  }

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-border bg-card/50 backdrop-blur-sm flex flex-col items-center py-4">
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(false)} className="w-8 h-8 p-0">
          <Folder className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-80 border-l border-border bg-card/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Project Context</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)} className="w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Real-time project overview</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Project Stats */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Project Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-primary">{projectStats.totalFiles}</div>
                  <div className="text-xs text-muted-foreground">Files</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-primary">{projectStats.totalLines}</div>
                  <div className="text-xs text-muted-foreground">Lines</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium">Languages</div>
                {Object.entries(projectStats.languages).map(([lang, count]) => (
                  <div key={lang} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{lang}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Changes */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentChanges.map((change) => (
                  <div key={change.id} className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        change.action === "created"
                          ? "bg-green-400"
                          : change.action === "modified"
                            ? "bg-yellow-400"
                            : "bg-red-400"
                      }`}
                    />
                    <span className="flex-1 truncate">{change.fileName}</span>
                    <span className="text-muted-foreground">{formatTime(change.timestamp)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* File Explorer */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Folder className="w-4 h-4" />
                File Explorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">{renderFileTree(fileTree)}</div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Last sync: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}
