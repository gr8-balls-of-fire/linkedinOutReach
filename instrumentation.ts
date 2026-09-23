export function register() {
  const { startWatchdog } = require("./lib/heartbeat");
  startWatchdog();
}
