"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/user/consent")
        .then((r) => r.json())
        .then((data) => {
          if (data.consented) router.replace("/jobs");
        })
        .catch(() => {});
    }
  }, [status, router]);

  async function handleAgree() {
    setLoading(true);
    await fetch("/api/user/consent", { method: "POST" }).catch(() => {});
    router.replace("/jobs");
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img
          src="/favicon.png"
          alt="Reblet"
          className="w-14 h-14 rounded-2xl mb-6"
        />

        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          You&apos;re in, {session?.user?.name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          One last thing before you start browsing.
        </p>

        <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="relative mt-0.5 shrink-0">
              <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded bg-green-500/10 backdrop-blur-[1px] pointer-events-none" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Email me about new job openings
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                We&apos;ll send you relevant SWE internship and new grad roles
                as they get posted. You can unsubscribe anytime from your
                profile settings.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleAgree}
          disabled={loading}
          className="w-full py-3.5 rounded-full text-sm font-semibold transition-all cursor-pointer border-2 border-black bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Setting up..." : "Agree & browse jobs"}
        </button>

        <p className="text-xs text-gray-400 mt-4 text-center">
          By continuing you agree to receive emails from Reblet about job
          openings relevant to your profile.
        </p>
      </div>
    </main>
  );
}
