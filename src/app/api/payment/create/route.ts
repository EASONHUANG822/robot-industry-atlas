import { NextResponse } from "next/server";
import { stripe } from "@/server/stripe";
import { createPayPalCheckoutOrder } from "@/server/paypal";
import { sealPaymentState } from "@/server/paymentState";
import {
  validateApplicationPayload,
  validatePreferredVisitDateAvailability,
} from "@/server/airtableApplications";
import { PAYMENT_METHOD_KEYS, TRIAL_PAYMENT_PRICE_CNY, type PaymentMethod } from "@/content/paymentOffer";

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const {
    locale: rawLocale,
    paymentMethod: rawPaymentMethod,
    ...applicationPayload
  } = body;
  const locale = rawLocale === "en" || rawLocale === "zh" ? rawLocale : "zh";
  const paymentMethod = getPaymentMethod(rawPaymentMethod);
  if (!paymentMethod) {
    return NextResponse.json({ error: "Unsupported payment method." }, { status: 400 });
  }

  const validation = validateApplicationPayload(applicationPayload);
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
  } catch {
    return NextResponse.json(
      { error: "Unable to verify date availability. Please try again." },
      { status: 500 },
    );
  }

  const rawVisitorCount = parseInt(validation.payload.visitorCount || "1", 10);
  const quantity = Number.isFinite(rawVisitorCount) && rawVisitorCount > 0 ? rawVisitorCount : 1;

  const siteUrl = getSiteUrl(request);

  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(validation.payload)) {
    if (value) {
      metadata[key] = value.slice(0, 500);
    }
  }

  try {
    if (paymentMethod === "paypal") {
      const state = await sealPaymentState({
        locale,
        payload: validation.payload,
        paymentMethod,
        quantity,
      });
      const paypalOrder = await createPayPalCheckoutOrder({
        cancelUrl: `${siteUrl}/${locale}/payment/cancel`,
        locale,
        quantity,
        returnUrl: `${siteUrl}/api/payment/paypal/capture?state=${encodeURIComponent(state)}`,
      });

      return NextResponse.json({ url: paypalOrder.approvalUrl });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: locale === "en" ? "en" : "zh",
      line_items: [
        {
          price_data: {
            currency: "cny",
            product_data: {
              name: "Shenzhen Robot Valley Trial Experience",
              description: `${TRIAL_PAYMENT_PRICE_CNY} CNY/person x ${quantity} person(s)`,
            },
            unit_amount: TRIAL_PAYMENT_PRICE_CNY * 100,
          },
          quantity,
        },
      ],
      metadata,
      success_url: `${siteUrl}/${locale}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${locale}/payment/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(`${paymentMethod} payment creation failed:`, error);
    return NextResponse.json(
      { error: "Payment service temporarily unavailable. Please try again." },
      { status: 502 },
    );
  }
}

function getPaymentMethod(value: unknown): PaymentMethod | undefined {
  if (typeof value === "undefined") return "stripe";
  if (typeof value !== "string") return undefined;

  return PAYMENT_METHOD_KEYS.includes(value as PaymentMethod)
    ? (value as PaymentMethod)
    : undefined;
}

function getSiteUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
