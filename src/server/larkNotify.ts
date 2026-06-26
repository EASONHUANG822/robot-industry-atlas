import "server-only";
import { createHmac } from "node:crypto";
import { getLarkConfig } from "./larkConfig";
import type { ApplicationPayload } from "@/config/applicationForm";
import type { FeedbackPayload } from "./airtableFeedback";

const MULTI_TABLE_URL = "https://xcnxydjnox4j.feishu.cn/wiki/JHxnwP8DciEvKukoEyFcHWO5nLe";

function signPayload(secret: string): { timestamp: string; sign: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hmac = createHmac("sha256", timestamp + "\n" + secret);
  hmac.update("");
  const sign = hmac.digest("base64");
  return { timestamp, sign };
}

function sendWebhook(payload: Record<string, unknown>) {
  const config = getLarkConfig();
  if (!config.ok) return Promise.resolve();

  const { timestamp, sign } = signPayload(config.config.botWebhookSecret);
  const body = JSON.stringify({ timestamp, sign, ...payload });

  return fetch(config.config.botWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })
    .then(async (r) => {
      const text = await r.text();
      if (!r.ok) {
        console.error("[FEISHU WEBHOOK] HTTP", r.status, text.slice(0, 200));
        return;
      }
      try {
        const json = JSON.parse(text);
        if (json.code !== 0 && json.StatusCode !== 0) {
          console.error("[FEISHU WEBHOOK] API error:", json.code ?? json.StatusCode, json.msg ?? text.slice(0, 200));
        }
      } catch {
        // not JSON, ignore
      }
    })
    .catch((e) => {
      console.error("[FEISHU WEBHOOK] fetch error:", e instanceof Error ? e.message : e);
    });
}

export async function notifyNewApplication(
  payload: ApplicationPayload
) {
  const name = payload.name ?? "—";
  const org = payload.organization ?? "—";
  const email = payload.email ?? "—";
  const date = payload.preferredVisitDate ?? "—";
  const count = payload.visitorCount ?? "—";

  await sendWebhook({
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: "📝 新的参观申请" },
        template: "blue",
      },
      elements: [
        {
          tag: "div",
          text: { tag: "lark_md", content: `**👤 ${name}** | ${org}\n📧 ${email}\n📅 ${date}\n👥 ${count}人` },
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "查看多维表格" },
              type: "default",
              url: MULTI_TABLE_URL,
            },
          ],
        },
      ],
    },
  });
}

export async function notifyNewFeedback(payload: FeedbackPayload) {
  const name = payload.name ?? "—";
  const role = payload.role ?? "—";
  const msg = payload.message ?? "—";
  const preview = msg.length > 200 ? msg.slice(0, 200) + "..." : msg;

  await sendWebhook({
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: "📨 新的用户评价" },
        template: "green",
      },
      elements: [
        {
          tag: "div",
          text: { tag: "lark_md", content: `**👤 ${name}** | ${role}\n💬 ${preview}` },
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "审核处理" },
              type: "default",
              url: MULTI_TABLE_URL,
            },
          ],
        },
      ],
    },
  });
}
