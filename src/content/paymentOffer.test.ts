import { PAYMENT_BENEFIT_KEYS, TRIAL_PAYMENT_PRICE_CNY } from "./paymentOffer";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

expectEqual(TRIAL_PAYMENT_PRICE_CNY, 100, "Trial payment price");
expectEqual(PAYMENT_BENEFIT_KEYS.length, 3, "Payment benefit count");
expectEqual(PAYMENT_BENEFIT_KEYS[0], "robotOperation", "First payment benefit");
expectEqual(PAYMENT_BENEFIT_KEYS[1], "printedGift", "Second payment benefit");
expectEqual(PAYMENT_BENEFIT_KEYS[2], "refreshments", "Third payment benefit");
