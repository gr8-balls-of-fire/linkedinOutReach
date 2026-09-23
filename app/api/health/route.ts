import { NextResponse } from "next/server";
import { getHealth } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getHealth());
}
