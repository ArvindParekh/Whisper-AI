import axios from "axios";
import { Logger } from "../utils/logger.js";

export class SessionManager {
  private sessionId: string | null = null;
  private logger: Logger;
  private backendUrl: string;

  constructor(backendUrl: string, logger: Logger) {
    this.backendUrl = backendUrl;
    this.logger = logger;
  }

  async connect(token: string, projectName: string): Promise<string> {
    this.logger.startSpinner(`Connecting to backend: ${projectName}`);

    try {
      const { data } = await axios.post(
        `${this.backendUrl}/api/cli-connected`,
        {
          token,
          projectName,
        },
      );

      this.sessionId = data.sessionId;
      this.logger.succeedSpinner(`Connected to backend: ${projectName}`);

      return this.sessionId!;
    } catch (error) {
      this.logger.failSpinner("Failed to connect to backend");
      throw new Error(
        `Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  getSessionId(): string {
    if (!this.sessionId) {
      throw new Error("Session not initialized. Call connect() first.");
    }
    return this.sessionId;
  }
}
