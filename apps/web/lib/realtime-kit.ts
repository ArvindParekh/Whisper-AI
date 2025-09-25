import { RealtimeKitClient } from "@cloudflare/realtimekit"

export interface RealtimeConfig {
  authToken: string
  meetingId: string
  participantId: string
}

export class RealtimeManager {
  private client: RealtimeKitClient | null = null
  private meeting: any = null
  private isConnected = false

  async initialize(config: RealtimeConfig) {
    try {
      this.client = await RealtimeKitClient.init({
        authToken: config.authToken,
      })

      this.meeting = await this.client.createMeeting({
        meetingId: config.meetingId,
        participantId: config.participantId,
      })

      return this.meeting
    } catch (error) {
      console.error("[v0] RealtimeKit initialization failed:", error)
      throw error
    }
  }

  async joinMeeting() {
    if (!this.meeting) {
      throw new Error("Meeting not initialized")
    }

    try {
      await this.meeting.join()
      this.isConnected = true
      console.log("[v0] Successfully joined meeting")
    } catch (error) {
      console.error("[v0] Failed to join meeting:", error)
      throw error
    }
  }

  async leaveMeeting() {
    if (this.meeting && this.isConnected) {
      try {
        await this.meeting.leave()
        this.isConnected = false
        console.log("[v0] Successfully left meeting")
      } catch (error) {
        console.error("[v0] Failed to leave meeting:", error)
      }
    }
  }

  async enableAudio() {
    if (this.meeting) {
      try {
        await this.meeting.enableAudio()
        console.log("[v0] Audio enabled")
      } catch (error) {
        console.error("[v0] Failed to enable audio:", error)
      }
    }
  }

  async disableAudio() {
    if (this.meeting) {
      try {
        await this.meeting.disableAudio()
        console.log("[v0] Audio disabled")
      } catch (error) {
        console.error("[v0] Failed to disable audio:", error)
      }
    }
  }

  async enableVideo() {
    if (this.meeting) {
      try {
        await this.meeting.enableVideo()
        console.log("[v0] Video enabled")
      } catch (error) {
        console.error("[v0] Failed to enable video:", error)
      }
    }
  }

  async disableVideo() {
    if (this.meeting) {
      try {
        await this.meeting.disableVideo()
        console.log("[v0] Video disabled")
      } catch (error) {
        console.error("[v0] Failed to disable video:", error)
      }
    }
  }

  getConnectionStatus() {
    return this.isConnected
  }

  getMeeting() {
    return this.meeting
  }
}

export const realtimeManager = new RealtimeManager()
