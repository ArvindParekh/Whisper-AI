"use client";

import { Button } from "@/components/ui/button";
import {
  Terminal,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  Wifi,
  Mic,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";

interface ConnectionPanelProps {
  token: string | null;
  status:
    | "generating-token"
    | "waiting"
    | "connected"
    | "ready-to-join"
    | "error";
  meetingId: string | null;
  projectInfo?: {
    sessionId: string;
    projectName: string;
  } | null;
}

export function ConnectionPanel({
  token,
  status,
  meetingId,
  projectInfo,
}: ConnectionPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    if (!token) return;
    navigator.clipboard.writeText(`npx whisper-ai monitor --token=${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAgentJoinMeeting = () => {
    let data = JSON.stringify({
      sessionId: projectInfo?.sessionId,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/init?meetingId=${meetingId}`,
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_AGENT_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log("Agent joined meeting", JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log("Agent join meeting error", error);
      });
  };

  const statusConfig = {
    "generating-token": {
      label: "Generating token...",
      color: "text-orange-400",
      icon: Loader2,
      animated: true,
    },
    waiting: {
      label: "Waiting for connection",
      color: "text-orange-400",
      icon: Wifi,
      animated: true,
    },
    connected: {
      label: "CLI Connected",
      color: "text-green-500",
      icon: CheckCircle2,
      animated: false,
    },
    "ready-to-join": {
      label: "Ready to join",
      color: "text-orange-500",
      icon: CheckCircle2,
      animated: false,
    },
    error: {
      label: "Connection error",
      color: "text-red-500",
      icon: Wifi,
      animated: false,
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      {/* Connection Command */}
      <div className="card-subtle p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Connect Your Project</h2>

        {token ? (
          <div className="space-y-4">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500" />
                <div className="terminal-dot bg-yellow-500" />
                <div className="terminal-dot bg-green-500" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <code className="text-sm text-gray-300">
                  npx whisper-ai monitor --token={token}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCommand}
                  className="hover:bg-white/10"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-sm">
              <StatusIcon
                className={`w-4 h-4 ${currentStatus.color} ${
                  currentStatus.animated ? "animate-spin" : ""
                }`}
              />
              <span className="text-gray-400">{currentStatus.label}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating token...</span>
          </div>
        )}
      </div>

      {/* Project Connected */}
      {projectInfo && status === "ready-to-join" && (
        <div className="card-subtle p-6 rounded-lg border-orange-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">{projectInfo.projectName}</h3>
              <p className="text-sm text-gray-500">Connected</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>

          {meetingId && (
            <Link href={`/meeting/${meetingId}`} target="_blank">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg shadow-orange-900/20"
                onClick={handleAgentJoinMeeting}
              >
                <Mic className="w-4 h-4 mr-2" />
                Join Voice Session
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Instructions */}
      {status === "waiting" && (
        <p className="text-sm text-gray-500 text-center">
          Run the command above in your project directory
        </p>
      )}
    </div>
  );
}
