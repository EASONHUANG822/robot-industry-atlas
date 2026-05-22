import "server-only";
import crypto from "crypto";

// ======================== 配置 ========================

export interface WechatPayConfig {
  mchid: string;
  appid: string;
  certificateSerialNo: string;
  privateKey: string;
  wechatPayPublicKeyId: string;
  wechatPayPublicKey: string;
  apiV3Key: string;
}

export function getWechatPayConfig(): WechatPayConfig {
  const mchid = process.env.WECHAT_PAY_MCHID;
  const appid = process.env.WECHAT_PAY_APPID;
  const certificateSerialNo = process.env.WECHAT_PAY_CERTIFICATE_SERIAL_NO;
  const privateKey = process.env.WECHAT_PAY_PRIVATE_KEY;
  const wechatPayPublicKeyId = process.env.WECHAT_PAY_PUBLIC_KEY_ID;
  const wechatPayPublicKey = process.env.WECHAT_PAY_PUBLIC_KEY;
  const apiV3Key = process.env.WECHAT_PAY_API_V3_KEY;

  if (
    !mchid ||
    !appid ||
    !certificateSerialNo ||
    !privateKey ||
    !wechatPayPublicKeyId ||
    !wechatPayPublicKey ||
    !apiV3Key
  ) {
    throw new Error(
      "Missing WeChat Pay configuration. Check WECHAT_PAY_* environment variables.",
    );
  }

  return {
    mchid,
    appid,
    certificateSerialNo,
    privateKey,
    wechatPayPublicKeyId,
    wechatPayPublicKey,
    apiV3Key,
  };
}

// ======================== 签名工具 ========================

const NONCE_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function createNonce(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += NONCE_CHARS[bytes[i] % NONCE_CHARS.length];
  }
  return result;
}

function sign(message: string, privateKeyPem: string): string {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(message);
  signer.end();
  return signer.sign(privateKeyPem, "base64");
}

function verify(
  message: string,
  signature: string,
  publicKeyPem: string,
): boolean {
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(message);
  verifier.end();
  return verifier.verify(publicKeyPem, signature, "base64");
}

export function buildAuthorization(
  mchid: string,
  certificateSerialNo: string,
  privateKey: string,
  method: string,
  uri: string,
  body: string | null,
): string {
  const nonce = createNonce(32);
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${method}\n${uri}\n${timestamp}\n${nonce}\n${body ?? ""}\n`;
  const signature = sign(message, privateKey);

  return [
    'WECHATPAY2-SHA256-RSA2048',
    `mchid="${mchid}"`,
    `nonce_str="${nonce}"`,
    `signature="${signature}"`,
    `timestamp="${timestamp}"`,
    `serial_no="${certificateSerialNo}"`,
  ].join(",");
}

// ======================== 应答验签 ========================

export function validateResponse(
  wechatPayPublicKeyId: string,
  wechatPayPublicKey: string,
  headers: Headers,
  body: string,
): void {
  const timestamp = headers.get("Wechatpay-Timestamp");
  const requestId = headers.get("Request-ID");

  if (!timestamp) {
    throw new Error(
      `Validate response failed, missing Wechatpay-Timestamp, request-id[${requestId}]`,
    );
  }

  const responseTime = new Date(Number(timestamp) * 1000);
  if (Math.abs(Date.now() - responseTime.getTime()) >= 5 * 60 * 1000) {
    throw new Error(
      `Validate response failed, timestamp[${timestamp}] is expired, request-id[${requestId}]`,
    );
  }

  const serialNumber = headers.get("Wechatpay-Serial");
  if (serialNumber !== wechatPayPublicKeyId) {
    throw new Error(
      `Validate response failed, Invalid Wechatpay-Serial, Local: ${wechatPayPublicKeyId}, Remote: ${serialNumber}`,
    );
  }

  const signature = headers.get("Wechatpay-Signature");
  const nonce = headers.get("Wechatpay-Nonce");
  const message = `${timestamp}\n${nonce}\n${body ?? ""}\n`;

  if (!signature || !verify(message, signature, wechatPayPublicKey)) {
    throw new Error(
      `Validate response failed, WechatPay signature is incorrect. Request-ID[${requestId}]`,
    );
  }
}

// ======================== HTTP 请求 ========================

const WECHAT_PAY_HOST = "https://api.mch.weixin.qq.com";

export async function wechatPayRequest<T>(
  config: WechatPayConfig,
  method: string,
  path: string,
  body: object | null,
): Promise<T> {
  const reqBody = body ? JSON.stringify(body) : null;
  const authorization = buildAuthorization(
    config.mchid,
    config.certificateSerialNo,
    config.privateKey,
    method,
    path,
    reqBody,
  );

  const response = await fetch(`${WECHAT_PAY_HOST}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Wechatpay-Serial": config.wechatPayPublicKeyId,
      Authorization: authorization,
    },
    body: reqBody,
  });

  const respBody = await response.text();

  if (response.ok) {
    validateResponse(
      config.wechatPayPublicKeyId,
      config.wechatPayPublicKey,
      response.headers,
      respBody,
    );
    return JSON.parse(respBody) as T;
  }

  throw new WechatPayApiException(response.status, respBody, response.headers);
}

// ======================== API 异常 ========================

export class WechatPayApiException extends Error {
  public statusCode: number;
  public body: string;
  public headers: Headers;
  public errorCode?: string;
  public errorMessage?: string;

  constructor(statusCode: number, body: string, headers: Headers) {
    super(
      `WeChat Pay API failed, StatusCode: [${statusCode}], Body: [${body}]`,
    );
    this.statusCode = statusCode;
    this.body = body;
    this.headers = headers;

    try {
      const json = JSON.parse(body);
      this.errorCode = json.code;
      this.errorMessage = json.message;
    } catch {
      // ignore parse errors
    }
  }
}

// ======================== 回调通知处理 ========================

export interface WechatPayNotification {
  id: string;
  create_time: string;
  event_type: string;
  resource_type: string;
  summary: string;
  resource: {
    original_type: string;
    algorithm: string;
    ciphertext: string;
    associated_data: string;
    nonce: string;
  };
}

export interface WechatPayTransaction {
  appid: string;
  mchid: string;
  out_trade_no: string;
  transaction_id: string;
  trade_type: string;
  trade_state: string;
  trade_state_desc: string;
  bank_type: string;
  attach: string;
  success_time: string;
  payer: { openid: string };
  amount: {
    total: number;
    payer_total: number;
    currency: string;
    payer_currency: string;
  };
}

function aesAeadDecrypt(
  key: Buffer,
  associatedData: string,
  nonce: string,
  ciphertext: string,
): string {
  const AUTH_TAG_LENGTH = 16; // 128 bits
  const ciphertextBuffer = Buffer.from(ciphertext, "base64");
  const data = ciphertextBuffer.subarray(
    0,
    ciphertextBuffer.length - AUTH_TAG_LENGTH,
  );
  const authTag = ciphertextBuffer.subarray(
    ciphertextBuffer.length - AUTH_TAG_LENGTH,
  );

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(nonce, "utf8"),
  ) as crypto.DecipherGCM;
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(associatedData, "utf8"));

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

export function parseNotification(
  apiV3Key: string,
  wechatPayPublicKeyId: string,
  wechatPayPublicKey: string,
  headers: Headers,
  body: string,
): WechatPayTransaction {
  validateNotification(wechatPayPublicKeyId, wechatPayPublicKey, headers, body);

  const notification = JSON.parse(body) as WechatPayNotification;
  const { resource } = notification;

  if (resource.algorithm !== "AEAD_AES_256_GCM") {
    throw new Error(`Unsupported algorithm: ${resource.algorithm}`);
  }

  const plaintext = aesAeadDecrypt(
    Buffer.from(apiV3Key, "utf8"),
    resource.associated_data,
    resource.nonce,
    resource.ciphertext,
  );

  return JSON.parse(plaintext) as WechatPayTransaction;
}

function validateNotification(
  wechatPayPublicKeyId: string,
  wechatPayPublicKey: string,
  headers: Headers,
  body: string,
): void {
  const timestamp = headers.get("Wechatpay-Timestamp");

  if (!timestamp) {
    throw new Error(
      "Validate notification failed, missing Wechatpay-Timestamp",
    );
  }

  const responseTime = new Date(Number(timestamp) * 1000);
  if (Math.abs(Date.now() - responseTime.getTime()) >= 5 * 60 * 1000) {
    throw new Error(
      `Validate notification failed, timestamp[${timestamp}] is expired`,
    );
  }

  const serialNumber = headers.get("Wechatpay-Serial");
  if (serialNumber !== wechatPayPublicKeyId) {
    throw new Error(
      `Validate notification failed, Invalid Wechatpay-Serial, Local: ${wechatPayPublicKeyId}, Remote: ${serialNumber}`,
    );
  }

  const signature = headers.get("Wechatpay-Signature");
  const nonce = headers.get("Wechatpay-Nonce");
  const message = `${timestamp}\n${nonce}\n${body ?? ""}\n`;

  if (!signature || !verify(message, signature, wechatPayPublicKey)) {
    throw new Error(
      "Validate notification failed, WechatPay signature is incorrect.",
    );
  }
}

// ======================== 订单查询 ========================

interface QueryOrderResponse {
  appid: string;
  mchid: string;
  out_trade_no: string;
  transaction_id?: string;
  trade_type: string;
  trade_state: string;
  trade_state_desc: string;
  bank_type?: string;
  attach?: string;
  success_time?: string;
  payer?: { openid: string };
  amount?: {
    total: number;
    payer_total: number;
    currency: string;
    payer_currency: string;
  };
}

export async function queryOrderByOutTradeNo(
  config: WechatPayConfig,
  outTradeNo: string,
): Promise<QueryOrderResponse> {
  const path = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${config.mchid}`;
  return wechatPayRequest<QueryOrderResponse>(config, "GET", path, null);
}
