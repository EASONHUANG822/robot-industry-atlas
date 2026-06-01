import { NextResponse } from "next/server";
import { updateFeedback, type FeedbackStatus } from "@/server/airtableFeedback";

const VALID_STATUSES = new Set<string>(["Pending", "Approved", "Rejected"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Feishu automation webhook sends record data in different shapes.
  // Extract the Airtable Record ID and new Status from the payload.
  const recordId = extractRecordId(body);
  const status = extractStatus(body);

  if (!recordId) {
    return NextResponse.json({ error: "Missing Record ID" }, { status: 400 });
  }

  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Missing or invalid Status" }, { status: 400 });
  }

  try {
    const result = await updateFeedback(recordId, { status: status as FeedbackStatus });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

function extractRecordId(body: Record<string, unknown>): string | null {
  // Try common Feishu automation webhook payload shapes
  const record = body.record as Record<string, unknown> | undefined;
  const fields = (record?.fields ?? body.fields ?? body) as Record<string, unknown>;
  const recordId = fields["Record ID"] ?? fields["recordId"] ?? body.recordId;
  return typeof recordId === "string" ? recordId : null;
}

function extractStatus(body: Record<string, unknown>): string | null {
  const record = body.record as Record<string, unknown> | undefined;
  const fields = (record?.fields ?? body.fields ?? body) as Record<string, unknown>;
  const status = fields["Status"] ?? fields["status"] ?? body.status;
  return typeof status === "string" ? status : null;
}
