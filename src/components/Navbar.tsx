"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

function NavbarContent() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto max-w-2xl flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/favicon.png"
            alt="Reblet"
            className="w-8 h-8 rounded-lg"
          />
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            Reblet
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          ) : session?.user ? (
            <Link href="/profile">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  className="w-8 h-8 rounded-full hover:ring-2 hover:ring-gray-200 transition-all"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 hover:ring-2 hover:ring-gray-200 transition-all">
                  {session.user.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Navbar() {
  return <NavbarContent />;
}
