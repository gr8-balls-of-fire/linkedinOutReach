import { NextRequest, NextResponse } from "next/server";
import { getNotificationSettings, updateNotificationSettings } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getNotificationSettings());
}

export async function PATCH(req: NextRequest) {
  const patch = await req.json();
  const settings = updateNotificationSettings(patch);
  return NextResponse.json(settings);
}
