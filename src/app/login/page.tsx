"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center text-center max-w-sm">
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
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          We&apos;re building something great. This page will be available soon - stay tuned!
        </p>

        <div className="flex gap-1.5 mb-8">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-amber-300" />
          <div className="w-2 h-2 rounded-full bg-amber-200" />
        </div>
      </div>
    </div>
  );
}
