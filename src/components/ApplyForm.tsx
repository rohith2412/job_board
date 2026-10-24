"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useRef } from "react";
import Link from "next/link";

export default function ApplyForm({ id }: { id: string }) {
  const { data: session, status } = useSession();
  const [note, setNote] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("jobSlug", id);
      form.append("note", note);
      if (resumeFile) form.append("resume", resumeFile);

      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-xl flex flex-col min-h-screen px-6">
          <nav className="py-5">
            <Link
              href={`/jobs/${id}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              &larr; Back to job
            </Link>
          </nav>
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Sign in to apply
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Sign in with Google to submit your application.
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

  if (done) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-xl flex flex-col min-h-screen px-6">
          <nav className="py-5">
            <Link
              href={`/jobs/${id}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              &larr; Back to job
            </Link>
          </nav>
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-20 gap-5">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                width="32"
                height="32"
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
            <h1 className="text-2xl font-bold text-gray-900">
              Application submitted!
            </h1>
            <p className="text-sm text-gray-500">
              The hiring team will review your application.
            </p>
            <Link
              href="/jobs"
              className="mt-4 px-6 py-3 rounded-full text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-400 transition-colors"
            >
              Browse more jobs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl flex flex-col min-h-screen px-6">
        <nav className="py-5">
          <Link
            href={`/jobs/${id}`}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            &larr; Back to job
          </Link>
        </nav>

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col gap-6 py-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Apply for this role
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Applying as{" "}
              <span className="font-medium text-gray-700">
                {session.user?.name}
              </span>{" "}
              ({session.user?.email})
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Resume{" "}
              <span className="text-gray-400 font-normal">(PDF or DOCX)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
              >
                {resumeFile ? resumeFile.name : "Choose file"}
              </button>
              {resumeFile && (
                <button
                  type="button"
                  onClick={() => {
                    setResumeFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-sm text-red-400 hover:text-red-600 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Note to hiring team{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why are you interested in this role?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full py-3.5 rounded-full text-black text-base font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </main>
  );
}
