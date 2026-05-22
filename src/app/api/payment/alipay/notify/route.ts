import { NextResponse } from "next/server";
import {
  createAirtableApplication,
} from "@/server/airtableApplications";
import { verifyAlipayNotify } from "@/server/alipay";

export async function POST(request: Request) {
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return new NextResponse("fail", { status: 400 });
  }

  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(bodyText);
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  if (!verifyAlipayNotify(params)) {
    console.error("Alipay notify: signature verification failed");
    return new NextResponse("fail");
  }

  const tradeStatus = params.trade_status;
  const outTradeNo = params.out_trade_no || "";

  if (tradeStatus !== "TRADE_SUCCESS" && tradeStatus !== "TRADE_FINISHED") {
    console.log("Alipay notify: trade status not success:", tradeStatus, "outTradeNo:", outTradeNo);
    return new NextResponse("success");
  }

  // Alipay notify doesn't carry our application payload — we rely on the return_url flow for Airtable creation.
  // The notify is acknowledged to stop Alipay from re-sending.
  console.log("Alipay notify: trade completed, outTradeNo:", outTradeNo);

  return new NextResponse("success");
}
