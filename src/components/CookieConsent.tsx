"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookie_consent")) {
        setVisible(true);
      }
    } catch {}
  }, []);

  function accept() {
    try { localStorage.setItem("cookie_consent", "accepted"); } catch {}
    setVisible(false);
  }

  function decline() {
    try { localStorage.setItem("cookie_consent", "declined"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-xl bg-white rounded-2xl border border-gray-200 shadow-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            We use cookies
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            We use cookies and analytics to improve your experience and understand how our site is used.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
