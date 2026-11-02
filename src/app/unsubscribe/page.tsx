"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Suspense } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setStatus(res.ok ? "done" : "error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <Link href="/" className="mb-8">
          <img src="/favicon.png" alt="Reblet" className="w-12 h-12 rounded-2xl" />
        </Link>

        {status === "done" ? (
          <>
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              You&apos;ve been unsubscribed
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              You won&apos;t receive any more job alert emails from Reblet.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Invalid link
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              This unsubscribe link is invalid or has already been used. If you&apos;re still receiving emails, contact us at{" "}
              <a href="mailto:rayandteamsupport@gmail.com" className="underline underline-offset-2">
                rayandteamsupport@gmail.com
              </a>
            </p>
          </>
        )}

        <Link
          href="/jobs"
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Browse jobs →
        </Link>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
