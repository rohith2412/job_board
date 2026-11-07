"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FeaturedCard, { type FeaturedCardProfile } from "@/components/FeaturedCard";
import { STAR_PATH } from "@/lib/card-design";

type Student = FeaturedCardProfile & { id: string };

const COOLDOWN_MS = 20 * 60 * 1000;
const DISMISSED_KEY = "featured-spotlight-dismissed-at";
const ROTATION_KEY = "featured-spotlight-index";

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return Number.isFinite(at) && Date.now() - at < COOLDOWN_MS;
  } catch {
    return false;
  }
}

// Round-robin so every featured student gets a fair share of spotlights.
function nextIndex(count: number) {
  try {
    const next = ((Number(localStorage.getItem(ROTATION_KEY)) || 0) + 1) % count;
    localStorage.setItem(ROTATION_KEY, String(next));
    return next;
  } catch {
    return Math.floor(Math.random() * count);
  }
}

export default function FeaturedSpotlight() {
  const pathname = usePathname();
  const [student, setStudent] = useState<Student | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (student || pathname?.startsWith("/featured") || recentlyDismissed()) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/featured-student/live");
        if (!res.ok) return;
        const { students } = (await res.json()) as { students: Student[] };
        if (!cancelled && students.length > 0) setStudent(students[nextIndex(students.length)]);
      } catch {}
    }, 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname, student]);

  useEffect(() => {
    if (student && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [student]);

  function close() {
    dialogRef.current?.close();
  }

  function handleClosed() {
    setStudent(null);
    try {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch {}
  }

  if (!student) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="featured-spotlight-title"
      onClose={handleClosed}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(380px,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <p id="featured-spotlight-title" className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-green-600" aria-hidden="true">
            <path d={STAR_PATH} />
          </svg>
          Featured student
        </p>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <FeaturedCard profile={student} />

      <div className="mt-5 flex">
        <Link
          href="/jobs#featured-students"
          onClick={close}
          className="flex-1 rounded-full border-2 border-black bg-green-300 py-2.5 text-center text-sm font-semibold text-black shadow-[0_3px_0_0_#000] transition-all hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#000]"
        >
          See more students
        </Link>
      </div>
      <p className="mt-3 text-center text-xs text-gray-500">
        Want to be here?{" "}
        <Link href="/featured" onClick={close} className="font-semibold text-green-700 hover:text-green-800">
          Get featured →
        </Link>
      </p>
    </dialog>
  );
}
