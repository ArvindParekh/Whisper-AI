"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, LayoutDashboard, Phone, Settings, Mic, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Session", href: "/session", icon: Phone },
  { name: "Video Call", href: "/video-call", icon: Phone },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">Whisper</h1>
            <p className="text-xs text-muted-foreground">AI Co-Pilot</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild className="relative">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/5 rounded-lg border border-primary/20"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>

        <div className="mt-8 p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-card-foreground">Live Status</span>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Voice Quality</span>
              <span className="text-green-500">Excellent</span>
            </div>
            <div className="flex justify-between">
              <span>Latency</span>
              <span className="text-green-500">12ms</span>
            </div>
            <div className="flex justify-between">
              <span>AI Response</span>
              <span className="text-blue-500">Ready</span>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
