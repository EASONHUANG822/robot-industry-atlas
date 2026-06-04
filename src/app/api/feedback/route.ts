import { NextResponse } from "next/server";
import { createFeedback, getApprovedFeedback, validateFeedbackPayload } from "@/server/airtableFeedback";
import { syncFeedbackToBitable } from "@/server/larkBitable";
import { notifyNewFeedback } from "@/server/larkNotify";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const validation = validateFeedbackPayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

    const result = await createFeedback(validation.payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Sync to Feishu Bitable + notify (awaited so Vercel serverless doesn't freeze them)
    if (result.recordId) {
      const [syncResult, notifyResult] = await Promise.allSettled([
        syncFeedbackToBitable(validation.payload, result.recordId),
        notifyNewFeedback(validation.payload, result.recordId),
      ]);
      if (syncResult.status === "fulfilled") {
        if (syncResult.value.ok) {
          console.log("[FEISHU SYNC FB OK] feedback synced to Bitable");
        } else {
          console.error("[FEISHU SYNC FB FAIL]", syncResult.value.error);
        }
      } else {
        console.error("[FEISHU SYNC FB ERR]", syncResult.reason instanceof Error ? syncResult.reason.message : syncResult.reason);
      }
      if (notifyResult.status === "rejected") {
        console.error("[FEISHU NOTIFY FB ERR]", notifyResult.reason instanceof Error ? notifyResult.reason.message : notifyResult.reason);
      }
    }

    return NextResponse.json({ ok: true, recordId: result.recordId });
}

export async function GET() {
  try {
    const result = await getApprovedFeedback();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ feedback: result.feedback });
  } catch {
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
  }
}
