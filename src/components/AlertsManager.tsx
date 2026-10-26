"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AlertsManager() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();

  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    keywords: "",
    location: "",
    remote: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setLoading(false);
      return;
    }
    fetch("/api/alerts/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.subscription) {
          setSubStatus(data.subscription.status);
          const prefs = data.subscription.preferences;
          setPreferences({
            keywords: (prefs?.keywords || []).join(", "),
            location: prefs?.location || "",
            remote: prefs?.remote || false,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [authStatus]);

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/alerts/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage(data.error || "Something went wrong");
        setCheckingOut(false);
      }
    } catch {
      setMessage("Something went wrong");
      setCheckingOut(false);
    }
  }

  async function handleSavePreferences() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
    } catch {
      setMessage("Something went wrong");
    }
    setSaving(false);
  }

  async function handleManageBilling() {
    const res = await fetch("/api/alerts/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-10">
        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Premium Job Alerts</h1>
          <p className="text-gray-500">Sign in to get started</p>
        </div>
        <button
          onClick={() => signIn(undefined, { callbackUrl: "/alerts" })}
          className="px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (subStatus === "active") {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Alerts</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your daily alerts</p>
          </div>
          <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Active
          </span>
        </div>

        {(success || message) && (
          <div className={`text-sm font-medium px-4 py-3 rounded-lg ${success ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
            {success ? "Subscription activated! Set your preferences below." : message}
          </div>
        )}

        <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-base font-semibold text-gray-900">Alert Preferences</h2>
          <p className="text-sm text-gray-500 -mt-3">We&apos;ll send you 5 matching jobs every day.</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Job titles / keywords</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer, Frontend, React"
              value={preferences.keywords}
              onChange={(e) => setPreferences({ ...preferences, keywords: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white"
            />
            <p className="text-xs text-gray-400">Separate multiple keywords with commas</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Preferred location</label>
            <input
              type="text"
              placeholder="e.g. San Francisco, CA or Remote"
              value={preferences.location}
              onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.remote}
              onChange={(e) => setPreferences({ ...preferences, remote: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Remote only</span>
          </label>

          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save preferences"}
          </button>
        </div>

        <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-900">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">Premium Job Alerts</p>
              <p className="text-sm text-gray-500">$4.99/month</p>
            </div>
            <button
              onClick={handleManageBilling}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Manage billing
            </button>
          </div>
        </div>

        <Link href="/jobs" className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center gap-8 py-6">
      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Premium Job Alerts</h1>
        <p className="text-gray-500 max-w-sm">Get 5 personalized SWE jobs delivered to your inbox every morning</p>
      </div>

      {cancelled && (
        <p className="text-sm text-gray-500 bg-gray-50 px-4 py-2.5 rounded-lg">Checkout cancelled. You can try again anytime.</p>
      )}

      <div className="w-full max-w-sm border border-gray-200 rounded-2xl p-6 text-left flex flex-col gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">$4.99</span>
          <span className="text-sm text-gray-500">/month</span>
        </div>

        <ul className="flex flex-col gap-2.5">
          {[
            "5 matching jobs daily in your inbox",
            "Filter by title, location & remote",
            "Earliest postings - apply before others",
            "Cancel anytime",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        <button
          onClick={handleCheckout}
          disabled={checkingOut}
          className="w-full py-3 rounded-full bg-green-300 text-black text-base font-semibold border-2 border-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 cursor-pointer"
        >
          {checkingOut ? "Redirecting to checkout..." : "Subscribe"}
        </button>

        {message && <p className="text-sm text-red-500 text-center">{message}</p>}
      </div>

      <Link href="/jobs" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← Back to jobs
      </Link>
    </div>
  );
}
