import { NextResponse } from "next/server";
import {
  createAirtableApplication,
  validateApplicationPayload,
  validatePreferredVisitDateAvailability,
} from "@/server/airtableApplications";

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const { applicationType: _type, locale: _locale, ...fields } = body;

  const validation = validateApplicationPayload(fields);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const availability = await validatePreferredVisitDateAvailability(
      validation.payload.preferredVisitDate,
    );
    if (!availability.ok) {
      return NextResponse.json({ error: availability.error }, { status: availability.status });
    }

    const result = await createAirtableApplication(validation.payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Fire-and-forget: sync to Feishu Bitable + notify (don't block response)
    if (result.recordId) {
      const { syncApplicationToBitable } = await import("@/server/larkBitable");
      const { notifyNewApplication } = await import("@/server/larkNotify");
      syncApplicationToBitable(validation.payload, result.recordId).then(
        (r) => console.log("[FEISHU APP SYNC]", JSON.stringify(r)),
        (e) => console.error("[FEISHU APP SYNC ERR]", e),
      );
      notifyNewApplication(validation.payload, result.recordId).then(
        () => {},
        (e) => console.error("[FEISHU APP NOTIFY ERR]", e),
      );
    }

    return NextResponse.json({ ok: true, recordId: result.recordId });
  } catch {
    return NextResponse.json(
      { error: "Application submission failed. Please try again later." },
      { status: 500 },
    );
  }
}
