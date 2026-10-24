"use client";

import { useState, useRef, useEffect } from "react";

export default function JobDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [needsClamp, setNeedsClamp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      setNeedsClamp(ref.current.scrollHeight > ref.current.clientHeight + 4);
    }
  }, [text]);

  return (
    <div>
      <div
        ref={ref}
        className={`text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words overflow-hidden ${
          expanded ? "" : "max-h-40"
        }`}
      >
        {text}
      </div>
      {needsClamp && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
