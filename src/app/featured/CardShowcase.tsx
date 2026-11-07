"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import FeaturedCard, { type FeaturedCardProfile } from "@/components/FeaturedCard";
import { FEATURED_EXAMPLES } from "@/lib/featured-examples";

const AUTOPLAY_MS = 3500;
const SWIPE_PX = 40;

const examples: (FeaturedCardProfile & { key: string })[] = FEATURED_EXAMPLES.map((e) => ({
  key: e.slug,
  name: e.name,
  image: `/featured-examples/${e.photo}`,
  headline: e.headline,
  school: e.school,
  gradYear: e.gradYear,
  country: e.country,
  highlights: e.highlights,
  // Example cards render icons, not links, so these values only decide which icons show.
  linkedin: e.links.includes("linkedin") ? "linkedin" : "",
  github: e.links.includes("github") ? "github" : "",
  resume: e.links.includes("resume") ? "resume" : "",
  portfolio: e.links.includes("portfolio") ? "portfolio" : "",
}));

const SLOT_STYLE = {
  center: { x: "0%", y: "0px", rotate: 0, scale: 1, opacity: 1, z: 30 },
  left: { x: "-62%", y: "22px", rotate: -7, scale: 0.86, opacity: 1, z: 20 },
  right: { x: "62%", y: "22px", rotate: 7, scale: 0.86, opacity: 1, z: 20 },
  hidden: { x: "0%", y: "30px", rotate: 0, scale: 0.8, opacity: 0, z: 10 },
} as const;

type Slot = keyof typeof SLOT_STYLE;

function slotFor(index: number, active: number, total: number): Slot {
  const offset = (index - active + total) % total;
  if (offset === 0) return "center";
  if (offset === 1) return "right";
  if (offset === total - 1) return "left";
  return "hidden";
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export default function CardShowcase() {
  const total = examples.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const swipeStart = useRef<number | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true
  );

  const go = (delta: number) => setActive((a) => (a + delta + total) % total);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % total), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, total]);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Example featured profile cards"
      className="relative -mx-6 overflow-hidden px-6 sm:mx-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="relative mx-auto h-[400px] touch-pan-y sm:h-[480px]"
        onPointerDown={(e) => {
          swipeStart.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipeStart.current === null) return;
          const dx = e.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >
        {examples.map((profile, i) => {
          const slot = slotFor(i, active, total);
          const s = SLOT_STYLE[slot];
          const isSide = slot === "left" || slot === "right";
          return (
            <div
              key={profile.key}
              aria-hidden={slot !== "center"}
              className="absolute left-1/2 top-2 w-[250px] transition-[transform,opacity] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:w-[300px]"
              style={{
                transform: `translateX(calc(-50% + ${s.x})) translateY(${s.y}) rotate(${s.rotate}deg) scale(${s.scale})`,
                opacity: s.opacity,
                zIndex: s.z,
                pointerEvents: slot === "hidden" ? "none" : "auto",
              }}
            >
              <FeaturedCard profile={profile} example />
              {isSide && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setActive(i)}
                  className="absolute inset-0 cursor-pointer rounded-3xl"
                  aria-label={`Show ${profile.name}'s example card`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous example"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-[0_2px_0_0_#000] transition-all hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#000]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex gap-1.5">
          {examples.map((profile, i) => (
            <button
              key={profile.key}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show example ${i + 1} of ${total}`}
              aria-current={i === active}
              className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-black" : "w-2 bg-gray-300 hover:bg-gray-400"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next example"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-[0_2px_0_0_#000] transition-all hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#000]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" aria-hidden="true">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="sr-only" aria-live={paused || reducedMotion ? "polite" : "off"}>
        Showing example card for {examples[active].name}
      </p>
    </div>
  );
}
