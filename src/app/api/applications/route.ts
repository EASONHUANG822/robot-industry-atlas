import { NextResponse } from "next/server";
import { createAirtableApplication, validateApplicationPayload } from "@/server/airtableApplications";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const validation = validateApplicationPayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const result = await createAirtableApplication(validation.payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, recordId: result.recordId });
  } catch {
    return NextResponse.json({ error: "Application submission failed. Please try again later." }, { status: 500 });
  }
}
