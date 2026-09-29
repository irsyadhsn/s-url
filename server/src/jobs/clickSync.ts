import { env } from "../config/env.js";
import { flushPendingClicks } from "../modules/redirect/redirect.service.js";

let interval: NodeJS.Timeout | null = null;

export function startClickSync(): void {
  if (interval) {
    return;
  }
  interval = setInterval(
    () => void flushPendingClicks().catch(logFailure),
    env.CLICK_SYNC_INTERVAL_MS,
  );
  interval.unref();
}

export async function stopClickSync(): Promise<void> {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  await flushPendingClicks().catch(logFailure);
}

function logFailure(err: unknown): void {
  console.error(
    "[click-sync] failed to flush pending clicks",
    err instanceof Error ? err.message : String(err),
  );
}