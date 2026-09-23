import { NextRequest, NextResponse } from "next/server";
import { setReplyFollowedUp, setReplyTag } from "@/lib/store";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date query param required" }, { status: 400 });
  }
  if (typeof body.followedUp === "boolean") {
    const reply = setReplyFollowedUp(date, params.id, body.followedUp);
    return NextResponse.json(reply);
  }
  if (body.tag) {
    const reply = setReplyTag(date, params.id, body.tag);
    return NextResponse.json(reply);
  }
  return NextResponse.json({ error: "no valid patch fields" }, { status: 400 });
}
