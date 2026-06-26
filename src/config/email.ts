export const TRIAL_PAYMENT_PRICE_CNY = 100;

export const PAYMENT_BENEFIT_KEYS = ["robotOperation"] as const;

export type PaymentBenefitKey = (typeof PAYMENT_BENEFIT_KEYS)[number];

export function getBankAccountInfo() {
  return {
    bankName: process.env.BANK_NAME || "",
    bankBranch: process.env.BANK_BRANCH || "",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
    accountName: process.env.BANK_ACCOUNT_NAME || "",
  };
}
