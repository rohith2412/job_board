"use client";

import { useEffect, useRef, useState } from "react";

const OUTPUT_SIZE = 512;
const MIN_SOURCE_SIZE = 200;
const MAX_ZOOM = 4;

type View = { zoom: number; x: number; y: number };
type Size = { w: number; h: number };

export default function PhotoCropper({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (photo: Blob) => void;
}) {
  const [natural, setNatural] = useState<Size | null>(null);
  const [frame, setFrame] = useState(0);
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const url = URL.createObjectURL(file);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setFrame(entry.contentRect.width));
    observer.observe(el);
    el.focus();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  // Scale at zoom 1 makes the image just cover the frame.
  const baseScale = natural && frame ? Math.max(frame / natural.w, frame / natural.h) : 1;

  // Keeps the frame fully covered by the image so the crop never contains empty space.
  function clamp(v: View): View {
    if (!natural || !frame) return v;
    const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom));
    const scale = baseScale * zoom;
    const maxX = (natural.w * scale - frame) / 2;
    const maxY = (natural.h * scale - frame) / 2;
    return {
      zoom,
      x: Math.min(maxX, Math.max(-maxX, v.x)),
      y: Math.min(maxY, Math.max(-maxY, v.y)),
    };
  }

  function zoomTo(next: number) {
    setView((v) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(1, next));
      const ratio = zoom / v.zoom;
      return clamp({ zoom, x: v.x * ratio, y: v.y * ratio });
    });
  }

  // React registers wheel listeners as passive, which would let the page scroll while zooming.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setView((v) => {
        const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom * Math.exp(-e.deltaY * 0.002)));
        const ratio = zoom / v.zoom;
        return clamp({ zoom, x: v.x * ratio, y: v.y * ratio });
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  function handleLoad() {
    const img = imgRef.current;
    if (!img) return;
    if (img.naturalWidth < MIN_SOURCE_SIZE || img.naturalHeight < MIN_SOURCE_SIZE) {
      setError(`Photo is too small. Use one at least ${MIN_SOURCE_SIZE}×${MIN_SOURCE_SIZE} pixels.`);
      return;
    }
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }

  // Clamped at render time so a frame resize or image load can never leave the crop out of bounds.
  const shown = clamp(view);
  const scale = baseScale * shown.zoom;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!natural) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: shown.x, oy: shown.y };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setView((v) => clamp({ ...v, x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.id === e.pointerId) drag.current = null;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomTo(shown.zoom + 0.1);
    } else if (e.key === "-") {
      e.preventDefault();
      zoomTo(shown.zoom - 0.1);
    }
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || !natural || !frame) return;
    setSaving(true);

    const cropSize = frame / scale;
    const sx = (natural.w * scale) / 2 - frame / 2 - shown.x;
    const sy = (natural.h * scale) / 2 - frame / 2 - shown.y;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Your browser couldn't process this photo.");
      setSaving(false);
      return;
    }
    // JPEG has no alpha; without a fill, transparent PNG areas would turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx / scale, sy / scale, cropSize, cropSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onConfirm(blob);
        } else {
          setError("Your browser couldn't process this photo.");
          setSaving(false);
        }
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      onPointerDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-cropper-title"
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl sm:p-5"
      >
        <h2 id="photo-cropper-title" className="text-base font-semibold text-gray-900">
          Position your photo
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Drag to move. Use the slider or scroll to zoom. Keep your face centered in the circle.
        </p>

        <div
          ref={frameRef}
          tabIndex={0}
          aria-label="Photo position. Use arrow keys to move and plus or minus to zoom."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
          className="relative mx-auto mt-4 aspect-square w-full max-w-[288px] touch-none select-none overflow-hidden rounded-xl bg-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 cursor-grab active:cursor-grabbing"
        >
          {!error && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              alt=""
              draggable={false}
              onLoad={handleLoad}
              onError={() => setError("Couldn't read this image. Try a different photo.")}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={
                natural
                  ? {
                      width: natural.w * scale,
                      height: natural.h * scale,
                      transform: `translate(calc(-50% + ${shown.x}px), calc(-50% + ${shown.y}px))`,
                    }
                  : { opacity: 0 }
              }
            />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ring-2 ring-white/80" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => zoomTo(shown.zoom - 0.25)}
            aria-label="Zoom out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-gray-600 hover:bg-gray-100"
          >
            −
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={shown.zoom}
            onChange={(e) => zoomTo(Number(e.target.value))}
            aria-label="Zoom"
            disabled={!natural}
            className="w-full accent-green-600"
          />
          <button
            type="button"
            onClick={() => zoomTo(shown.zoom + 0.25)}
            aria-label="Zoom in"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-gray-600 hover:bg-gray-100"
          >
            +
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!natural || saving || !!error}
            className="flex-1 rounded-full border-2 border-black bg-green-300 py-2.5 text-sm font-semibold text-black shadow-[0_4px_0_0_#000] transition-all hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#000] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
