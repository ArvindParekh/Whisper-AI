"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning"
  onClose?: () => void
}

export function Toast({ title, description, variant = "default", onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const variantStyles = {
    default: "bg-background border-border",
    success: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    error: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 glass-card p-4 rounded-lg shadow-lg max-w-sm",
        "toast-slide-in",
        variantStyles[variant],
        !isVisible && "animate-out slide-out-to-right-full",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title && <div className="font-medium text-sm">{title}</div>}
          {description && <div className="text-sm text-muted-foreground mt-1">{description}</div>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-auto"
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose?.(), 300)
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
