import { NextRequest, NextResponse } from "next/server";
import { getDigest, getDigestDates } from "@/lib/store";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ dates: getDigestDates() });
  }
  return NextResponse.json(getDigest(date));
}
