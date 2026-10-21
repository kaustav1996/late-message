/**
 * Runs the clock on a loop for self-hosted setups:
 *   npm run worker
 * Hosted on Vercel? Use the cron in vercel.json instead.
 */
import { closeDb } from "../src/db";
import { runTick } from "../src/lib/tick";

const everyMs = Number(process.env.WORKER_INTERVAL_SECONDS ?? 60) * 1000;
let stopping = false;

async function loop() {
  while (!stopping) {
    const started = Date.now();
    try {
      const s = await runTick();
      if (s.checked || s.sent || s.failed) console.log(`[worker] ${new Date().toISOString()}`, s);
    } catch (err) {
      console.error("[worker] tick failed", err);
    }
    const wait = Math.max(1000, everyMs - (Date.now() - started));
    await new Promise((r) => setTimeout(r, wait));
  }
  await closeDb();
}

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    stopping = true;
  });
}

console.log(`[worker] ticking every ${everyMs / 1000}s`);
await loop();
