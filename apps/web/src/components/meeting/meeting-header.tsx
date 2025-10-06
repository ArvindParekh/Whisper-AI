"use client"

import { Button } from "@/components/ui/button"
import { PhoneOff } from "lucide-react"
import { useRouter } from "next/navigation"

export function MeetingHeader() {
  const router = useRouter()

  const handleLeave = () => {
    router.push("/dashboard")
  }

  return (
    <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black">
      <div>
        <h1 className="font-semibold">Voice Session</h1>
        <p className="text-xs text-gray-500">Connected</p>
      </div>

      <Button
        variant="destructive"
        onClick={handleLeave}
        size="sm"
        className="bg-red-600 hover:bg-red-700"
      >
        <PhoneOff className="w-4 h-4 mr-2" />
        Leave
      </Button>
    </header>
  )
}

