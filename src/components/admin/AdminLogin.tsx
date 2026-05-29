"use client";

import { useState } from "react";

export function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Login failed.");
        return;
      }
      onLogin();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-xl text-white">&#x1F512;</div>
          <h1 className="text-xl font-bold text-accent">Staff Access</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage feedback</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-line bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-accent">Username</label>
              <input
                type="text"
                className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-accent placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mid-light"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent">Password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-accent placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mid-light"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
