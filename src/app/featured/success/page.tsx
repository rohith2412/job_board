import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claimPurchase, successPath } from "@/lib/featured";
import FeaturedCard from "@/components/FeaturedCard";
import FeaturedForm, { type FeaturedFormInitial } from "@/components/FeaturedForm";
import type { Highlight } from "@/lib/highlights";

export const metadata: Metadata = {
  title: "You're Featured! | Reblet",
};

// Access is decided per request, so redirects must happen before anything renders.
export const instant = false;

export default async function FeaturedSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; edit?: string }>;
}) {
  await connection();
  const { session_id, edit } = await searchParams;
  if (!session_id) redirect("/featured");

  const authSession = await getServerSession(authOptions);
  const email = authSession?.user?.email;
  if (!email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(successPath(session_id))}`);
  }

  const record = await claimPurchase(session_id, { email, name: authSession?.user?.name });
  if (!record) redirect("/featured");

  const expiresOn = record.expiresAt?.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const expired = !record.expiresAt || record.expiresAt <= new Date();

  // Plain data only: Mongoose arrays and subdocuments can't cross into client components.
  const profile: FeaturedFormInitial = {
    name: record.name,
    image: record.image || "",
    school: record.school || "",
    gradYear: record.gradYear || "",
    country: record.country || "",
    headline: record.headline || "",
    highlights: (record.highlights ?? []).map((h: Highlight) => ({ kind: h.kind, text: h.text })),
    skills: [...(record.skills ?? [])],
    linkedin: record.linkedin || "",
    github: record.github || "",
    resume: record.resume || "",
    portfolio: record.portfolio || "",
    links: [...(record.links ?? [])],
  };

  if (expired) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-xl px-6 py-16">
          <h1 className="text-2xl font-bold text-gray-900">Your featured profile has expired</h1>
          <p className="text-gray-500 mt-2">
            Your 30-day featured period ended{expiresOn ? ` on ${expiresOn}` : ""}.
          </p>
          <Link
            href="/featured"
            className="mt-6 inline-block text-sm font-semibold text-green-700 hover:text-green-800"
          >
            Get featured again →
          </Link>
        </div>
      </main>
    );
  }

  if (profile.headline && edit !== "1") {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">You&apos;re featured!</h1>
          <p className="mt-1 text-sm text-gray-500">
            This is how recruiters see your profile until {expiresOn}.
          </p>
          <div className="mt-6 w-full">
            <FeaturedCard profile={profile} />
          </div>
          <div className="mt-6 flex items-center gap-5">
            <Link
              href={`${successPath(session_id)}&edit=1`}
              className="rounded-full border-2 border-black bg-white px-5 py-2 text-sm font-semibold text-black shadow-[0_3px_0_0_#000] transition-all hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#000]"
            >
              Edit profile
            </Link>
            <Link href="/jobs" className="text-sm font-semibold text-green-700 hover:text-green-800">
              Back to jobs →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const editing = Boolean(profile.headline);
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">
          {editing ? "Edit your profile" : "Build your featured profile"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {editing
            ? `Changes go live as soon as you save. You're featured until ${expiresOn}.`
            : `This is what recruiters will see on Reblet until ${expiresOn}. The preview updates as you type.`}
        </p>
        <div className="mt-8">
          <FeaturedForm
            sessionId={session_id}
            email={email}
            initial={profile}
            mode={editing ? "edit" : "create"}
          />
        </div>
      </div>
    </main>
  );
}
