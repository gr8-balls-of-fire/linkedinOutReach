import { NextResponse } from "next/server";
import { runScript } from "@/lib/run-script";

export async function POST() {
  // Longer timeout than the default: agent1 waits delayMin-delayMax minutes
  // between sends, which can add up across multiple leads in one run.
  const result = await runScript("scripts/agent1-outbound.ts", 20 * 60 * 1000);
  return NextResponse.json(result);
}
