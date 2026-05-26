import "server-only";
import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function sendApplicationReceivedEmail(params: {
  to: string;
  name: string;
  preferredVisitDate?: string;
  visitorCount?: string;
  locale: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { to, name, preferredVisitDate, visitorCount, locale } = params;

  const subject =
    locale === "en"
      ? "Application Received — Robot Valley Visit"
      : "参观申请已收到 — 机器人谷";

  const dateStr = preferredVisitDate || "-";
  const countStr = visitorCount || "-";

  const html =
    locale === "en"
      ? `<p>Hi ${name},</p><p>We've received your visit application. We will review it within 1–2 business days and notify you of the result by email.</p><p><strong>Preferred visit date:</strong> ${dateStr}<br><strong>Visitor count:</strong> ${countStr}</p><p>— Robot Valley Team</p>`
      : `<p>${name}，您好：</p><p>我们已收到您的参观申请。我们将在 1–2 个工作日内完成审核，并以邮件形式通知您审核结果，请留意邮箱。</p><p><strong>期望参观日期：</strong>${dateStr}<br><strong>参观人数：</strong>${countStr}</p><p>—— 机器人谷团队</p>`;

  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@robotvalley.cn",
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("Failed to send application received email:", message);
    return { ok: false, error: message };
  }
}

export async function sendApprovalNotificationEmail(params: {
  to: string;
  name: string;
  amount: number;
  visitorCount: number;
  preferredVisitDate?: string;
  locale: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { to, name, amount, visitorCount, preferredVisitDate, locale } = params;

  const bank = {
    bankName: process.env.BANK_NAME || "",
    bankBranch: process.env.BANK_BRANCH || "",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
    accountName: process.env.BANK_ACCOUNT_NAME || "",
  };

  const subject =
    locale === "en"
      ? "Visit Approved — Payment Instructions"
      : "参观申请已通过 — 支付指引";

  const dateStr = preferredVisitDate || "-";

  const html =
    locale === "en"
      ? `<p>Hi ${name},</p><p>Your visit application has been approved. Please complete payment via bank transfer:</p><p><strong>Bank:</strong> ${bank.bankName} ${bank.bankBranch}<br><strong>Account Name:</strong> ${bank.accountName}<br><strong>Account Number:</strong> ${bank.accountNumber}<br><strong>Amount:</strong> ¥${amount} (${visitorCount} persons × ¥${amount / visitorCount}/person)</p><p><strong>Preferred visit date:</strong> ${dateStr}</p><p>After the transfer is confirmed, we will finalize your visit arrangements.</p><p>— Robot Valley Team</p>`
      : `<p>${name}，您好：</p><p>您的参观申请已通过审核。请按以下银行信息完成转账：</p><p><strong>银行：</strong>${bank.bankName} ${bank.bankBranch}<br><strong>户名：</strong>${bank.accountName}<br><strong>账号：</strong>${bank.accountNumber}<br><strong>金额：</strong>¥${amount}（${visitorCount}人 × ¥${amount / visitorCount}/人）</p><p><strong>期望参观日期：</strong>${dateStr}</p><p>转账确认后，我们将为您最终安排参观事宜。</p><p>—— 机器人谷团队</p>`;

  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@robotvalley.cn",
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("Failed to send approval notification email:", message);
    return { ok: false, error: message };
  }
}
