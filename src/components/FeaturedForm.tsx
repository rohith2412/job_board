"use client";

import { useState } from "react";

export default function FeaturedForm({ sessionId }: { sessionId?: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    school: "",
    gradYear: "",
    headline: "",
    skills: "",
    github: "",
    linkedin: "",
    resume: "",
    portfolio: "",
  });
  const [links, setLinks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/featured-student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          ...form,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          links: links.filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setDone(true);
      } else {
        setError(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addLink() {
    setLinks((prev) => [...prev, ""]);
  }

  function updateLink(index: number, value: string) {
    setLinks((prev) => prev.map((l, i) => (i === index ? value : l)));
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
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
        <h2 className="text-lg font-bold text-gray-900">
          You&apos;re live!
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Your profile is now featured on Reblet for 30 days.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Full name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Jane Doe"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@university.edu"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            School *
          </label>
          <input
            type="text"
            required
            value={form.school}
            onChange={(e) => update("school", e.target.value)}
            placeholder="University of Maryland"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Graduation year *
          </label>
          <input
            type="text"
            required
            value={form.gradYear}
            onChange={(e) => update("gradYear", e.target.value)}
            placeholder="2027"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Headline *
        </label>
        <input
          type="text"
          required
          value={form.headline}
          onChange={(e) => update("headline", e.target.value)}
          placeholder="CS junior looking for SWE internships"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Skills (comma separated)
        </label>
        <input
          type="text"
          value={form.skills}
          onChange={(e) => update("skills", e.target.value)}
          placeholder="React, Python, TypeScript, AWS"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            LinkedIn URL
          </label>
          <input
            type="url"
            value={form.linkedin}
            onChange={(e) => update("linkedin", e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            GitHub URL
          </label>
          <input
            type="url"
            value={form.github}
            onChange={(e) => update("github", e.target.value)}
            placeholder="https://github.com/..."
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Resume URL
          </label>
          <input
            type="url"
            value={form.resume}
            onChange={(e) => update("resume", e.target.value)}
            placeholder="https://drive.google.com/..."
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Portfolio / Website
          </label>
          <input
            type="url"
            value={form.portfolio}
            onChange={(e) => update("portfolio", e.target.value)}
            placeholder="https://yoursite.com"
            className={inputClass}
          />
        </div>
      </div>

      {links.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="block text-xs font-medium text-gray-700">
            Additional links
          </label>
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => updateLink(i, e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="px-3 text-gray-400 hover:text-red-500 text-sm flex-shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addLink}
        className="self-start text-sm text-green-600 hover:text-green-700 font-medium"
      >
        + Add another link
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full py-3 rounded-full text-sm font-semibold text-black border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
