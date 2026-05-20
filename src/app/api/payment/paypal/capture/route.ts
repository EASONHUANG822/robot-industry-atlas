import { NextResponse } from "next/server";
import {
  createAirtableApplication,
  validateApplicationPayload,
  validatePreferredVisitDateAvailability,
} from "@/server/airtableApplications";
import { capturePayPalOrder } from "@/server/paypal";
import { unsealPaymentState } from "@/server/paymentState";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const orderId = requestUrl.searchParams.get("token");
  const stateToken = requestUrl.searchParams.get("state");
  let locale = "zh";

  if (!orderId || !stateToken) {
    return redirectToPaymentCancel(requestUrl, locale, "missing_paypal_return");
  }

  try {
    const state = await unsealPaymentState(stateToken);
    locale = state.locale;
    if (state.paymentMethod !== "paypal") {
      throw new Error("Payment state is not for PayPal.");
    }

    const validation = validateApplicationPayload(state.payload);
    if (!validation.ok) {
      throw new Error(validation.error);
    }

    await capturePayPalOrder(orderId);

    try {
      const availability = await validatePreferredVisitDateAvailability(
        validation.payload.preferredVisitDate,
      );
      if (!availability.ok) {
        console.warn(
          "PayPal capture: date no longer available, creating record anyway:",
          availability.error,
          "order:",
          orderId,
        );
      }
    } catch (error) {
      console.error("PayPal capture: date availability check failed", error);
    }

    try {
      const result = await createAirtableApplication(validation.payload);
      if (!result.ok) {
        console.error("PayPal capture: Airtable creation failed:", result.error, "order:", orderId);
      }
    } catch (error) {
      console.error("PayPal capture: unexpected Airtable creation error:", error, "order:", orderId);
    }

    return redirectToPaymentSuccess(requestUrl, locale, orderId);
  } catch (error) {
    console.error("PayPal capture failed:", error);
    return redirectToPaymentCancel(requestUrl, locale, "paypal_capture_failed");
  }
}

function redirectToPaymentSuccess(requestUrl: URL, locale: string, orderId: string) {
  return NextResponse.redirect(
    new URL(`/${locale}/payment/success?paypal_order_id=${encodeURIComponent(orderId)}`, requestUrl.origin),
  );
}

function redirectToPaymentCancel(requestUrl: URL, locale: string, reason: string) {
  return NextResponse.redirect(
    new URL(`/${locale}/payment/cancel?reason=${encodeURIComponent(reason)}`, requestUrl.origin),
  );
}
