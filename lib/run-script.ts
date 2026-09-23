import { spawn } from "child_process";

export function runScript(scriptPath: string, timeoutMs = 3 * 60 * 1000): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn("cmd", ["/c", "npx", "tsx", scriptPath], { cwd: process.cwd() });
    let output = "";
    const timer = setTimeout(() => {
      output += "\n[Timed out — killing process. It may still be running in the background.]";
      child.kill();
      resolve({ ok: false, output });
    }, timeoutMs);

    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output });
    });
  });
}
