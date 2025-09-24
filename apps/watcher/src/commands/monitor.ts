import { Command, Flags } from "@oclif/core";
import ora from "ora";
import chokidar from "chokidar";
import "dotenv/config";
import fs from "fs";
import axios from "axios";
import type { syncFileRequestBody, syncFileResponseBody, syncFileType } from "@whisper/shared/types/watcher";
import path from "path";
import type { AxiosResponse } from "axios";

export default class Monitor extends Command {
   static description = "Watch files and sync to Whisper AI session";

   static flags = {
      sessionId: Flags.string({
         required: true,
         description: "The ID of the user's Whisper AI session",
      }),
   };

   async run(): Promise<void> {
      const { flags } = await this.parse(Monitor);
      const spinner = ora("Monitoring all your files...").start();

      // chokidar monitoring
      const currDir = process.cwd();
      const workerUrl = process.env.CF_INFERENCE_WORKER_URL!;
      const sessionId = flags.sessionId;

      const watcher = chokidar.watch(currDir, {
         ignored: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/.next/**",
            "**/.git/**",
            "!**/.env*",
            "!**/.gitignore",
         ],
         persistent: true,
         ignoreInitial: false,
         followSymlinks: true,
         cwd: currDir,
         awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 100,
         },
      });

      watcher.on("ready", () => {
         spinner.succeed(`Watching ${currDir} for changes...`);
         console.log(`Watching ${currDir} for changes...`);
      });

      const syncFileToWorker = async (filePath: string, type: syncFileType) => {
         const fileContent = fs.readFileSync(
            path.join(currDir, filePath),
            "utf8"
         );
         try {
            const response = await axios.post<syncFileResponseBody, AxiosResponse<syncFileResponseBody>, syncFileRequestBody>(`${workerUrl}/sync`, {
               filePath,
               fileContent,
               sessionId,
               type,
               timestamp: Date.now(),
            });
            spinner.succeed(`Synced file to worker: ${filePath}`);
            console.log(response.data.message);
         } catch (error) {
            spinner.fail(`Error syncing file to worker: ${error}`);
         }
      };

      watcher.on("add", (filePath) => syncFileToWorker(filePath, "add"));

      watcher.on("change", (filePath) => syncFileToWorker(filePath, "change"));

      watcher.on("unlink", (filePath) => syncFileToWorker(filePath, "delete"));
   }
}
