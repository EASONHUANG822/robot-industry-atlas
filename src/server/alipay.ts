import "server-only";
import { AlipaySdk } from "alipay-sdk";
import type { AlipaySdkConfig } from "alipay-sdk";
import { TRIAL_PAYMENT_PRICE_CNY } from "@/content/paymentOffer";
import type { AppLocale } from "@/i18n/routing";

const ALIPAY_SANDBOX_GATEWAY = "https://openapi-sandbox.dl.alipaydev.com/gateway.do";
const ALIPAY_PROD_GATEWAY = "https://openapi.alipay.com/gateway.do";

function getAlipayConfig(): Required<Pick<AlipaySdkConfig, "appId" | "privateKey" | "alipayPublicKey" | "gateway" | "signType" | "keyType">> {
  const appId = process.env.ALIPAY_APP_ID;
  const privateKey = process.env.ALIPAY_PRIVATE_KEY;
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;

  if (!appId || !privateKey || !alipayPublicKey) {
    throw new Error("Missing Alipay configuration. Check ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY, and ALIPAY_PUBLIC_KEY.");
  }

  const isSandbox = process.env.ALIPAY_SANDBOX !== "false";
  const gateway = isSandbox ? ALIPAY_SANDBOX_GATEWAY : ALIPAY_PROD_GATEWAY;

  return {
    appId,
    privateKey,
    alipayPublicKey,
    gateway,
    signType: "RSA2",
    keyType: "PKCS8",
  };
}

let sdkCache: AlipaySdk | null = null;

function getAlipaySdk(): AlipaySdk {
  if (!sdkCache) {
    const config = getAlipayConfig();
    sdkCache = new AlipaySdk({
      appId: config.appId,
      privateKey: config.privateKey,
      alipayPublicKey: config.alipayPublicKey,
      gateway: config.gateway,
      signType: config.signType,
      keyType: config.keyType,
    });
  }
  return sdkCache;
}

export function createAlipayPagePayUrl(params: {
  outTradeNo: string;
  totalAmount: number;
  subject: string;
  body?: string;
  returnUrl: string;
  notifyUrl?: string;
}) {
  const sdk = getAlipaySdk();
  const amountValue = params.totalAmount.toFixed(2);

  return sdk.pageExecute("alipay.trade.page.pay", "GET", {
    bizContent: {
      out_trade_no: params.outTradeNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      total_amount: amountValue,
      subject: params.subject,
      body: params.body || params.subject,
    },
    returnUrl: params.returnUrl,
    notifyUrl: params.notifyUrl || undefined,
  });
}

export function verifyAlipayNotify(params: Record<string, string>) {
  const sdk = getAlipaySdk();
  return sdk.checkNotifySignV2(params);
}

export function buildAlipaySubject(locale: AppLocale) {
  return locale === "zh"
    ? `深圳机器人谷试运营体验 (${TRIAL_PAYMENT_PRICE_CNY}元/人)`
    : `Shenzhen Robot Valley Trial Experience (${TRIAL_PAYMENT_PRICE_CNY} CNY/person)`;
}

let orderCounter = 0;

export function generateOutTradeNo(): string {
  orderCounter++;
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const seq = String(orderCounter).padStart(4, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `RV${datePart}${timePart}${seq}${random}`;
}
