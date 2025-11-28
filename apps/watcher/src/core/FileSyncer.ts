import axios, { type AxiosResponse } from "axios";
import type {
  syncFileRequestBody,
  syncFileResponseBody,
  syncFileType,
  FocusContext,
} from "@whisper/shared/types/watcher";
import fs from "fs";
import path from "path";
import { Logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { WATCHER_CONFIG } from "../config/constants.js";

export class FileSyncer {
  private workerUrl: string;
  private sessionId: string;
  private baseDir: string;
  private logger: Logger;

  constructor(
    workerUrl: string,
    sessionId: string,
    baseDir: string,
    logger: Logger,
  ) {
    this.workerUrl = workerUrl;
    this.sessionId = sessionId;
    this.baseDir = baseDir;
    this.logger = logger;
  }

  async syncFile(filePath: string, type: syncFileType): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);

    try {
      let fileContent = "";

      if (type !== "delete") {
        fileContent = fs.readFileSync(fullPath, "utf8");
      }

      await withRetry(
        async () => {
          const response = await axios.post<
            syncFileResponseBody,
            AxiosResponse<syncFileResponseBody>,
            syncFileRequestBody
          >(`${this.workerUrl}/api/sync`, {
            filePath,
            fileContent,
            sessionId: this.sessionId,
            type,
            timestamp: Date.now(),
          });

          return response.data;
        },
        {
          onRetry: (attempt, error) => {
            this.logger.warn(
              `Retry ${attempt}/${WATCHER_CONFIG.MAX_RETRIES} for ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          },
        },
      );

      this.logger.success(`Synced ${type}: ${filePath}`);
    } catch (error) {
      this.logger.error(
        `Failed to sync ${filePath} after ${WATCHER_CONFIG.MAX_RETRIES} retries`,
        error,
      );
    }
  }

  async syncBatch(files: string[], type: syncFileType): Promise<void> {
    const batches: string[][] = [];

    for (let i = 0; i < files.length; i += WATCHER_CONFIG.BATCH_SIZE) {
      const batch = files.slice(i, i + WATCHER_CONFIG.BATCH_SIZE);
      batches.push(batch);
    }

    this.logger.info(
      `Syncing ${files.length} files in ${batches.length} batches...`,
    );

    this.logger.startSpinner(`Syncing files... (0/${files.length})`);

    let completed = 0;

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (file) => {
          await this.syncFile(file, type);
          completed++;
          this.logger.updateSpinner(
            `Syncing files... (${completed}/${files.length})`,
          );
        }),
      );
    }

    this.logger.succeedSpinner(`Synced all ${files.length} files`);
  }
  async sendFocusUpdate(filePath: string, content: string): Promise<void> {
    try {
      const focus: FocusContext = {
        filePath,
        content,
        lastActive: Date.now(),
      };

      await axios.post(`${this.workerUrl}/api/focus`, {
        sessionId: this.sessionId,
        focus,
      });

      this.logger.info(`Sent focus update for ${filePath}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send focus update for ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
