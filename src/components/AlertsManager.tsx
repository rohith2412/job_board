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
  const [subEmail, setSubEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");

  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");
  const verified = searchParams.get("verified");
  const error = searchParams.get("error");

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
          setSubEmail(data.subscription.email || "");
          setEmailVerified(data.subscription.emailVerified ?? false);
          const prefs = data.subscription.preferences;
          setPreferences({
            keywords: (prefs?.keywords || []).join(", "),
            location: prefs?.location || "",
            remote: prefs?.remote || false,
          });
          if (!data.subscription.emailVerified) {
            setVerifyEmail(data.subscription.email || session?.user?.email || "");
          }
        }
      })
      .finally(() => setLoading(false));
  }, [authStatus, session?.user?.email]);

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/alerts/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
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

  async function handleSendVerification() {
    if (!verifyEmail) return;
    setSendingVerification(true);
    setMessage("");
    try {
      const res = await fetch("/api/alerts/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });
      const data = await res.json();
      if (data.verified) {
        setEmailVerified(true);
        setSubEmail(verifyEmail);
        setMessage(data.message);
      } else {
        setMessage(data.message || data.error);
      }
    } catch {
      setMessage("Something went wrong");
    }
    setSendingVerification(false);
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
      <div className="flex flex-col items-center text-center gap-6">
        <p className="text-gray-500">Sign in to get started</p>
        <button
          onClick={() => signIn(undefined, { callbackUrl: "/alerts" })}
          className="px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </div>
    );
  }

  // Step 2: Email verification (active sub, email not verified from DB)
  if (subStatus === "active" && !emailVerified) {
    return (
      <div className="flex flex-col gap-8">
        {success && (
          <div className="text-sm font-medium px-4 py-3 rounded-lg bg-green-50 text-green-700">
            Subscription activated! Now verify your email to start receiving alerts.
          </div>
        )}
        {error === "invalid" && (
          <div className="text-sm font-medium px-4 py-3 rounded-lg bg-red-50 text-red-600">
            That verification link has expired. Please send a new one below.
          </div>
        )}

        <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Verify your email</h2>
            <p className="text-sm text-gray-500">We need to verify your email before we can send you daily job alerts.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={verifyEmail}
              onChange={(e) => setVerifyEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white"
            />
          </div>

          <button
            onClick={handleSendVerification}
            disabled={sendingVerification || !verifyEmail}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {sendingVerification ? "Sending..." : "Send verification email"}
          </button>

          {message && (
            <div className={`text-sm font-medium px-4 py-3 rounded-lg ${message.includes("sent") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {message}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">Check your inbox and click the link to verify. You can also change the email above if needed.</p>
        </div>

        <Link href="/jobs" className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  // Step 3: Preferences (active sub, email verified)
  if (subStatus === "active") {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            <span>{subEmail}</span>
          </div>
          <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Active
          </span>
        </div>

        {(verified || message) && (
          <div className={`text-sm font-medium px-4 py-3 rounded-lg ${verified ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
            {verified ? "Email verified! Set your preferences below to start receiving alerts." : message}
          </div>
        )}

        <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-base font-semibold text-gray-900">Alert Preferences</h2>
          <p className="text-sm text-gray-500 -mt-3">We&apos;ll send you 5 matching jobs every morning.</p>

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
              <p className="text-sm text-gray-500">$3.99/month</p>
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

  // Step 1: Pricing / checkout
  return (
    <div className="flex flex-col items-center gap-8">
      {cancelled && (
        <p className="text-sm text-gray-500 bg-gray-50 px-4 py-2.5 rounded-lg">Checkout cancelled. You can try again anytime.</p>
      )}

      <div className="w-full grid grid-cols-2 gap-3">
        <button
          onClick={() => setPlan("monthly")}
          className={`relative rounded-2xl p-5 text-left transition-all cursor-pointer ${
            plan === "monthly"
              ? "bg-gray-900 text-white ring-2 ring-gray-900"
              : "bg-gray-50 text-gray-900 hover:bg-gray-100 ring-1 ring-gray-200"
          }`}
        >
          <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${plan === "monthly" ? "text-gray-400" : "text-gray-500"}`}>Monthly</p>
          <p className="text-2xl font-bold">$3.99</p>
          <p className={`text-xs mt-1 ${plan === "monthly" ? "text-gray-400" : "text-gray-500"}`}>/month</p>
        </button>

        <button
          onClick={() => setPlan("yearly")}
          className={`relative rounded-2xl p-5 text-left transition-all cursor-pointer ${
            plan === "yearly"
              ? "bg-gray-900 text-white ring-2 ring-gray-900"
              : "bg-gray-50 text-gray-900 hover:bg-gray-100 ring-1 ring-gray-200"
          }`}
        >
          <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider bg-green-400 text-black px-2 py-0.5 rounded-full">
            Save 48%
          </span>
          <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${plan === "yearly" ? "text-gray-400" : "text-gray-500"}`}>Yearly</p>
          <p className="text-2xl font-bold">$24.99</p>
          <p className={`text-xs mt-1 ${plan === "yearly" ? "text-gray-400" : "text-gray-500"}`}>/year · $2.08/mo</p>
        </button>
      </div>

      <div className="w-full flex flex-col gap-3">
        {[
          "5 hand-matched jobs emailed to you every morning",
          "Zero noise - only roles that fit your skills & goals",
          "See jobs hours before they hit big boards",
          "Cancel in one click, no questions asked",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm text-gray-700">
            <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            {item}
          </div>
        ))}
      </div>

      <button
        onClick={handleCheckout}
        disabled={checkingOut}
        className="w-full py-3.5 rounded-full bg-green-300 text-black text-base font-semibold border-2 border-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 cursor-pointer"
      >
        {checkingOut ? "Redirecting to checkout..." : `Subscribe · ${plan === "monthly" ? "$3.99/mo" : "$24.99/yr"}`}
      </button>

      {message && <p className="text-sm text-red-500 text-center">{message}</p>}

      <Link href="/jobs" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← Back to jobs
      </Link>
    </div>
  );
}
