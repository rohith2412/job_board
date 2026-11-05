import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import FeaturedForm from "@/components/FeaturedForm";

export const metadata: Metadata = {
  title: "You're Featured! | Reblet",
};

async function SuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  await connection();
  const { session_id } = await searchParams;

  return (
    <>
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
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
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Payment received</h1>
      <p className="text-gray-500 mt-2">
        Now fill out your profile. This is what recruiters will see on Reblet
        for the next 30 days.
      </p>
      <div className="mt-8">
        <FeaturedForm sessionId={session_id} />
      </div>
    </>
  );
}

export default function FeaturedSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-6 py-16">
        <Suspense fallback={<p className="text-gray-400">Loading...</p>}>
          <SuccessContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
