import { NextResponse } from "next/server";
import {
  getWechatPayConfig,
  queryOrderByOutTradeNo,
  WechatPayApiException,
} from "@/server/wechatpay";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const outTradeNo = searchParams.get("outTradeNo");

  if (!outTradeNo) {
    return NextResponse.json(
      { error: "Missing outTradeNo parameter." },
      { status: 400 },
    );
  }

  try {
    const config = getWechatPayConfig();
    const order = await queryOrderByOutTradeNo(config, outTradeNo);

    return NextResponse.json({
      outTradeNo: order.out_trade_no,
      tradeState: order.trade_state,
      tradeStateDesc: order.trade_state_desc,
      transactionId: order.transaction_id ?? null,
    });
  } catch (error) {
    if (error instanceof WechatPayApiException) {
      return NextResponse.json(
        { error: error.errorMessage ?? "Query failed" },
        { status: error.statusCode },
      );
    }

    console.error("WeChat Pay query failed:", error);
    return NextResponse.json(
      { error: "Query service temporarily unavailable." },
      { status: 502 },
    );
  }
}
