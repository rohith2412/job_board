"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

const COOLDOWN_MS = 20 * 60 * 1000;

export default function RatePromo() {
  const { status } = useSession();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status === "authenticated") return;
    if (status === "loading") return;

    try {
      const dismissed = localStorage.getItem("signup-promo-dismissed-at");
      if (dismissed) {
        const elapsed = Date.now() - parseInt(dismissed, 10);
        if (elapsed < COOLDOWN_MS) return;
      }
    } catch {}

    const timer = setTimeout(() => setShow(true), 1000);
    return () => clearTimeout(timer);
  }, [status]);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem("signup-promo-dismissed-at", Date.now().toString());
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-white/80 backdrop-blur-md px-0 sm:px-4">
      <div className="w-full sm:max-w-[400px] bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.10)] overflow-hidden">
        {/* Close button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={dismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pt-2 pb-6">
          <img
            src="/favicon.png"
            alt="Reblet"
            className="w-14 h-14 rounded-2xl mb-5"
          />

          <h2 className="text-[22px] font-bold text-gray-900 text-center leading-tight tracking-tight">
            Join Reblet for free
          </h2>
        </div>

        <div className="px-6 pb-8 flex flex-col items-center gap-3">
          <div className="w-full max-w-[250px] flex flex-col gap-3">
            <button
              onClick={() => { dismiss(); signIn("google", { callbackUrl: "/jobs" }); }}
              className="w-full h-[52px] flex items-center justify-center gap-3 rounded-full border border-gray-400 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="text-[17px] font-semibold text-gray-800">Sign in with Google</span>
            </button>
            <Link
              href="/login"
              onClick={dismiss}
              className="w-full h-[52px] flex items-center justify-center gap-3 rounded-full border border-gray-400 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors no-underline"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 4L12 13L2 4"/>
              </svg>
              <span className="text-[17px] font-semibold text-gray-800">Sign up with email</span>
            </Link>
          </div>
          <button
            onClick={dismiss}
            className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
