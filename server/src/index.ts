import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { shutdown } from "./db/index.js";
import { closeRedis } from "./db/redis.js";
import { startClickSync, stopClickSync } from "./jobs/clickSync.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[server] listening on port ${env.PORT} (${env.NODE_ENV})`);
  startClickSync();
});

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`[server] received ${signal}, shutting down`);

  server.close(async () => {
    try {
      await stopClickSync();
      await shutdown();
    } catch (err) {
      console.error("[server] error during shutdown:", err);
    } finally {
      closeRedis();
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.error("[server] forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));