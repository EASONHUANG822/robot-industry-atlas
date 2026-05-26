import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendApprovalNotificationEmail } from "@/server/resend";
import { TRIAL_PAYMENT_PRICE_CNY } from "@/config/email";

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret || !secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enc = new TextEncoder();
  const a = enc.encode(secret);
  const b = enc.encode(expectedSecret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fields = (body.fields || {}) as Record<string, unknown>;
  const email = String(fields.email || "");
  const name = String(fields.Name || "");
  const visitorCountRaw = fields.visitorCount;
  const preferredVisitDate = String(fields.preferredVisitDate || "");

  if (!email || !name) {
    return NextResponse.json(
      { error: "Missing required fields: email, Name" },
      { status: 400 },
    );
  }

  const visitorCount = Math.max(1, parseInt(String(visitorCountRaw || "1"), 10) || 1);
  const amount = visitorCount * TRIAL_PAYMENT_PRICE_CNY;

  const locale = String(
    body.locale || (body.fields as Record<string, unknown>)?.locale || "zh",
  );

  const result = await sendApprovalNotificationEmail({
    to: email,
    name,
    amount,
    visitorCount,
    preferredVisitDate,
    locale: locale.startsWith("en") ? "en" : "zh",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
