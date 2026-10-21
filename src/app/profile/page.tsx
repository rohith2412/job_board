"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import SessionProvider from "@/components/SessionProvider";
import RegionSelector from "@/components/RegionSelector";

const REGION_LABELS: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  CH: "Switzerland",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
  IN: "India",
  OTHER: "Other",
};

function ProfileContent() {
  const { data: session, status } = useSession();
  const [region, setRegion] = useState<string | null>(null);
  const [regionLoading, setRegionLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setRegionLoading(false);
      return;
    }
    fetch("/api/user/region")
      .then((r) => r.json())
      .then((data) => {
        setRegion(data.region || null);
        setRegionLoading(false);
      })
      .catch(() => setRegionLoading(false));
  }, [status]);

  if (status === "loading" || regionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Sign in to view your profile
            </h1>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Sign in with Google to access your profile and apply to jobs.
            </p>
            <button
              onClick={() => signIn("google")}
              className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity"
            >
              <img
                src="/google-signin-button.svg"
                alt="Sign in with Google"
                className="h-[40px]"
              />
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!region) {
    return <RegionSelector onSelect={(r) => setRegion(r)} />;
  }

  const user = session.user;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
        <div className="flex-1 px-6 py-10 flex flex-col gap-8">
          <div className="flex items-center gap-5">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "Profile"}
                className="w-20 h-20 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-semibold text-gray-400">
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user?.name}
              </h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                {REGION_LABELS[region] || region}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Quick Links
            </h2>
            <Link
              href="/jobs"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                  </svg>
                </div>
                <span className="text-base font-medium text-gray-800">
                  Browse Jobs
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
            <Link
              href="/companies"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4v18" />
                    <path d="M19 21V11l-6-4" />
                    <path d="M9 9h1" />
                    <path d="M9 13h1" />
                    <path d="M9 17h1" />
                  </svg>
                </div>
                <span className="text-base font-medium text-gray-800">
                  View Companies
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="h-px bg-gray-100" />

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-fit cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <SessionProvider>
      <ProfileContent />
    </SessionProvider>
  );
}
