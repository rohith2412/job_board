"use client";

import {
  useSession,
  signIn,
  SessionProvider as NextAuthSessionProvider,
} from "next-auth/react";

function JobAuthContent({
  snippet,
  link,
}: {
  snippet: string;
  link: string;
}) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  if (status === "loading") {
    return (
      <>
        <div className="flex flex-col gap-6 p-6 bg-gray-50 rounded-2xl animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
        <div className="pb-24" />
      </>
    );
  }

  if (isAuthenticated) {
    return (
      <>
        <div className="flex flex-col gap-6 p-6 bg-gray-50 rounded-2xl">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
              About this role
            </h2>
            <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
              {snippet}
            </p>
          </div>
        </div>
        <div className="pb-24" />

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 z-50">
          <div className="mx-auto max-w-3xl">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-full transition-all text-black text-lg font-semibold border-2 border-black hover:brightness-95 active:translate-y-1 active:shadow-none"
              style={{
                backgroundColor: "#6fde8a",
                boxShadow: "0 4px 0 0 #000",
              }}
            >
              Apply
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-sm text-gray-500">
          Sign in to see full details and apply
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
      <div className="relative rounded-2xl overflow-hidden">
        <div className="flex flex-col gap-6 p-6 bg-gray-50 blur-sm select-none pointer-events-none">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
              About this role
            </h2>
            <p className="text-base text-gray-500 leading-relaxed whitespace-pre-line">
              {snippet}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobAuthSection({
  snippet,
  link,
}: {
  snippet: string;
  link: string;
}) {
  return (
    <NextAuthSessionProvider>
      <JobAuthContent snippet={snippet} link={link} />
    </NextAuthSessionProvider>
  );
}
