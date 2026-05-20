export const TRIAL_PAYMENT_PRICE_CNY = 100;

export const PAYMENT_BENEFIT_KEYS = [
  "robotOperation",
  "printedGift",
  "refreshments",
] as const;

export type PaymentBenefitKey = (typeof PAYMENT_BENEFIT_KEYS)[number];

export const PAYMENT_METHOD_KEYS = ["stripe", "paypal"] as const;

export type PaymentMethod = (typeof PAYMENT_METHOD_KEYS)[number];
