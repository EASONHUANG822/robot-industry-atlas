"use client";

import { useState } from "react";

type FeedbackFieldKey = "name" | "role" | "message";

export function FeedbackForm({
  translations,
}: {
  translations: Record<string, string>;
}) {
  const [form, setForm] = useState({ name: "", role: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<FeedbackFieldKey, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function handleChange(field: FeedbackFieldKey, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<FeedbackFieldKey, string>> = {};
    if (!form.name.trim()) newErrors.name = translations["form.validation.nameRequired"] ?? "Name is required.";
    if (!form.role.trim()) newErrors.role = translations["form.validation.roleRequired"] ?? "Role is required.";
    if (!form.message.trim()) newErrors.message = translations["form.validation.messageRequired"] ?? "Feedback is required.";
    if (form.message.length > 1000) newErrors.message = translations["form.validation.messageTooLong"] ?? "Message must be 1000 characters or fewer.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), role: form.role.trim(), message: form.message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ message: data?.error ?? (translations["form.error"] ?? "Submission failed.") });
        setStatus("error");
        return;
      }
      setStatus("success");
      setForm({ name: "", role: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  function renderInput(field: FeedbackFieldKey, label: string, placeholder: string, type: "text" | "textarea" = "text") {
    const shared = "w-full rounded-lg border px-4 py-3 text-sm text-accent placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mid-light";
    const errorRing = errors[field] ? " border-red-400 focus:ring-red-300" : " border-line";
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-accent">{label} *</label>
        {type === "textarea" ? (
          <textarea
            className={shared + errorRing + " min-h-[120px] resize-y"}
            placeholder={placeholder}
            value={form[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            maxLength={1000}
          />
        ) : (
          <input
            type="text"
            className={shared + errorRing}
            placeholder={placeholder}
            value={form[field]}
            onChange={(e) => handleChange(field, e.target.value)}
          />
        )}
        {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100">
          <svg className="size-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-emerald-800">{translations["form.success"] ?? "Thank you!"}</p>
        <p className="mt-1 text-sm text-emerald-600">{translations["moderationNotice"] ?? "Your review will be published after moderation."}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-5">
        {renderInput("name", translations["form.name.label"] ?? "Name", translations["form.name.placeholder"] ?? "Your name")}
        {renderInput("role", translations["form.role.label"] ?? "Role & Company", translations["form.role.placeholder"] ?? "e.g. CTO, Robotics Innovation Lab")}
        {renderInput("message", translations["form.message.label"] ?? "Your Feedback", translations["form.message.placeholder"] ?? "Share your thoughts about the visit...", "textarea")}
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? (translations["form.submitting"] ?? "Submitting...") : (translations["form.submit"] ?? "Submit Review")}
      </button>
      {status === "error" && !errors.message && (
        <p className="mt-3 text-center text-sm text-red-500">{translations["form.error"] ?? "Something went wrong. Please try again."}</p>
      )}
    </form>
  );
}
