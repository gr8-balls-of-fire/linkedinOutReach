import { NextResponse } from "next/server";
import { recordHeartbeat } from "@/lib/heartbeat";

export async function POST() {
  recordHeartbeat();
  return NextResponse.json({ ok: true });
}
