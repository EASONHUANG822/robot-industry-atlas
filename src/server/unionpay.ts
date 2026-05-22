import "server-only";
import crypto from "crypto";
import { TRIAL_PAYMENT_PRICE_CNY } from "@/content/paymentOffer";
import type { AppLocale } from "@/i18n/routing";

// ======================== 配置 ========================

const SANDBOX_FRONT_TRANS_URL =
  "https://gateway.test.cup.com.cn/gateway/api/frontTransReq.do";
const SANDBOX_BACK_TRANS_URL =
  "https://gateway.test.cup.com.cn/gateway/api/backTransReq.do";
const SANDBOX_QUERY_URL =
  "https://gateway.test.cup.com.cn/gateway/api/queryTrans.do";

const PROD_FRONT_TRANS_URL =
  "https://gateway.95516.com/gateway/api/frontTransReq.do";
const PROD_BACK_TRANS_URL =
  "https://gateway.95516.com/gateway/api/backTransReq.do";
const PROD_QUERY_URL =
  "https://gateway.95516.com/gateway/api/queryTrans.do";

export interface UnionPayConfig {
  merId: string;
  privateKey: string;
  cert: string;
  rootCert: string;
}

let configCache: UnionPayConfig | null = null;

export function getUnionPayConfig(): UnionPayConfig {
  if (configCache) return configCache;

  const merId = process.env.UNIONPAY_MER_ID;
  const privateKey = process.env.UNIONPAY_SIGN_PRIVATE_KEY;
  const cert = process.env.UNIONPAY_SIGN_CERT;
  const rootCert = process.env.UNIONPAY_ROOT_CERT || "";

  if (!merId || !privateKey || !cert) {
    throw new Error(
      "Missing UnionPay configuration. Check UNIONPAY_MER_ID, UNIONPAY_SIGN_PRIVATE_KEY, and UNIONPAY_SIGN_CERT.",
    );
  }

  configCache = {
    merId,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    cert: cert.replace(/\\n/g, "\n"),
    rootCert: rootCert.replace(/\\n/g, "\n"),
  };

  return configCache;
}

function isSandbox(): boolean {
  return process.env.UNIONPAY_SANDBOX !== "false";
}

export function getFrontTransUrl(): string {
  return process.env.UNIONPAY_FRONT_TRANS_URL ||
    (isSandbox() ? SANDBOX_FRONT_TRANS_URL : PROD_FRONT_TRANS_URL);
}

export function getBackTransUrl(): string {
  return process.env.UNIONPAY_BACK_TRANS_URL ||
    (isSandbox() ? SANDBOX_BACK_TRANS_URL : PROD_BACK_TRANS_URL);
}

export function getQueryUrl(): string {
  return process.env.UNIONPAY_QUERY_URL ||
    (isSandbox() ? SANDBOX_QUERY_URL : PROD_QUERY_URL);
}

// ======================== 证书工具 ========================

let signKeyCache: crypto.KeyObject | null = null;
let certIdCache: string | null = null;

function getPrivateKey(): crypto.KeyObject {
  if (signKeyCache) return signKeyCache;
  const config = getUnionPayConfig();
  signKeyCache = crypto.createPrivateKey({
    key: config.privateKey,
    format: "pem",
  });
  return signKeyCache;
}

export function getCertId(): string {
  if (certIdCache) return certIdCache;
  const config = getUnionPayConfig();
  const cert = new crypto.X509Certificate(config.cert);
  // UnionPay expects hex serial number without colons
  certIdCache = cert.serialNumber.replace(/:/g, "").toUpperCase();
  return certIdCache;
}

// ======================== 签名工具 ========================

function sortParams(params: Map<string, string>): [string, string][] {
  return Array.from(params.entries()).sort((a, b) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return 0;
  });
}

function createLinkString(params: Map<string, string>): string {
  return sortParams(params)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

/**
 * UnionPay signMethod "01" (SHA256 + RSA) signing.
 *
 * 1. Sort params by key in ASCII order, filter blanks
 * 2. Concatenate as key=value&key=value
 * 3. SHA256 hash the string, get lowercase hex
 * 4. Sign the hex string bytes with RSA-SHA256
 * 5. Base64 encode the signature
 */
export function sign(params: Map<string, string>): string {
  const sorted = createLinkString(params);
  const sha256Hex = crypto
    .createHash("sha256")
    .update(sorted, "utf8")
    .digest()
    .toString("hex")
    .toLowerCase();
  const privateKey = getPrivateKey();
  return crypto
    .createSign("RSA-SHA256")
    .update(sha256Hex, "utf8")
    .sign(privateKey, "base64");
}

/**
 * Build signed request parameters ready for form submission.
 * Filters empty values, adds certId and signature.
 */
export function buildSignedRequest(
  params: Map<string, string>,
): Map<string, string> {
  const filtered = new Map<string, string>();
  for (const [key, value] of params) {
    if (value) {
      filtered.set(key, value.trim());
    }
  }

  filtered.set("certId", getCertId());
  filtered.set("signature", sign(filtered));
  return filtered;
}

// ======================== 签名验证 ========================

let rootCertCache: crypto.X509Certificate | null = null;

function getRootCert(): crypto.X509Certificate | null {
  if (rootCertCache !== null) return rootCertCache;
  const config = getUnionPayConfig();
  if (!config.rootCert) {
    rootCertCache = undefined as unknown as crypto.X509Certificate;
    return rootCertCache;
  }
  try {
    rootCertCache = new crypto.X509Certificate(config.rootCert);
  } catch {
    console.error("UnionPay: failed to parse root certificate");
    rootCertCache = undefined as unknown as crypto.X509Certificate;
  }
  return rootCertCache;
}

/**
 * Verify UnionPay response signature.
 */
export function verify(params: Map<string, string>): boolean {
  const signature = params.get("signature");
  if (!signature) {
    console.error("UnionPay verify: missing signature");
    return false;
  }

  const paramsWithoutSig = new Map<string, string>();
  for (const [key, value] of params) {
    if (key !== "signature" && value) {
      paramsWithoutSig.set(key, value);
    }
  }

  const sorted = createLinkString(paramsWithoutSig);
  const sha256Hex = crypto
    .createHash("sha256")
    .update(sorted, "utf8")
    .digest()
    .toString("hex")
    .toLowerCase();

  const rootCert = getRootCert();
  if (!rootCert) {
    // Without root cert, skip verification but log warning
    console.warn(
      "UnionPay verify: no root cert configured, signature verification skipped",
    );
    return true;
  }

  return crypto
    .createVerify("RSA-SHA256")
    .update(sha256Hex, "utf8")
    .verify(rootCert.publicKey, Buffer.from(signature, "base64"));
}

// ======================== 表单生成 ========================

export function createAutoFormHtml(
  actionUrl: string,
  params: Map<string, string>,
): string {
  const fields = Array.from(params.entries())
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Redirecting to UnionPay...</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-align: center; padding-top: 80px; color: #334155; }
  .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1e40af; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="spinner"></div>
<p>Redirecting to UnionPay payment page...</p>
<form id="pay" action="${escapeHtml(actionUrl)}" method="post">
${fields}
</form>
<script>document.getElementById("pay").submit();</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ======================== 业务方法 ========================

let orderCounter = 0;

export function generateUnionPayOrderId(): string {
  orderCounter++;
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const datePart = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("");
  const timePart = [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
    String(now.getMilliseconds()).padStart(3, "0"),
  ].join("");
  const seq = String(orderCounter).padStart(4, "0");
  return `RV${datePart}${timePart}${seq}`;
}

export function getCurrentTxnTime(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

export function getPayTimeout(): string {
  const future = new Date(Date.now() + 15 * 60 * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return [
    future.getFullYear(),
    pad(future.getMonth() + 1),
    pad(future.getDate()),
    pad(future.getHours()),
    pad(future.getMinutes()),
    pad(future.getSeconds()),
  ].join("");
}

export function buildUnionPaySubject(locale: AppLocale) {
  return locale === "zh"
    ? `深圳机器人谷试运营体验 (${TRIAL_PAYMENT_PRICE_CNY}元/人)`
    : `Shenzhen Robot Valley Trial Experience (${TRIAL_PAYMENT_PRICE_CNY} CNY/person)`;
}
