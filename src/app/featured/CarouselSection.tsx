"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const FlexCarousel = dynamic(() => import("@/components/FlexCarousel"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-[160px] w-[120px] sm:h-[380px] sm:w-[280px] animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    </div>
  ),
});

export default function CarouselSection() {
  const [ready, setReady] = useState(false);

  return (
    <div
      className={`h-full w-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
      ref={(el) => {
        if (el && !ready) {
          requestAnimationFrame(() => setReady(true));
        }
      }}
    >
      <FlexCarousel
        preset="liquid"
        cardHeight={0.6}
        gap={16}
        radius={12}
        fit="portrait"
        captions={false}
        autoplay
        interval={3}
      />
    </div>
  );
}
