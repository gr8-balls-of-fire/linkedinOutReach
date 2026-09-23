import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PATCH(req: NextRequest) {
  const patch = await req.json();
  const settings = updateSettings(patch);
  return NextResponse.json(settings);
}
