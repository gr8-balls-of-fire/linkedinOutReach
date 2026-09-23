import { NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST() {
  const cwd = process.cwd();
  const child = spawn("cmd", ["/c", "npx", "tsx", "scripts/connect-linkedin.ts"], {
    cwd,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();

  return NextResponse.json({
    started: true,
    message: "A LinkedIn login window is opening on your desktop — log in there, then check status.",
  });
}
