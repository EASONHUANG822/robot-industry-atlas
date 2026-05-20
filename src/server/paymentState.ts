import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { ApplicationPayload } from "@/config/applicationForm";
import type { PaymentMethod } from "@/content/paymentOffer";
import type { AppLocale } from "@/i18n/routing";

export type PaymentState = {
  locale: AppLocale;
  payload: ApplicationPayload;
  paymentMethod: PaymentMethod;
  quantity: number;
};

type PaymentStateEnvelope = PaymentState & {
  issuedAt: string;
};

type PaymentStateOptions = {
  now?: Date;
  secret?: string;
  maxAgeMs?: number;
};

const PAYMENT_STATE_VERSION = "v1";
const PAYMENT_STATE_MAX_AGE_MS = 60 * 60 * 1000;
const AES_GCM_IV_BYTES = 12;
const AES_GCM_TAG_BYTES = 16;

export async function sealPaymentState(state: PaymentState, options: PaymentStateOptions = {}) {
  const now = options.now ?? new Date();
  const envelope: PaymentStateEnvelope = {
    ...state,
    issuedAt: now.toISOString(),
  };
  const plaintext = Buffer.from(JSON.stringify(envelope), "utf8");
  const iv = randomBytes(AES_GCM_IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getPaymentStateKey(options.secret), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([
    Buffer.from(`${PAYMENT_STATE_VERSION}.`, "utf8"),
    iv,
    tag,
    encrypted,
  ]).toString("base64url");
}

export async function unsealPaymentState(token: string, options: PaymentStateOptions = {}) {
  const buffer = Buffer.from(token, "base64url");
  const prefix = Buffer.from(`${PAYMENT_STATE_VERSION}.`, "utf8");

  if (buffer.length <= prefix.length + AES_GCM_IV_BYTES + AES_GCM_TAG_BYTES) {
    throw new Error("Invalid payment state token.");
  }

  if (!buffer.subarray(0, prefix.length).equals(prefix)) {
    throw new Error("Unsupported payment state token version.");
  }

  const ivStart = prefix.length;
  const tagStart = ivStart + AES_GCM_IV_BYTES;
  const encryptedStart = tagStart + AES_GCM_TAG_BYTES;
  const iv = buffer.subarray(ivStart, tagStart);
  const tag = buffer.subarray(tagStart, encryptedStart);
  const encrypted = buffer.subarray(encryptedStart);
  const decipher = createDecipheriv("aes-256-gcm", getPaymentStateKey(options.secret), iv);
  decipher.setAuthTag(tag);

  let envelope: PaymentStateEnvelope;
  try {
    envelope = JSON.parse(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8"),
    ) as PaymentStateEnvelope;
  } catch {
    throw new Error("Invalid payment state token.");
  }

  const issuedAt = Date.parse(envelope.issuedAt);
  if (!Number.isFinite(issuedAt)) {
    throw new Error("Invalid payment state timestamp.");
  }

  const now = options.now ?? new Date();
  const maxAgeMs = options.maxAgeMs ?? PAYMENT_STATE_MAX_AGE_MS;
  if (now.getTime() - issuedAt > maxAgeMs) {
    throw new Error("Payment state token expired.");
  }

  return {
    locale: envelope.locale,
    payload: envelope.payload,
    paymentMethod: envelope.paymentMethod,
    quantity: envelope.quantity,
  } satisfies PaymentState;
}

export function getPaymentStateSecret() {
  const secret = process.env.PAYMENT_STATE_SECRET || process.env.PAYPAL_CLIENT_SECRET;
  if (!secret) {
    throw new Error("Missing PAYMENT_STATE_SECRET or PAYPAL_CLIENT_SECRET.");
  }

  return secret;
}

function getPaymentStateKey(secret = getPaymentStateSecret()) {
  return createHash("sha256").update(secret).digest();
}
