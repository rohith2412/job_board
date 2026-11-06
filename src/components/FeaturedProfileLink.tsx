"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeaturedStatus } from "@/app/api/featured-student/me/route";

export default function FeaturedProfileLink() {
  const [state, setState] = useState<FeaturedStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/featured-student/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { status: "none" }))
      .catch(() => ({ status: "none" }))
      .then((data: FeaturedStatus) => {
        if (!cancelled) setState(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) {
    return <div className="h-[86px] animate-pulse rounded-2xl bg-gray-100" aria-hidden="true" />;
  }

  const until =
    state.status === "none"
      ? ""
      : new Date(state.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const content =
    state.status === "live"
      ? {
          href: state.href,
          title: "Your featured profile",
          body: `Live for recruiters until ${until}. View or edit it anytime.`,
          badge: "Live",
        }
      : state.status === "draft"
        ? {
            href: state.href,
            title: "Finish your featured profile",
            body: `You're paid up. Add your details to go live (until ${until}).`,
            badge: "Action needed",
          }
        : {
            href: "/featured",
            title: "Get featured",
            body: "Put your profile in front of recruiters for 30 days.",
            badge: "",
          };

  return (
    <Link
      href={content.href}
      className="flex items-center gap-4 rounded-2xl border-2 border-black bg-white p-5 shadow-[0_4px_0_0_#000] transition-all hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#000]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-green-300">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-black" aria-hidden="true">
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-gray-900">
          {content.title}
          {content.badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                state.status === "live" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {content.badge}
            </span>
          )}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">{content.body}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
