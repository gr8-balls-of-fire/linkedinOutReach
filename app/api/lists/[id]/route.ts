import { NextRequest, NextResponse } from "next/server";
import { deleteList, setListActive, upsertList } from "@/lib/store";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (typeof body.active === "boolean" && Object.keys(body).length === 1) {
    const list = setListActive(params.id, body.active);
    return NextResponse.json(list);
  }
  const list = upsertList({ id: params.id, ...body });
  return NextResponse.json(list);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  deleteList(params.id);
  return NextResponse.json({ ok: true });
}
