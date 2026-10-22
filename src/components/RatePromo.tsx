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

    const timer = setTimeout(() => setShow(true), 1000);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          How strong is your profile?
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Get a free AI-powered rating of your online presence — GitHub, LinkedIn, portfolio & more. See where you stand.
        </p>

        <Link
          href="/rank"
          onClick={dismiss}
          className="w-full py-3.5 rounded-full text-sm font-semibold text-center border-2 border-black bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all block mb-3"
        >
          Rate my profile
        </Link>

        <button
          onClick={dismiss}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer py-2"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
