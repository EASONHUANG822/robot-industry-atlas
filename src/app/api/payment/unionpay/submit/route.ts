import { NextResponse } from "next/server";
import { unsealPaymentState } from "@/server/paymentState";
import {
  getUnionPayConfig,
  getFrontTransUrl,
  buildSignedRequest,
  createAutoFormHtml,
  generateUnionPayOrderId,
  getCurrentTxnTime,
  getPayTimeout,
  buildUnionPaySubject,
} from "@/server/unionpay";
import { TRIAL_PAYMENT_PRICE_CNY } from "@/content/paymentOffer";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const stateToken = requestUrl.searchParams.get("state");
  const siteUrl = getSiteUrl(request);

  if (!stateToken) {
    return NextResponse.json(
      { error: "Missing payment state." },
      { status: 400 },
    );
  }

  let state: { locale: string; payload: Record<string, string>; quantity: number };
  try {
    const raw = await unsealPaymentState(stateToken);
    state = raw as typeof state;
    if (raw.paymentMethod !== "unionpay") {
      throw new Error("Payment state is not for UnionPay.");
    }
  } catch {
    return new NextResponse("Payment link expired or invalid. Please try again.", {
      status: 400,
    });
  }

  const config = getUnionPayConfig();
  const orderId = generateUnionPayOrderId();
  const txnTime = getCurrentTxnTime();
  const locale = state.locale || "zh";
  const quantity = state.quantity || 1;

  const params = new Map<string, string>();
  params.set("version", "5.1.0");
  params.set("encoding", "UTF-8");
  params.set("signMethod", "01");
  params.set("txnType", "01");
  params.set("txnSubType", "01");
  params.set("bizType", "000201");
  params.set("channelType", "07");
  params.set("merId", config.merId);
  params.set("accessType", "0");
  params.set("orderId", orderId);
  params.set("txnTime", txnTime);
  params.set("txnAmt", String(TRIAL_PAYMENT_PRICE_CNY * quantity * 100));
  params.set("currencyCode", "156");
  params.set("frontUrl", `${siteUrl}/api/payment/unionpay/return?state=${encodeURIComponent(stateToken)}`);
  params.set("backUrl", `${siteUrl}/api/payment/unionpay/notify`);
  params.set("payTimeout", getPayTimeout());
  params.set(
    "orderDesc",
    buildUnionPaySubject(locale === "en" ? "en" : "zh"),
  );

  const signed = buildSignedRequest(params);
  const html = createAutoFormHtml(getFrontTransUrl(), signed);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function getSiteUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
