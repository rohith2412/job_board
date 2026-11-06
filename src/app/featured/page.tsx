import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getServerSession } from "next-auth";
import { Bricolage_Grotesque } from "next/font/google";
import { authOptions } from "@/lib/auth";
import { findActiveFeatured, successPath } from "@/lib/featured";
import CarouselSection from "./CarouselSection";

// Paid users must get a server redirect before any of the sales page renders.
export const instant = false;

// Display face for the headline, price and stat numbers. Body text keeps your app font.
const display = Bricolage_Grotesque({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Get Featured | Reblet",
  description:
    "Put your profile in front of recruiters and hiring managers. Get featured on Reblet's job board for 30 days.",
};

const stats = [
  { value: "+100", label: "recruiters" },
  { value: "+10k", label: "students" },
];

const features = [
  "Get featured on the front page",
  "Profile visible to all recruiters",
  "LinkedIn, GitHub & resume linked",
  "Add unlimited extra links",
  "One-time payment, no subscription",
];

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path strokeLinecap="round" d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default async function FeaturedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const authSession = await getServerSession(authOptions);
  const email = authSession?.user?.email;
  if (email) {
    const active = await findActiveFeatured(email);
    if (active?.stripeSessionId) redirect(successPath(active.stripeSessionId));
  }

  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-white animate-[fadeIn_0.4s_ease-out]">
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-10 pb-20 text-center sm:pt-14">
        {/* Social proof, flanked by laurels */}
        <div className="flex items-center justify-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/laurel-wreath.jpg"
            alt=""
            aria-hidden="true"
            className="h-16 w-auto shrink-0 mix-blend-multiply sm:h-20"
          />

          <div className="grid grid-cols-[auto_auto] items-baseline gap-x-2 gap-y-0.5">
            {stats.map((stat) => (
              <div key={stat.label} className="contents">
                <span
                  className={`${display.className} text-right text-lg font-bold text-gray-900 sm:text-xl`}
                >
                  {stat.value}
                </span>
                <span className="text-left text-sm text-gray-600">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/laurel-wreath.jpg"
            alt=""
            aria-hidden="true"
            className="h-16 w-auto shrink-0 -scale-x-100 mix-blend-multiply sm:h-20"
          />
        </div>

        {/* Headline */}
        <h1
          className={`${display.className} mt-8 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl`}
        >
          Get featured for $3 only
        </h1>
        <p className="mt-4 max-w-md text-balance text-base text-gray-600 sm:text-lg">
          Your profile goes on Reblet&apos;s job board for 30 days, in front of
          recruiters and hiring managers.
        </p>

        {/* Carousel */}
        <div className="mt-10 h-[200px] w-full sm:h-[480px]">
          <CarouselSection />
        </div>

        {/* Pricing card */}
        <div className="mt-12 w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-7">
          <div className="flex items-center justify-between text-left">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Featured Profile
              </p>
              <p className="mt-0.5 text-sm font-medium text-green-600">
                30 days
              </p>
            </div>
            <p
              className={`${display.className} text-4xl font-bold leading-none tracking-tight text-gray-900`}
            >
              $3
            </p>
          </div>

          <div className="my-5 h-px bg-gray-200" />

          <ul className="flex flex-col gap-3 text-left text-sm text-gray-700">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <CheckIcon />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <a
            href="/api/featured-student/checkout"
            className="mt-7 block w-full py-3.5 rounded-full text-black text-base font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all cursor-pointer text-center"
          >
            Continue to payment
          </a>
          {error === "checkout" && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              Couldn&apos;t start checkout. Please try again.
            </p>
          )}
        </div>

        <p className="mt-5 flex items-center gap-1.5 text-xs text-gray-400">
          <LockIcon />
          Secure payment powered by Stripe
        </p>
      </div>
    </main>
  );
}