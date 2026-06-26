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

    // Split comma-separated dates into individual entries, create one record per date
    const rawDate = validation.payload.preferredVisitDate || "";
    const dates = rawDate.split(",").map((d) => d.trim()).filter(Boolean);

    const results: string[] = [];
    const errors: string[] = [];

    const { preferredVisitDate: _, ...sharedFields } = validation.payload;

    for (const date of dates.length > 0 ? dates : [""]) {
      const singlePayload = date ? { ...sharedFields, preferredVisitDate: date } : { ...sharedFields };
      const result = await createAirtableApplication(singlePayload);
      if (!result.ok) {
        errors.push(`${date}: ${result.error}`);
        continue;
      }
      if (result.recordId) {
        results.push(result.recordId);
        // Sync to Feishu + notify for each record (fire-and-forget)
        Promise.allSettled([
          syncApplicationToBitable(singlePayload, result.recordId),
          notifyNewApplication(singlePayload),
        ]).then(([syncResult, notifyResult]) => {
          if (syncResult.status === "fulfilled" && !syncResult.value.ok) {
            console.error("[FEISHU SYNC FAIL]", syncResult.value.error);
          }
          if (notifyResult.status === "rejected") {
            console.error("[FEISHU NOTIFY ERR]", notifyResult.reason instanceof Error ? notifyResult.reason.message : notifyResult.reason);
          }
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return NextResponse.json(
        { error: `Failed to create applications: ${errors.join("; ")}` },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      recordIds: results,
      dateCount: results.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Application submission failed. Please try again later." },
      { status: 500 },
    );
  }
}
