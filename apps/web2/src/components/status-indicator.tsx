import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "active" | "idle" | "connecting" | "error"
  label?: string
  size?: "sm" | "md" | "lg"
}

export function StatusIndicator({ status, label, size = "md" }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }

  const statusConfig = {
    active: {
      color: "bg-green-500",
      animation: "status-pulse",
      label: label || "Active",
    },
    idle: {
      color: "bg-gray-400",
      animation: "",
      label: label || "Idle",
    },
    connecting: {
      color: "bg-yellow-500",
      animation: "animate-pulse",
      label: label || "Connecting",
    },
    error: {
      color: "bg-red-500",
      animation: "animate-pulse",
      label: label || "Error",
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <div className={cn("rounded-full", sizeClasses[size], config.color, config.animation)} />
      {label && <span className="text-sm text-muted-foreground">{config.label}</span>}
    </div>
  )
}
