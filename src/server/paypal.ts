import { TRIAL_PAYMENT_PRICE_CNY } from "@/content/paymentOffer";
import type { AppLocale } from "@/i18n/routing";

export type PayPalEnvironment = "sandbox" | "live";

type PayPalLink = {
  href: string;
  rel: string;
  method?: string;
};

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
};

export type PayPalOrderRequest = ReturnType<typeof buildPayPalOrderRequest>;

export function normalizePayPalEnvironment(value: string | undefined): PayPalEnvironment {
  if (value === "live" || value === "production") return "live";
  return "sandbox";
}

export function getPayPalBaseUrl(environment: PayPalEnvironment) {
  return environment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function buildPayPalOrderRequest({
  cancelUrl,
  locale,
  quantity,
  returnUrl,
}: {
  cancelUrl: string;
  locale: AppLocale;
  quantity: number;
  returnUrl: string;
}) {
  const amountValue = (TRIAL_PAYMENT_PRICE_CNY * quantity).toFixed(2);

  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: "robot-valley-trial-experience",
        custom_id: "robot-valley-trial-experience",
        description: `Shenzhen Robot Valley Trial Experience: ${TRIAL_PAYMENT_PRICE_CNY} CNY/person x ${quantity} person(s)`,
        amount: {
          currency_code: "CNY",
          value: amountValue,
        },
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: locale === "zh" ? "深圳机器人谷" : "Shenzhen Robot Valley",
          locale: locale === "zh" ? "zh-CN" : "en-US",
          payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      },
    },
  } as const;
}

export function getPayPalApprovalUrl(order: PayPalOrderResponse) {
  const approvalLink = order.links?.find((link) => link.rel === "payer-action" || link.rel === "approve");
  if (!approvalLink?.href) {
    throw new Error("PayPal order did not include an approval URL.");
  }

  return approvalLink.href;
}

export async function createPayPalCheckoutOrder({
  cancelUrl,
  locale,
  quantity,
  returnUrl,
}: {
  cancelUrl: string;
  locale: AppLocale;
  quantity: number;
  returnUrl: string;
}) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getConfiguredPayPalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPayPalOrderRequest({ cancelUrl, locale, quantity, returnUrl })),
  });
  const order = (await readPayPalJson(response)) as PayPalOrderResponse;

  if (!response.ok) {
    throw new Error(getPayPalErrorMessage("PayPal order creation failed.", order));
  }

  return {
    id: order.id,
    approvalUrl: getPayPalApprovalUrl(order),
  };
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getConfiguredPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  const capture = (await readPayPalJson(response)) as PayPalOrderResponse;

  if (!response.ok) {
    throw new Error(getPayPalErrorMessage("PayPal order capture failed.", capture));
  }

  if (capture.status !== "COMPLETED") {
    throw new Error(`PayPal order capture was not completed. Status: ${capture.status || "unknown"}.`);
  }

  return capture;
}

async function getPayPalAccessToken() {
  const { clientId, clientSecret } = getPayPalConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getConfiguredPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });
  const tokenResponse = (await readPayPalJson(response)) as { access_token?: string };

  if (!response.ok || !tokenResponse.access_token) {
    throw new Error(getPayPalErrorMessage("PayPal access token request failed.", tokenResponse));
  }

  return tokenResponse.access_token;
}

function getConfiguredPayPalBaseUrl() {
  return getPayPalBaseUrl(getPayPalConfig().environment);
}

function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal server configuration. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }

  return {
    clientId,
    clientSecret,
    environment: normalizePayPalEnvironment(process.env.PAYPAL_ENVIRONMENT),
  };
}

async function readPayPalJson(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function getPayPalErrorMessage(fallback: string, body: unknown) {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    const message = record.message || record.error_description || record.name;
    if (typeof message === "string" && message) {
      return `${fallback} (${message})`;
    }
  }

  return fallback;
}
