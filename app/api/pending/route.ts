import { NextResponse } from "next/server";
import { getPending } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getPending());
}
