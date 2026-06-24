import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/server/adminAuth";
import { getBlockedDates, addBlockedDate, removeBlockedDate } from "@/server/larkBlockedDates";

export async function GET() {
  const auth = await validateAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const result = await getBlockedDates();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ blockedDates: result.blockedDates });
  } catch {
    return NextResponse.json({ error: "Failed to fetch blocked dates." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await validateAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body: { date?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.date || typeof body.date !== "string") {
    return NextResponse.json({ error: "Missing required field: date." }, { status: 400 });
  }

  try {
    const result = await addBlockedDate(body.date);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to block date." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await validateAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Missing query parameter: date." }, { status: 400 });
  }

  try {
    const result = await removeBlockedDate(date);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to unblock date." }, { status: 500 });
  }
}
