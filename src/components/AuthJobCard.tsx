"use client";

import { useSession, signIn } from "next-auth/react";

export default function AuthJobCard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="relative">{children}</div>;
  }

  if (!session) {
    return (
      <div className="relative">
        <div className="blur-[3px] opacity-60 select-none pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] rounded-2xl">
          <button
            onClick={() => signIn("google", { callbackUrl: window.location.href })}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img src="/google-signin-button.svg" alt="Sign in with Google" className="h-10" />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
