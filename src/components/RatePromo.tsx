"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOLDOWN_MS = 20 * 60 * 1000;

export default function RatePromo() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("rate-promo-rated")) return;

      const dismissed = localStorage.getItem("rate-promo-dismissed-at");
      if (dismissed) {
        const elapsed = Date.now() - parseInt(dismissed, 10);
        if (elapsed < COOLDOWN_MS) return;
      }
    } catch {}

    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem("rate-promo-dismissed-at", Date.now().toString());
    } catch {}
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg animate-in slide-in-from-bottom-4">
      <div className="relative flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-lg">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div className="flex-1 pr-4">
          <p className="text-sm font-semibold text-gray-900">
            How strong is your profile?
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Free AI rating of your GitHub, LinkedIn & more
          </p>
        </div>
        <Link
          href="/rank"
          onClick={dismiss}
          className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold border-2 border-black bg-green-300 text-black shadow-[0_3px_0_0_#000] hover:shadow-[0_1px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] transition-all"
        >
          Rate me
        </Link>
      </div>
    </div>
  );
}
