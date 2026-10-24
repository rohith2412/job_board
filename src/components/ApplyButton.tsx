"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ApplyButton({ slug }: { slug: string }) {
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/applied?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => setApplied(data.applied))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mt-2 flex items-center justify-center w-full py-3 sm:py-4 rounded-full text-black text-base sm:text-lg font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] opacity-50">
        Apply on Reblet
      </div>
    );
  }

  if (applied) {
    return (
      <div className="mt-2 flex items-center justify-center gap-2 w-full py-3 sm:py-4 rounded-full text-gray-500 text-base sm:text-lg font-semibold border-2 border-gray-300 bg-gray-100 cursor-default">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Applied
      </div>
    );
  }

  return (
    <Link
      href={`/jobs/${slug}/apply`}
      className="mt-2 flex items-center justify-center gap-3 w-full py-3 sm:py-4 rounded-full transition-all text-black text-base sm:text-lg font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
    >
      Apply on Reblet
    </Link>
  );
}
