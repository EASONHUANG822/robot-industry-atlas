import { NextResponse } from "next/server";
import {
  createAirtableApplication,
  validateApplicationPayload,
  validatePreferredVisitDateAvailability,
} from "@/server/airtableApplications";
import { unsealPaymentState } from "@/server/paymentState";
import { verify } from "@/server/unionpay";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const stateToken = requestUrl.searchParams.get("state");
  const locale = "zh";

  if (!stateToken) {
    return redirectToCancel(request, locale, "missing_state");
  }

  try {
    const state = await unsealPaymentState(stateToken);
    const resolvedLocale = state.locale || "zh";

    if (state.paymentMethod !== "unionpay") {
      throw new Error("Payment state is not for UnionPay.");
    }

    let bodyText: string;
    try {
      bodyText = await request.text();
    } catch {
      return redirectToCancel(request, resolvedLocale, "empty_body");
    }

    const params = parseFormBody(bodyText);
    const respCode = params.get("respCode") || "";
    const orderId = params.get("orderId") || "";

    // Verify UnionPay signature
    if (!verify(params)) {
      console.error("UnionPay return: signature verification failed");
      return redirectToCancel(request, resolvedLocale, "signature_failed");
    }

    if (respCode !== "00" && respCode !== "A6") {
      console.log(
        "UnionPay return: payment not successful",
        respCode,
        "orderId:",
        orderId,
      );
      return redirectToCancel(
        request,
        resolvedLocale,
        `unionpay_resp_${respCode}`,
      );
    }

    // Payment successful — create Airtable record
    const validation = validateApplicationPayload(state.payload);
    if (!validation.ok) {
      console.error(
        "UnionPay return: payload validation failed:",
        validation.error,
      );
      return redirectToCancel(request, resolvedLocale, "invalid_payload");
    }

    try {
      const availability = await validatePreferredVisitDateAvailability(
        validation.payload.preferredVisitDate,
      );
      if (!availability.ok) {
        console.warn(
          "UnionPay return: date no longer available, creating record anyway:",
          availability.error,
          "orderId:",
          orderId,
        );
      }
    } catch (error) {
      console.error("UnionPay return: date availability check failed", error);
    }

    try {
      const result = await createAirtableApplication(validation.payload);
      if (!result.ok) {
        console.error(
          "UnionPay return: Airtable creation failed:",
          result.error,
          "orderId:",
          orderId,
        );
      }
    } catch (error) {
      console.error(
        "UnionPay return: unexpected Airtable creation error:",
        error,
        "orderId:",
        orderId,
      );
    }

    return redirectToSuccess(request, resolvedLocale, orderId);
  } catch (error) {
    console.error("UnionPay return error:", error);
    return redirectToCancel(request, "zh", "exception");
  }
}

function parseFormBody(body: string): Map<string, string> {
  const params = new Map<string, string>();
  const pairs = body.split("&");
  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex >= 0) {
      const key = decodeURIComponent(pair.substring(0, eqIndex));
      const value = decodeURIComponent(
        pair.substring(eqIndex + 1).replace(/\+/g, " "),
      );
      if (key) {
        params.set(key, value);
      }
    }
  }
  return params;
}

function redirectToSuccess(
  request: Request,
  locale: string,
  orderId: string,
) {
  const requestUrl = new URL(request.url);
  return NextResponse.redirect(
    new URL(
      `/${locale}/payment/success?unionpay_order_id=${encodeURIComponent(orderId)}`,
      requestUrl.origin,
    ),
  );
}

function redirectToCancel(request: Request, locale: string, reason: string) {
  const requestUrl = new URL(request.url);
  return NextResponse.redirect(
    new URL(
      `/${locale}/payment/cancel?reason=${encodeURIComponent(reason)}`,
      requestUrl.origin,
    ),
  );
}
