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

        {/* Score preview */}
        <div className="flex flex-col items-center px-6 pt-2 pb-6">
          <div className="flex items-center gap-1 mb-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} width="28" height="28" viewBox="0 0 24 24" strokeLinejoin="round">
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  fill={i <= 4 ? "#facc15" : "none"}
                  stroke={i <= 4 ? "#eab308" : "#d1d5db"}
                  strokeWidth="1.5"
                />
              </svg>
            ))}
          </div>

          <h2 className="text-[22px] font-bold text-gray-900 text-center leading-tight tracking-tight">
            How hireable are you?
          </h2>
          <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed max-w-[280px]">
            Get a free AI score on your GitHub, LinkedIn & portfolio in 10 seconds
          </p>

          {/* Feature bullets */}
          <div className="flex flex-col gap-2.5 mt-6 w-full max-w-[300px]">
            {[
              "Analyzes all your developer links",
              "Personalized strengths & improvements",
              "Actionable tip to stand out",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-8 flex flex-col gap-2">
          <Link
            href="/rank"
            onClick={dismiss}
            className="w-full py-3.5 rounded-full text-sm font-semibold text-center border-2 border-black bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all block"
          >
            Rate my profile — free
          </Link>
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
