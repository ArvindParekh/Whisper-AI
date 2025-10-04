import { Command, Flags } from "@oclif/core";
import "dotenv/config";
import path from "path";
import { Logger } from "../utils/logger.js";
import { SessionManager } from "../core/SessionManager.js";
import { FileSyncer } from "../core/FileSyncer.js";
import { FileWatcher } from "../core/FileWatcher.js";
import "dotenv/config";

export default class Monitor extends Command {
   static description = "Watch files and sync to Whisper AI session";

   static flags = {
      token: Flags.string({
         required: true,
         description: "The token to fetch user's session",
      }),
   };

   async run(): Promise<void> {
      const { flags } = await this.parse(Monitor);
      const { token } = flags;

      const logger = new Logger();
      const projectName = path.basename(process.cwd());
      const baseDir = process.cwd();
      const workerUrl = process.env.CF_INFERENCE_WORKER_URL!;

      if (!workerUrl) {
         logger.error(
            "Missing environment variables: CF_BACKEND_URL or CF_INFERENCE_WORKER_URL"
         );
         process.exit(1);
      }

      try {
         // step 1 - connect and get session
         const sessionManager = new SessionManager(workerUrl, logger);
         const sessionId = await sessionManager.connect(token, projectName);

         console.log("Session Id: ", sessionId);

         // step 2 - initialize file syncer
         const fileSyncer = new FileSyncer(
            workerUrl,
            sessionId,
            baseDir,
            logger
         );

         // step 3 - start file watcher
         const fileWatcher = new FileWatcher(baseDir, fileSyncer, logger);
         await fileWatcher.start();

         logger.success("Monitoring active. Press Ctrl+C to stop.");

         // handle graceful shutdown
         process.on("SIGINT", async () => {
            logger.info("\nShutting down...");
            await fileWatcher.stop();
            process.exit(0);
         });
      } catch (error) {
         logger.error(
            "Failed to start monitoring",
            error instanceof Error ? error.message : error
         );
         process.exit(1);
      }
   }
}
