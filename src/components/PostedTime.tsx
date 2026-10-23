"use client";

import { useState, useEffect } from "react";

export default function PostedTime({ date }: { date: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) setLabel(diffMins <= 1 ? "just now" : `${diffMins}m ago`);
    else if (diffHours < 24) setLabel(`${diffHours}h ago`);
    else if (diffDays === 1) setLabel("yesterday");
    else if (diffDays < 30) setLabel(`${diffDays}d ago`);
    else setLabel(posted.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }, [date]);

  if (!label) return null;

  return <span className="text-sm text-gray-400">Posted {label}</span>;
}
