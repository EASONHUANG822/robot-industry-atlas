import { NextResponse } from "next/server";
import { verify } from "@/server/unionpay";

export async function POST(request: Request) {
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return new NextResponse("fail", { status: 400 });
  }

  try {
    const params = parseFormBody(bodyText);

    // Verify UnionPay signature
    if (!verify(params)) {
      console.error("UnionPay notify: signature verification failed");
      return new NextResponse("fail");
    }

    const respCode = params.get("respCode") || "";
    const orderId = params.get("orderId") || "";
    const queryId = params.get("queryId") || "";

    console.log(
      "UnionPay notify received:",
      "respCode:",
      respCode,
      "orderId:",
      orderId,
      "queryId:",
      queryId,
    );

    if (respCode === "00") {
      // Payment successful — create Airtable record if not already created
      // Note: the application payload is not carried in UnionPay's back notification.
      // The Airtable record should have been created via the return URL flow,
      // or via orderId lookup in a system that maps orderId → application data.
      console.log(
        "UnionPay notify: payment success confirmed, orderId:",
        orderId,
        "queryId:",
        queryId,
      );
    }

    // Always respond "ok" to acknowledge receipt and stop UnionPay from retrying
    return new NextResponse("ok");
  } catch (error) {
    console.error("UnionPay notify error:", error);
    return new NextResponse("fail");
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
