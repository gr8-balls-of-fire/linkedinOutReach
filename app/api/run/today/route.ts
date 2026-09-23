import { NextResponse } from "next/server";
import { getTodayRun } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getTodayRun());
}
