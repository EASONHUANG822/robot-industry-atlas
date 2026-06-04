import { NextResponse } from "next/server";
import {
  createAirtableApplication,
  validateApplicationPayload,
  validatePreferredVisitDateAvailability,
} from "@/server/airtableApplications";
import { syncApplicationToBitable } from "@/server/larkBitable";
import { notifyNewApplication } from "@/server/larkNotify";

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

    // Sync to Feishu Bitable + notify (awaited so Vercel serverless doesn't freeze them)
    if (result.recordId) {
      const [syncResult, notifyResult] = await Promise.allSettled([
        syncApplicationToBitable(validation.payload, result.recordId),
        notifyNewApplication(validation.payload, result.recordId),
      ]);
      if (syncResult.status === "fulfilled") {
        if (syncResult.value.ok) {
          console.log("[FEISHU SYNC OK] application synced to Bitable");
        } else {
          console.error("[FEISHU SYNC FAIL]", syncResult.value.error);
        }
      } else {
        console.error("[FEISHU SYNC ERR]", syncResult.reason instanceof Error ? syncResult.reason.message : syncResult.reason);
      }
      if (notifyResult.status === "rejected") {
        console.error("[FEISHU NOTIFY ERR]", notifyResult.reason instanceof Error ? notifyResult.reason.message : notifyResult.reason);
      }
    }

    return NextResponse.json({ ok: true, recordId: result.recordId });
  } catch {
    return NextResponse.json(
      { error: "Application submission failed. Please try again later." },
      { status: 500 },
    );
  }
}
