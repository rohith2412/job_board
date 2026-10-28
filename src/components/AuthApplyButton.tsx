"use client";

import { useSession, signIn } from "next-auth/react";

export default function AuthApplyButton({
  href,
  label = "Apply",
}: {
  href: string;
  label?: string;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="mt-2 flex items-center justify-center w-full py-3 sm:py-4 rounded-full text-black text-base sm:text-lg font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] opacity-50">
        {label}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mt-2 relative w-full">
        <div className="flex items-center justify-center gap-3 w-full py-3 sm:py-4 rounded-full text-black text-base sm:text-lg font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] opacity-40 pointer-events-none select-none">
          {label}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7" /><path d="M7 7h10v10" />
          </svg>
        </div>
        <button
          onClick={() => signIn("google", { callbackUrl: window.location.href })}
          className="absolute inset-0 flex items-center justify-center gap-3 w-full rounded-full bg-white border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span className="text-base sm:text-lg font-semibold text-gray-800">Continue with Google to apply</span>
        </button>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center justify-center gap-3 w-full py-3 sm:py-4 rounded-full transition-all text-black text-base sm:text-lg font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
    >
      {label}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17L17 7" /><path d="M7 7h10v10" />
      </svg>
    </a>
  );
}
