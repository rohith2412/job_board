"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOLDOWN_MS = 20 * 60 * 1000;

function ScorePreview() {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - 0.72 * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="-rotate-90 origin-center"
      />
      <text x="50" y="46" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">
        72
      </text>
      <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="500">
        B+
      </text>
    </svg>
  );
}

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-[380px] rounded-3xl overflow-hidden shadow-2xl">
        <div
          className="px-8 pt-10 pb-8 flex flex-col items-center text-center"
          style={{
            background: "linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f4a2e 100%)",
          }}
        >
          <ScorePreview />

          <h2 className="text-[22px] font-bold text-white mt-6 leading-tight">
            How strong is your
            <br />
            developer profile?
          </h2>
          <p className="text-sm text-gray-400 mt-3 leading-relaxed">
            AI analyzes your GitHub, LinkedIn & more
            <br />
            and rates you out of 100
          </p>

          <div className="flex items-center gap-6 mt-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
              </svg>
              GitHub
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              LinkedIn
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
              Portfolio
            </div>
          </div>
        </div>

        <div className="bg-white px-8 py-6 flex flex-col gap-3">
          <Link
            href="/rank"
            onClick={dismiss}
            className="w-full py-3.5 rounded-full text-sm font-semibold text-center border-2 border-black bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all block"
          >
            Rate my profile - it&apos;s free
          </Link>
          <button
            onClick={dismiss}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
