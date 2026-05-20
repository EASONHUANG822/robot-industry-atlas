import {
  buildPayPalOrderRequest,
  getPayPalApprovalUrl,
  getPayPalBaseUrl,
  normalizePayPalEnvironment,
} from "./paypal";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function expectIncludes(value: string, expected: string, message: string) {
  if (!value.includes(expected)) {
    throw new Error(`${message}: expected "${value}" to include "${expected}"`);
  }
}

expectEqual(normalizePayPalEnvironment(undefined), "sandbox", "Default PayPal environment");
expectEqual(normalizePayPalEnvironment("sandbox"), "sandbox", "Sandbox PayPal environment");
expectEqual(normalizePayPalEnvironment("live"), "live", "Live PayPal environment");
expectEqual(normalizePayPalEnvironment("production"), "live", "Production alias");
expectEqual(getPayPalBaseUrl("sandbox"), "https://api-m.sandbox.paypal.com", "Sandbox API base URL");
expectEqual(getPayPalBaseUrl("live"), "https://api-m.paypal.com", "Live API base URL");

const order = buildPayPalOrderRequest({
  cancelUrl: "https://robot.example/zh/payment/cancel",
  locale: "zh",
  quantity: 3,
  returnUrl: "https://robot.example/api/payment/paypal/capture?state=abc",
});

expectEqual(order.intent, "CAPTURE", "PayPal order intent");
expectEqual(order.purchase_units[0]?.amount.currency_code, "CNY", "PayPal order currency");
expectEqual(order.purchase_units[0]?.amount.value, "300.00", "PayPal order amount");
expectEqual(
  order.purchase_units[0]?.description,
  "Shenzhen Robot Valley Trial Experience: 100 CNY/person x 3 person(s)",
  "PayPal order description",
);
expectEqual(
  order.payment_source.paypal.experience_context.return_url,
  "https://robot.example/api/payment/paypal/capture?state=abc",
  "PayPal return URL",
);
expectEqual(
  order.payment_source.paypal.experience_context.cancel_url,
  "https://robot.example/zh/payment/cancel",
  "PayPal cancel URL",
);
expectEqual(
  order.payment_source.paypal.experience_context.shipping_preference,
  "NO_SHIPPING",
  "PayPal order should not request shipping",
);

const approvalUrl = getPayPalApprovalUrl({
  id: "TESTORDER",
  links: [
    { href: "https://api-m.sandbox.paypal.com/v2/checkout/orders/TESTORDER", rel: "self", method: "GET" },
    { href: "https://www.sandbox.paypal.com/checkoutnow?token=TESTORDER", rel: "payer-action", method: "GET" },
  ],
});

expectIncludes(approvalUrl, "checkoutnow?token=TESTORDER", "PayPal payer approval URL");
