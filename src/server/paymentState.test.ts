import { sealPaymentState, unsealPaymentState } from "./paymentState";
import type { ApplicationPayload } from "@/config/applicationForm";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function expectTruthy(value: unknown, message: string) {
  if (!value) {
    throw new Error(message);
  }
}

async function expectRejects(fn: () => Promise<unknown>, message: string) {
  try {
    await fn();
  } catch {
    return;
  }

  throw new Error(message);
}

const payload: ApplicationPayload = {
  name: "Ada Lovelace",
  organization: "Robot Valley Lab",
  email: "ada@example.com",
  phone: "+86 755 0000 0000",
  preferredVisitDate: "2026-06-01",
  visitorCount: "2",
  message: "Need a PayPal receipt.",
};

const secret = "test-secret-with-enough-length";
const now = new Date("2026-05-20T10:00:00.000Z");

async function main() {
  const token = await sealPaymentState(
    {
      locale: "en",
      payload,
      paymentMethod: "paypal",
      quantity: 2,
    },
    { now, secret },
  );

  expectTruthy(token, "Sealed payment state token should be returned");

  const rawToken = Buffer.from(token, "base64url").toString("utf8");
  if (rawToken.includes(payload.email || "") || rawToken.includes(payload.name || "")) {
    throw new Error("Sealed payment state token must not expose form data as plaintext.");
  }

  const unsealed = await unsealPaymentState(token, {
    now: new Date("2026-05-20T10:05:00.000Z"),
    secret,
  });

  expectEqual(unsealed.locale, "en", "Locale round trip");
  expectEqual(unsealed.paymentMethod, "paypal", "Payment method round trip");
  expectEqual(unsealed.quantity, 2, "Quantity round trip");
  expectEqual(unsealed.payload.email, payload.email, "Payload email round trip");
  expectEqual(unsealed.payload.message, payload.message, "Payload message round trip");

  await expectRejects(
    () => unsealPaymentState(`${token.slice(0, -2)}xx`, { now, secret }),
    "Tampered payment state token should be rejected",
  );

  await expectRejects(
    () =>
      unsealPaymentState(token, {
        now: new Date("2026-05-20T11:02:00.000Z"),
        secret,
      }),
    "Expired payment state token should be rejected",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
