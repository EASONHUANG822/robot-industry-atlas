import { NextResponse } from "next/server";
import { validateAdminSession } from "@/server/adminAuth";
import { updateFeedback, type FeedbackStatus } from "@/server/airtableFeedback";
import { updateFeedbackInBitable } from "@/server/larkBitable";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const updates: { status?: FeedbackStatus; message?: string; featured?: boolean } = {};

  if (typeof body.status === "string" && ["Pending", "Approved", "Rejected"].includes(body.status)) {
    updates.status = body.status as FeedbackStatus;
  }
  if (typeof body.message === "string" && body.message.trim()) {
    updates.message = body.message.trim();
  }
  if (typeof body.featured === "boolean") {
    updates.featured = body.featured;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

    const result = await updateFeedback(id, updates);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Sync status update to Feishu Bitable (awaited so Vercel serverless doesn't freeze it)
    const bitableResult = await updateFeedbackInBitable(id, updates);
    if (!bitableResult.ok) console.error("[FEISHU UPDATE FAIL]", bitableResult.error);

    return NextResponse.json({ ok: true });
}
