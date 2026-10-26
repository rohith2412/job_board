"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function JobAlertForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const alert = searchParams.get("alert");
    if (alert === "confirmed") {
      setStatus("success");
      setMessage("You're subscribed! You'll receive job alerts soon.");
    } else if (alert === "unsubscribed") {
      setStatus("success");
      setMessage("You've been unsubscribed from job alerts.");
    } else if (alert === "invalid") {
      setStatus("error");
      setMessage("Invalid or expired link.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900">Get new jobs in your inbox</h3>
        <p className="text-sm text-gray-500">Free weekly alerts for curated SWE jobs</p>

        {status === "success" ? (
          <p className="text-sm font-medium text-green-700 bg-green-50 px-4 py-2.5 rounded-lg">
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-sm mt-1">
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              required
              className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-sm text-red-500">{message}</p>
        )}

        <p className="text-xs text-gray-400">No spam · Unsubscribe anytime</p>
      </div>
    </div>
  );
}
