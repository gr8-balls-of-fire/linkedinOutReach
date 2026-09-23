import { NextRequest, NextResponse } from "next/server";
import { getLists, upsertList } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getLists());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const list = upsertList(body);
  return NextResponse.json(list);
}
