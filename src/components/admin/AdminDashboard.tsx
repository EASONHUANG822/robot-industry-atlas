"use client";

import { useState, useEffect, useCallback } from "react";

type FeedbackItem = {
  id: string;
  name: string;
  role: string;
  message: string;
  status: "Pending" | "Approved" | "Rejected";
  featured: boolean;
  submittedAt: string;
};

type Tab = "All" | "Pending" | "Approved" | "Rejected";

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fetchFeedback = useCallback(async (tab: Tab) => {
    setLoading(true);
    try {
      const statusParam = tab === "All" ? "" : `?status=${tab}`;
      const res = await fetch(`/api/admin/feedback${statusParam}`);
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching triggered by tab change
    fetchFeedback(activeTab);
  }, [activeTab, fetchFeedback]);

  async function handleAction(id: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchFeedback(activeTab);
      }
      if (res.status === 401) onLogout();
    } catch {
      // silently fail
    }
  }

  function startEdit(item: FeedbackItem) {
    setEditingId(item.id);
    setEditText(item.message);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function saveEdit(id: string) {
    if (editText.trim()) {
      handleAction(id, { message: editText.trim() });
    }
    cancelEdit();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  }

  const tabs: Tab[] = ["All", "Pending", "Approved", "Rejected"];
  const counts = {
    All: feedback.length,
    Pending: feedback.filter((f) => f.status === "Pending").length,
    Approved: feedback.filter((f) => f.status === "Approved").length,
    Rejected: feedback.filter((f) => f.status === "Rejected").length,
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-amber-100 text-amber-800",
      Approved: "bg-emerald-100 text-emerald-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-accent">Feedback Moderation</h1>
          <button onClick={handleLogout} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-muted transition hover:text-accent">
            Sign Out
          </button>
        </div>

        <div className="mt-6 flex gap-2 border-b border-line pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-accent text-white"
                  : "text-muted hover:text-accent"
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted">Loading...</p>
          ) : feedback.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No feedback found.</p>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className={`rounded-xl border bg-white p-5 shadow-sm ${item.featured ? "border-violet-300 ring-1 ring-violet-200" : "border-line"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-accent text-sm">{item.name}</span>
                      <span className="text-xs text-muted">{item.role}</span>
                      {statusBadge(item.status)}
                      {item.featured && (
                        <span className="inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                          &#x2605; Featured
                        </span>
                      )}
                    </div>
                    {editingId === item.id ? (
                      <div>
                        <textarea
                          className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm text-accent focus:outline-none focus:ring-2 focus:ring-mid-light"
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => saveEdit(item.id)} className="rounded bg-accent px-3 py-1 text-xs font-semibold text-white">Save</button>
                          <button onClick={cancelEdit} className="rounded border border-line px-3 py-1 text-xs font-medium text-muted">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm leading-6 text-secondary">{item.message}</p>
                    )}
                    <p className="mt-2 text-xs text-muted">{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ""}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {item.status === "Pending" && (
                      <>
                        <button onClick={() => handleAction(item.id, { status: "Approved" })} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                          Approve
                        </button>
                        <button onClick={() => startEdit(item)} className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-accent">
                          Edit
                        </button>
                        <button onClick={() => handleAction(item.id, { status: "Rejected" })} className="rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                          Reject
                        </button>
                      </>
                    )}
                    {item.status === "Approved" && (
                      <>
                        <button onClick={() => handleAction(item.id, { featured: !item.featured })} className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-accent">
                          {item.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button onClick={() => startEdit(item)} className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-accent">
                          Edit
                        </button>
                        <button onClick={() => handleAction(item.id, { status: "Rejected" })} className="rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </>
                    )}
                    {item.status === "Rejected" && (
                      <>
                        <button onClick={() => handleAction(item.id, { status: "Pending" })} className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-accent">
                          Restore
                        </button>
                        <button onClick={() => handleAction(item.id, { status: "Rejected" })} className="rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
