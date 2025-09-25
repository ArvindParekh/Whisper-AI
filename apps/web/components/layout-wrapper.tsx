"use client"

import type React from "react"

import { SidebarProvider } from "@/components/ui/sidebar"
import { Navigation } from "@/components/navigation"

interface LayoutWrapperProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export function LayoutWrapper({ children, showSidebar = true }: LayoutWrapperProps) {
  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Navigation />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  )
}
