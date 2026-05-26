import { NextResponse } from "next/server";
import {
  createAirtableApplication,
  validateApplicationPayload,
  validatePreferredVisitDateAvailability,
} from "@/server/airtableApplications";
import { sendApplicationReceivedEmail } from "@/server/resend";

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const applicationType = String(body.applicationType || "visit");
  const locale = String(body.locale || "zh");

  const validation = validateApplicationPayload(body);
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

    if (applicationType === "trial") {
      const payload = validation.payload;
      sendApplicationReceivedEmail({
        to: payload.email || "",
        name: payload.name || "",
        preferredVisitDate: payload.preferredVisitDate,
        visitorCount: payload.visitorCount,
        locale,
      }).catch((err) => {
        console.error("Failed to send application received email:", err);
      });
    }

    return NextResponse.json({ ok: true, recordId: result.recordId });
  } catch {
    return NextResponse.json(
      { error: "Application submission failed. Please try again later." },
      { status: 500 },
    );
  }
}
