import "server-only";
import { getLarkConfig } from "./larkConfig";
import type { ApplicationPayload } from "@/config/applicationForm";
import type { FeedbackPayload } from "./airtableFeedback";

const MULTI_TABLE_URL = "https://xcnxydjnox4j.feishu.cn/wiki/JHxnwP8DciEvKukoEyFcHWO5nLe";

function sendWebhook(payload: Record<string, unknown>) {
  const config = getLarkConfig();
  if (!config.ok) return Promise.resolve();

  return fetch(config.config.botWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function notifyNewApplication(
  payload: ApplicationPayload,
  _airtableRecordId: string
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

export async function notifyNewFeedback(payload: FeedbackPayload, _airtableRecordId: string) {
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
