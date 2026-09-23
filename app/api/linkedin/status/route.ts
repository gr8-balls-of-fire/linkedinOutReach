import { NextResponse } from "next/server";
import { hasSession, sessionSavedAt } from "@/lib/linkedin/session";

export async function GET() {
  return NextResponse.json({ connected: hasSession(), savedAt: sessionSavedAt() });
}
