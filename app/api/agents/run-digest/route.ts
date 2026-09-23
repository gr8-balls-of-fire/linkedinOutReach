import { NextResponse } from "next/server";
import { runScript } from "@/lib/run-script";

export async function POST() {
  const result = await runScript("scripts/agent2-digest.ts");
  return NextResponse.json(result);
}
