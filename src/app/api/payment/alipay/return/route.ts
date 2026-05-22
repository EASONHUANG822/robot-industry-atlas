import { NextResponse } from "next/server";
import {
  createAirtableApplication,
  validateApplicationPayload,
  validatePreferredVisitDateAvailability,
} from "@/server/airtableApplications";
import { unsealPaymentState } from "@/server/paymentState";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const stateToken = requestUrl.searchParams.get("state");
  const outTradeNo = requestUrl.searchParams.get("out_trade_no") || "";
  let locale = "zh";

  if (!stateToken) {
    return redirectToPaymentCancel(requestUrl, locale, "missing_alipay_return");
  }

  try {
    const state = await unsealPaymentState(stateToken);
    locale = state.locale;
    if (state.paymentMethod !== "alipay") {
      throw new Error("Payment state is not for Alipay.");
    }

    const validation = validateApplicationPayload(state.payload);
    if (!validation.ok) {
      throw new Error(validation.error);
    }

    try {
      const availability = await validatePreferredVisitDateAvailability(
        validation.payload.preferredVisitDate,
      );
      if (!availability.ok) {
        console.warn(
          "Alipay return: date no longer available, creating record anyway:",
          availability.error,
          "outTradeNo:",
          outTradeNo,
        );
      }
    } catch (error) {
      console.error("Alipay return: date availability check failed", error);
    }

    try {
      const result = await createAirtableApplication(validation.payload);
      if (!result.ok) {
        console.error("Alipay return: Airtable creation failed:", result.error, "outTradeNo:", outTradeNo);
      }
    } catch (error) {
      console.error("Alipay return: unexpected Airtable creation error:", error, "outTradeNo:", outTradeNo);
    }

    return redirectToPaymentSuccess(requestUrl, locale, outTradeNo);
  } catch (error) {
    console.error("Alipay return failed:", error);
    return redirectToPaymentCancel(requestUrl, locale, "alipay_return_failed");
  }
}

function redirectToPaymentSuccess(requestUrl: URL, locale: string, outTradeNo: string) {
  return NextResponse.redirect(
    new URL(
      `/${locale}/payment/success?alipay_out_trade_no=${encodeURIComponent(outTradeNo)}`,
      requestUrl.origin,
    ),
  );
}

function redirectToPaymentCancel(requestUrl: URL, locale: string, reason: string) {
  return NextResponse.redirect(
    new URL(`/${locale}/payment/cancel?reason=${encodeURIComponent(reason)}`, requestUrl.origin),
  );
}
