export type syncFileType = "add" | "change" | "delete";

export interface syncFileRequestBody {
  filePath: string;
  fileContent: string;
  sessionId: string;
  type: syncFileType;
  timestamp: number;
}

export interface syncFileResponseBody {
  success: boolean;
  message?: string;
}

export interface SessionStats {
  filesCount: number;
  conversationLength: number;
  createdAt: number;
  lastActivity: number;
}

export interface ConversationMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ProjectContext {
  files: Record<string, { content: string; lastModified: number }>;
}
