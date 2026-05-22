import { NextResponse } from "next/server";
import { getWechatPayConfig, parseNotification } from "@/server/wechatpay";
import {
  validateApplicationPayload,
  createAirtableApplication,
} from "@/server/airtableApplications";
import type { ApplicationPayload } from "@/config/applicationForm";

export async function POST(request: Request) {
  const body = await request.text();

  let config;
  try {
    config = getWechatPayConfig();
  } catch (error) {
    console.error("WeChat Pay notify: config missing", error);
    return NextResponse.json(
      { code: "FAIL", message: "Server configuration error." },
      { status: 500 },
    );
  }

  try {
    const tx = parseNotification(
      config.apiV3Key,
      config.wechatPayPublicKeyId,
      config.wechatPayPublicKey,
      request.headers,
      body,
    );

    if (tx.trade_state !== "SUCCESS") {
      console.log(
        "WeChat Pay notify: non-success state",
        tx.trade_state,
        tx.out_trade_no,
      );
      return NextResponse.json({ code: "SUCCESS", message: "成功" });
    }

    let attachPayload: ApplicationPayload | null = null;
    try {
      attachPayload = tx.attach ? (JSON.parse(tx.attach) as ApplicationPayload) : null;
    } catch {
      console.error("WeChat Pay notify: invalid attach JSON", tx.attach);
    }

    if (!attachPayload) {
      console.error(
        "WeChat Pay notify: missing attach data, out_trade_no:",
        tx.out_trade_no,
      );
      return NextResponse.json({ code: "SUCCESS", message: "成功" });
    }

    const validation = validateApplicationPayload(attachPayload);
    if (!validation.ok) {
      console.error("WeChat Pay notify: invalid payload", validation.error);
      return NextResponse.json({ code: "SUCCESS", message: "成功" });
    }

    const result = await createAirtableApplication(validation.payload);
    if (!result.ok) {
      console.error(
        "WeChat Pay notify: Airtable creation failed:",
        result.error,
      );
    }

    return NextResponse.json({ code: "SUCCESS", message: "成功" });
  } catch (error) {
    console.error("WeChat Pay notify: processing failed", error);
    return NextResponse.json({ code: "SUCCESS", message: "成功" });
  }
}
