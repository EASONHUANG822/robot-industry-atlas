import { NextResponse } from "next/server";
import { createFeedback, getApprovedFeedback, validateFeedbackPayload } from "@/server/airtableFeedback";

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

    // Fire-and-forget: sync to Feishu Bitable + notify (don't block response)
    if (result.recordId) {
      const { syncFeedbackToBitable } = await import("@/server/larkBitable");
      const { notifyNewFeedback } = await import("@/server/larkNotify");
      syncFeedbackToBitable(validation.payload, result.recordId).then((r) => {
        if (!r.ok) console.error("[FEISHU SYNC FB FAIL]", r.error);
      }).catch((e) => console.error("[FEISHU SYNC FB ERR]", e instanceof Error ? e.message : e));
      notifyNewFeedback(validation.payload, result.recordId).catch((e) => console.error("[FEISHU NOTIFY FB ERR]", e instanceof Error ? e.message : e));
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
