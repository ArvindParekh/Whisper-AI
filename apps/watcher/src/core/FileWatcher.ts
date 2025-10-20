import chokidar, { FSWatcher, type Matcher } from "chokidar";
import fs from "fs";
import path from "path";
import { Logger } from "../utils/logger.js";
import { FileSyncer } from "./FileSyncer.js";
import {
  IGNORED_PATTERNS,
  IGNORED_DIRECTORIES,
  WATCHER_CONFIG,
} from "../config/constants.js";
import type { syncFileType } from "@whisper/shared/types/watcher";

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private baseDir: string;
  private logger: Logger;
  private fileSyncer: FileSyncer;

  constructor(baseDir: string, fileSyncer: FileSyncer, logger: Logger) {
    this.baseDir = baseDir;
    this.fileSyncer = fileSyncer;
    this.logger = logger;
  }

  private getAllFiles(dir: string, baseDir: string = dir): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(baseDir, fullPath);

      if (this.shouldIgnore(relativePath)) {
        continue;
      }

      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, baseDir));
      } else {
        files.push(relativePath);
      }
    }

    return files;
  }

  private shouldIgnore(filePath: string): boolean {
    return IGNORED_DIRECTORIES.some((dir) => filePath.includes(dir));
  }

  async start(): Promise<void> {
    this.logger.startSpinner("Starting file watcher...");

    this.watcher = chokidar.watch(this.baseDir, {
      ignored: IGNORED_PATTERNS,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: true,
      cwd: this.baseDir,
      awaitWriteFinish: {
        stabilityThreshold: WATCHER_CONFIG.STABILITY_THRESHOLD,
        pollInterval: WATCHER_CONFIG.POLL_INTERVAL,
      },
    });

    // set up listeners before ready
    this.setupListeners();

    // wait for initial scan to complete
    await new Promise<void>((resolve, reject) => {
      this.watcher!.on("ready", () => {
        this.logger.succeedSpinner(`Watching ${this.baseDir} for changes...`);
        resolve();
      });

      this.watcher!.on("error", (error) => {
        this.logger.error("Watcher error", error);
        reject(error);
      });
    });

    // sync all existing files after ready
    await this.syncAllFiles();
  }

  private async syncAllFiles(): Promise<void> {
    this.logger.startSpinner("Scanning files...");

    try {
      const allFiles = this.getAllFiles(this.baseDir);
      this.logger.info(`Found ${allFiles.length} files to sync`);

      await this.fileSyncer.syncBatch(allFiles, "add");
    } catch (error) {
      this.logger.error("Error syncing all files", error);
      throw error;
    }
  }

  private setupListeners(): void {
    if (!this.watcher) {
      throw new Error("Watcher not initialized");
    }

    this.watcher.on("add", (filePath) => {
      this.handleFileChange(filePath, "add");
    });

    this.watcher.on("change", (filePath) => {
      this.handleFileChange(filePath, "change");
    });

    this.watcher.on("unlink", (filePath) => {
      this.handleFileChange(filePath, "delete");
    });
  }

  private async handleFileChange(
    filePath: string,
    type: syncFileType,
  ): Promise<void> {
    try {
      await this.fileSyncer.syncFile(filePath, type);
    } catch (error) {
      this.logger.error(`Error handling ${type} for ${filePath}`, error);
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.logger.info("File watcher stopped");
    }
  }
}
