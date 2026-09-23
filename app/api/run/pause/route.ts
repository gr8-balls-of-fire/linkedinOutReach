import { NextRequest, NextResponse } from "next/server";
import { setRunPaused } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { paused } = await req.json();
  const result = setRunPaused(Boolean(paused));
  return NextResponse.json({ paused: result });
}
