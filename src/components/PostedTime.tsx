"use client";

export default function PostedTime({ date }: { date: string }) {
  const now = new Date();
  const posted = new Date(date);
  const diffMs = now.getTime() - posted.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let label: string;
  if (diffMins < 60) label = diffMins <= 1 ? "just now" : `${diffMins}m ago`;
  else if (diffHours < 24) label = `${diffHours}h ago`;
  else if (diffDays === 1) label = "yesterday";
  else if (diffDays < 30) label = `${diffDays}d ago`;
  else label = posted.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return <span className="text-sm text-gray-400">Posted {label}</span>;
}
