export const TRIAL_PAYMENT_PRICE_CNY = 100;

export const PAYMENT_BENEFIT_KEYS = [
  "robotOperation",
  "printedGift",
  "refreshments",
] as const;

export type PaymentBenefitKey = (typeof PAYMENT_BENEFIT_KEYS)[number];
