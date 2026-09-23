import { NextRequest, NextResponse } from "next/server";
import { withdrawPending } from "@/lib/store";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  withdrawPending(params.id);
  return NextResponse.json({ ok: true });
}
