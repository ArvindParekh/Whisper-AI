"use client"

import { useState, useEffect, useCallback } from "react"
import { realtimeManager, type RealtimeConfig } from "@/lib/realtime-kit"

export interface UseRealtimeKitReturn {
  isConnected: boolean
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isLoading: boolean
  error: string | null
  initialize: (config: RealtimeConfig) => Promise<void>
  joinMeeting: () => Promise<void>
  leaveMeeting: () => Promise<void>
  toggleAudio: () => Promise<void>
  toggleVideo: () => Promise<void>
}

export function useRealtimeKit(): UseRealtimeKitReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialize = useCallback(async (config: RealtimeConfig) => {
    setIsLoading(true)
    setError(null)

    try {
      await realtimeManager.initialize(config)
      console.log("[v0] RealtimeKit initialized successfully")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initialize RealtimeKit"
      setError(errorMessage)
      console.error("[v0] RealtimeKit initialization error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const joinMeeting = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await realtimeManager.joinMeeting()
      setIsConnected(true)
      console.log("[v0] Joined meeting successfully")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to join meeting"
      setError(errorMessage)
      console.error("[v0] Join meeting error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const leaveMeeting = useCallback(async () => {
    setIsLoading(true)

    try {
      await realtimeManager.leaveMeeting()
      setIsConnected(false)
      setIsAudioEnabled(false)
      setIsVideoEnabled(false)
      console.log("[v0] Left meeting successfully")
    } catch (err) {
      console.error("[v0] Leave meeting error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const toggleAudio = useCallback(async () => {
    try {
      if (isAudioEnabled) {
        await realtimeManager.disableAudio()
        setIsAudioEnabled(false)
      } else {
        await realtimeManager.enableAudio()
        setIsAudioEnabled(true)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to toggle audio"
      setError(errorMessage)
      console.error("[v0] Toggle audio error:", err)
    }
  }, [isAudioEnabled])

  const toggleVideo = useCallback(async () => {
    try {
      if (isVideoEnabled) {
        await realtimeManager.disableVideo()
        setIsVideoEnabled(false)
      } else {
        await realtimeManager.enableVideo()
        setIsVideoEnabled(true)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to toggle video"
      setError(errorMessage)
      console.error("[v0] Toggle video error:", err)
    }
  }, [isVideoEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        realtimeManager.leaveMeeting()
      }
    }
  }, [isConnected])

  return {
    isConnected,
    isAudioEnabled,
    isVideoEnabled,
    isLoading,
    error,
    initialize,
    joinMeeting,
    leaveMeeting,
    toggleAudio,
    toggleVideo,
  }
}
