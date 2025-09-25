"use client"

import { AdvancedDashboard } from "@/components/advanced-dashboard"
import { AnimatedBackground } from "@/components/animated-background"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <AdvancedDashboard />
      </div>
    </div>
  )
}
