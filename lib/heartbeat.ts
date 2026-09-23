// All dashboard state is already flushed to data/*.json synchronously on
// every write (see lib/store.ts), so killing this process loses nothing —
// there's no in-memory state to persist first.

const IDLE_TIMEOUT_MS = 60_000;
const CHECK_INTERVAL_MS = 30_000;

declare global {
  // eslint-disable-next-line no-var
  var __outreachHeartbeat: { lastPing: number; watchdogStarted: boolean } | undefined;
}

function state() {
  if (!global.__outreachHeartbeat) {
    global.__outreachHeartbeat = { lastPing: 0, watchdogStarted: false };
  }
  return global.__outreachHeartbeat;
}

export function recordHeartbeat() {
  state().lastPing = Date.now();
}

export function startWatchdog() {
  const s = state();
  if (s.watchdogStarted) return;
  s.watchdogStarted = true;

  setInterval(() => {
    if (s.lastPing === 0) return; // nobody's opened the dashboard yet
    if (Date.now() - s.lastPing > IDLE_TIMEOUT_MS) {
      console.log("No dashboard activity for 60s — shutting down.");
      process.exit(0);
    }
  }, CHECK_INTERVAL_MS);
}
