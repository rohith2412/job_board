"use client";

import { useState } from "react";

const REGIONS = [
  { code: "US", name: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "CA", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "CH", name: "Switzerland", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "GB", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "FR", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "AU", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "IN", name: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "OTHER", name: "Other", flag: "\u{1F30D}" },
];

export default function RegionSelector({
  onSelect,
}: {
  onSelect: (region: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/user/region", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region: selected }),
    });
    if (res.ok) {
      onSelect(selected);
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
      <div className="w-full max-w-md mx-auto px-6 py-10 flex flex-col items-center min-h-full justify-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#374151"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Select your region
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Choose where you're located to see relevant jobs
        </p>

        <div className="w-full flex flex-col gap-2 mb-6">
          {REGIONS.map((r) => (
            <button
              key={r.code}
              onClick={() => setSelected(r.code)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                selected === r.code
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-lg">{r.flag}</span>
              {r.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!selected || saving}
          className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all cursor-pointer border-2 border-black ${
            selected
              ? "bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
          }`}
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
