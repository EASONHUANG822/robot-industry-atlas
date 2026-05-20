import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/server/stripe";
import {
  validateApplicationPayload,
  validatePreferredVisitDateAvailability,
  createAirtableApplication,
} from "@/server/airtableApplications";
import type { ApplicationPayload } from "@/config/applicationForm";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { metadata } = session;

  if (!metadata) {
    console.error("Webhook: No metadata in session", session.id);
    return NextResponse.json({ error: "Missing metadata in session." }, { status: 400 });
  }

  const payload: ApplicationPayload = {
    name: metadata.name ?? "",
    organization: metadata.organization ?? "",
    email: metadata.email ?? "",
    phone: metadata.phone ?? "",
    preferredVisitDate: metadata.preferredVisitDate ?? "",
    visitorCount: metadata.visitorCount ?? "",
    message: metadata.message ?? "",
  };

  const validation = validateApplicationPayload(payload);
  if (!validation.ok) {
    console.error("Webhook: Invalid payload from metadata", validation.error, session.id);
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const availability = await validatePreferredVisitDateAvailability(
      validation.payload.preferredVisitDate,
    );
    if (!availability.ok) {
      console.warn(
        "Webhook: Date no longer available, creating record anyway:",
        availability.error,
        "session:",
        session.id,
      );
    }
  } catch (err) {
    console.error("Webhook: Date availability check failed", err);
  }

  try {
    const result = await createAirtableApplication(validation.payload);
    if (!result.ok) {
      console.error("Webhook: Airtable creation failed:", result.error, "session:", session.id);
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 502 },
      );
    }

    return NextResponse.json({ received: true, recordId: result.recordId });
  } catch (error) {
    console.error("Webhook: Unexpected error creating Airtable record:", error, "session:", session.id);
    return NextResponse.json(
      { error: "Failed to create application record." },
      { status: 500 },
    );
  }
}
