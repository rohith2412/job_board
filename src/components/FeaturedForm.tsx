"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FeaturedCard, { type FeaturedCardProfile } from "./FeaturedCard";
import PhotoCropper from "./PhotoCropper";
import {
  HIGHLIGHT_KINDS,
  HIGHLIGHT_MAX_LENGTH,
  MAX_HIGHLIGHTS,
  type Highlight,
  type HighlightKind,
} from "@/lib/highlights";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
// The original never leaves the browser; only the 512px crop is uploaded, so large phone photos are fine.
const PHOTO_SOURCE_MAX_BYTES = 25 * 1024 * 1024;

export type FeaturedFormInitial = {
  name: string;
  image: string;
  school: string;
  gradYear: string;
  headline: string;
  highlights: Highlight[];
  skills: string[];
  linkedin: string;
  github: string;
  resume: string;
  portfolio: string;
  links: string[];
};

// Preview links are clickable, so only finished http(s) URLs make it into the card.
function previewUrl(value: string) {
  const v = value.trim();
  return /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(v) ? v : "";
}

export default function FeaturedForm({
  sessionId,
  email,
  initial,
  mode,
}: {
  sessionId: string;
  email: string;
  initial: FeaturedFormInitial;
  mode: "create" | "edit";
}) {
  const successHref = `/featured/success?session_id=${encodeURIComponent(sessionId)}`;
  const [photoUrl, setPhotoUrl] = useState(initial.image);
  const [photoPreview, setPhotoPreview] = useState(initial.image);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const closeCropper = useCallback(() => setCropFile(null), []);
  const router = useRouter();
  const photoInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: initial.name,
    school: initial.school,
    gradYear: initial.gradYear,
    headline: initial.headline,
    skills: initial.skills.join(", "),
    github: initial.github,
    linkedin: initial.linkedin,
    resume: initial.resume,
    portfolio: initial.portfolio,
  });
  const [links, setLinks] = useState<string[]>(initial.links);
  const [highlights, setHighlights] = useState<Highlight[]>(
    initial.highlights.length ? initial.highlights : [{ kind: "experience", text: "" }]
  );
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const editorTop = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPhotoError("");
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Use a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > PHOTO_SOURCE_MAX_BYTES) {
      setPhotoError("Photo must be 25 MB or smaller");
      return;
    }
    setCropFile(file);
  }

  async function uploadPhoto(photo: Blob) {
    setCropFile(null);
    const localPreview = URL.createObjectURL(photo);
    setPhotoPreview(localPreview);
    setPhotoUploading(true);

    const body = new FormData();
    body.append("sessionId", sessionId);
    body.append("file", photo, "photo.jpg");
    try {
      const res = await fetch("/api/featured-student/photo", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed, please try again");
      setPhotoUrl(data.url);
      setPhotoPreview(data.url);
    } catch (err) {
      setPhotoError((err as Error).message);
      setPhotoPreview(photoUrl);
    } finally {
      URL.revokeObjectURL(localPreview);
      setPhotoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoUrl) {
      setPhotoError("A professional photo is required");
      photoInput.current?.focus();
      return;
    }
    if (!highlights.some((h) => h.text.trim())) {
      setError("Add at least one highlight so recruiters see what makes you stand out");
      return;
    }
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
          highlights: highlights.filter((h) => h.text.trim()),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        // The server page re-renders from the saved record and swaps this form for the profile card.
        if (mode === "edit") router.replace(successHref);
        else router.refresh();
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

  function updateHighlight(index: number, patch: Partial<Highlight>) {
    setHighlights((prev) => prev.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }


  const filledHighlights = highlights
    .map((h) => ({ ...h, text: h.text.trim() }))
    .filter((h) => h.text);
  const preview: FeaturedCardProfile = {
    name: form.name.trim() || "Your Name",
    image: photoPreview,
    headline: form.headline.trim() || "Your headline shows here",
    school: form.school.trim() || "Your school",
    gradYear: /^\d{4}$/.test(form.gradYear) ? form.gradYear : "",
    highlights: filledHighlights.length
      ? filledHighlights
      : [{ kind: "experience", text: "Your top achievement shows here" }],
    linkedin: previewUrl(form.linkedin),
    github: previewUrl(form.github),
    resume: previewUrl(form.resume),
    portfolio: previewUrl(form.portfolio),
    links: links.map(previewUrl).filter(Boolean),
  };

  function showMobileView(view: "edit" | "preview") {
    setMobileView(view);
    editorTop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

  return (
    <div ref={editorTop} className="scroll-mt-24">
    <div
      role="tablist"
      aria-label="Editor view"
      className="mb-6 grid grid-cols-2 rounded-full border-2 border-black bg-white p-1 lg:hidden"
    >
      {(["edit", "preview"] as const).map((view) => (
        <button
          key={view}
          type="button"
          role="tab"
          aria-selected={mobileView === view}
          onClick={() => showMobileView(view)}
          className={`rounded-full py-2 text-sm font-semibold transition-colors ${
            mobileView === view ? "bg-green-300 text-black" : "text-gray-500"
          }`}
        >
          {view === "edit" ? "Edit" : "Preview"}
        </button>
      ))}
    </div>
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
    <form
      onSubmit={handleSubmit}
      className={`${mobileView === "preview" ? "hidden" : "flex"} min-w-0 flex-col gap-4 lg:flex`}
    >
      <div>
        <span className="block text-xs font-medium text-gray-700 mb-2">
          Professional photo *
        </span>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gray-300 bg-gray-100">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Your profile photo" className="h-full w-full object-cover" />
            ) : (
              <svg className="h-full w-full text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
              </svg>
            )}
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-[11px] font-medium text-gray-700">
                Uploading…
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label
              className={`self-start rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-green-500 ${photoUploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
            >
              {photoUrl ? "Change photo" : "Upload photo"}
              <input
                ref={photoInput}
                type="file"
                accept={PHOTO_TYPES.join(",")}
                onChange={handlePhoto}
                disabled={photoUploading}
                className="sr-only"
              />
            </label>
            <span className="text-xs text-gray-400">
              Clear headshot. JPG, PNG, or WebP. You&apos;ll position it next.
            </span>
          </div>
        </div>
        {cropFile && (
          <PhotoCropper
            file={cropFile}
            onCancel={closeCropper}
            onConfirm={uploadPhoto}
          />
        )}
        {photoError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {photoError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Full name *
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Jane Doe"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            readOnly
            value={email}
            title="Your profile is tied to the account you signed in with"
            className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
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
            maxLength={150}
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
            inputMode="numeric"
            pattern="(19|20)[0-9]{2}"
            maxLength={4}
            title="4-digit year, e.g. 2027"
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
          maxLength={160}
          value={form.headline}
          onChange={(e) => update("headline", e.target.value)}
          placeholder="CS junior looking for SWE internships"
          className={inputClass}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="block text-xs font-medium text-gray-700">Highlights *</legend>
        <p className="-mt-1 mb-1 text-xs text-gray-400">
          Your top achievements, shown front and center to recruiters. Be specific: names, numbers, results.
        </p>
        {highlights.map((h, i) => {
          const example = HIGHLIGHT_KINDS.find((k) => k.value === h.kind)?.example;
          return (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <select
                value={h.kind}
                onChange={(e) => updateHighlight(i, { kind: e.target.value as HighlightKind })}
                aria-label={`Highlight ${i + 1} type`}
                className={`${inputClass} sm:w-36 sm:shrink-0`}
              >
                {HIGHLIGHT_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
              <div className="flex flex-1 gap-2">
                <input
                  type="text"
                  required={i === 0}
                  maxLength={HIGHLIGHT_MAX_LENGTH}
                  value={h.text}
                  onChange={(e) => updateHighlight(i, { text: e.target.value })}
                  placeholder={example ? `e.g. ${example}` : ""}
                  aria-label={`Highlight ${i + 1}`}
                  className={inputClass}
                />
                {highlights.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setHighlights((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Remove highlight ${i + 1}`}
                    className="px-2 text-sm text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {highlights.length < MAX_HIGHLIGHTS && (
          <button
            type="button"
            onClick={() => setHighlights((prev) => [...prev, { kind: "award", text: "" }])}
            className="self-start text-sm font-medium text-green-600 hover:text-green-700"
          >
            + Add another highlight
          </button>
        )}
      </fieldset>

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

      {links.length < 10 && (
        <button
          type="button"
          onClick={addLink}
          className="self-start text-sm text-green-600 hover:text-green-700 font-medium"
        >
          + Add another link
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row">
        {mode === "edit" && (
          <a
            href={successHref}
            className="flex-1 rounded-full border border-gray-300 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </a>
        )}
        <button
          type="submit"
          disabled={loading || photoUploading}
          className="flex-1 py-3 rounded-full text-sm font-semibold text-black border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : mode === "edit" ? "Save changes" : "Save profile"}
        </button>
      </div>
    </form>

    <aside
      className={`${mobileView === "edit" ? "hidden" : "block"} lg:sticky lg:top-24 lg:block`}
      aria-label="Live preview"
    >
      <p className="mb-3 hidden text-center text-xs font-semibold uppercase tracking-wide text-gray-400 lg:block">
        Live preview
      </p>
      <FeaturedCard profile={preview} />
      <button
        type="button"
        onClick={() => showMobileView("edit")}
        className="mx-auto mt-6 block rounded-full border-2 border-black bg-white px-5 py-2 text-sm font-semibold text-black shadow-[0_3px_0_0_#000] lg:hidden"
      >
        Back to editing
      </button>
    </aside>
    </div>
    </div>
  );
}
