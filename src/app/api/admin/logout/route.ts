import { NextResponse } from "next/server";
import { clearAdminSession } from "@/server/adminAuth";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
