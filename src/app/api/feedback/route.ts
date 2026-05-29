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

  try {
    const result = await createFeedback(validation.payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, recordId: result.recordId });
  } catch {
    return NextResponse.json({ error: "Submission failed. Please try again later." }, { status: 500 });
  }
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
