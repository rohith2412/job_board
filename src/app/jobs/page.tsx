"use client";

import Link from "next/link";

export default function JobsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20h20" />
              <path d="M5 20V8.5L12 3l7 5.5V20" />
              <path d="M9 20v-5h6v5" />
              <path d="M10 9h4" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Under Construction
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-sm">
            We&apos;re building something great. This page will be available soon - stay tuned!
          </p>

          <div className="flex gap-1.5 mb-8">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-2 h-2 rounded-full bg-amber-300" />
            <div className="w-2 h-2 rounded-full bg-amber-200" />
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Go Home
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
