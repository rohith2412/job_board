"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Rating {
  score: number;
  grade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  tip: string;
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "#22c55e"
      : score >= 60
      ? "#eab308"
      : score >= 40
      ? "#f97316"
      : "#ef4444";

  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{score}</span>
        <span className="text-sm font-semibold" style={{ color }}>
          {grade}
        </span>
      </div>
    </div>
  );
}

function daysUntil(dateStr: string) {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export default function RankPage() {
  const { data: session, status } = useSession();
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [otherLinks, setOtherLinks] = useState<string[]>([""]);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState<Rating | null>(null);
  const [canRate, setCanRate] = useState(true);
  const [nextRateDate, setNextRateDate] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoadingSaved(false);
      return;
    }
    fetch("/api/rate-profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.rating) {
          setRating(data.rating);
          setCanRate(data.canRateAgain);
          setNextRateDate(data.nextRateDate);
          try {
            localStorage.setItem("rate-promo-rated", "1");
          } catch {}
          if (data.links) {
            setGithub(data.links.github);
            setLinkedin(data.links.linkedin);
            if (data.links.otherLinks?.length) {
              setOtherLinks(data.links.otherLinks);
            }
            setBio(data.links.bio);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSaved(false));
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setRating(null);
    setLoading(true);

    try {
      const res = await fetch("/api/rate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github,
          linkedin,
          otherLinks: otherLinks.filter((l) => l.trim()),
          bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setRating(data.rating);
        setCanRate(false);
        const next = new Date(
          Date.now() + 7 * 86400000
        ).toISOString();
        setNextRateDate(next);
        try {
          localStorage.setItem("rate-promo-rated", "1");
        } catch {}
      }
    } catch {
      setError("Failed to get rating");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loadingSaved) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Rate your profile
          </h1>
          <p className="text-gray-500 mb-6">
            Sign in to get your AI-powered profile rating.
          </p>
          <Link
            href="/login"
            className="inline-flex px-6 py-3 rounded-full text-sm font-semibold border-2 border-black bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to jobs
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
          Rate your profile
        </h1>
        <p className="text-gray-500 mb-10">
          Drop your links below and our AI will rate your online presence as a
          software engineer.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              GitHub
            </label>
            <input
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/username"
              disabled={!canRate}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              LinkedIn
            </label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              disabled={!canRate}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Other links
              <span className="text-gray-400 font-normal"> - portfolio, resume, Devpost, Behance, blog, etc.</span>
            </label>
            <div className="flex flex-col gap-2">
              {otherLinks.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => {
                      const updated = [...otherLinks];
                      updated[i] = e.target.value;
                      setOtherLinks(updated);
                    }}
                    placeholder="https://..."
                    disabled={!canRate}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  {otherLinks.length > 1 && canRate && (
                    <button
                      type="button"
                      onClick={() =>
                        setOtherLinks(otherLinks.filter((_, j) => j !== i))
                      }
                      className="px-3 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              {canRate && otherLinks.length < 5 && (
                <button
                  type="button"
                  onClick={() => setOtherLinks([...otherLinks, ""])}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer self-start mt-1"
                >
                  + Add another link
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              About you{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief intro - what you're working on, what roles you're targeting..."
              rows={3}
              disabled={!canRate}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
              {error}
            </p>
          )}

          {canRate ? (
            <button
              type="submit"
              disabled={loading || (!github && !linkedin && !otherLinks.some((l) => l.trim()))}
              className="w-full py-3.5 rounded-full text-sm font-semibold transition-all cursor-pointer border-2 border-black bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "AI is rating your profile..." : "Rate my profile"}
            </button>
          ) : (
            <div className="w-full py-3.5 rounded-full text-sm font-semibold text-center border-2 border-gray-200 bg-gray-50 text-gray-400">
              Next rating available in {nextRateDate ? daysUntil(nextRateDate) : 7} days
            </div>
          )}
        </form>

        {rating && (
          <div className="mt-12 flex flex-col items-center gap-8">
            <div className="w-full h-px bg-gray-100" />

            <ScoreRing score={rating.score} grade={rating.grade} />

            <p className="text-center text-gray-600 text-sm leading-relaxed max-w-md">
              {rating.summary}
            </p>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-green-800 mb-3">
                  Strengths
                </h3>
                <ul className="flex flex-col gap-2">
                  {rating.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-green-700 flex items-start gap-2"
                    >
                      <span className="mt-0.5 shrink-0">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-amber-800 mb-3">
                  Improvements
                </h3>
                <ul className="flex flex-col gap-2">
                  {rating.improvements.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-amber-700 flex items-start gap-2"
                    >
                      <span className="mt-0.5 shrink-0">-</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="w-full bg-blue-50 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                Pro tip
              </h3>
              <p className="text-sm text-blue-700">{rating.tip}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
