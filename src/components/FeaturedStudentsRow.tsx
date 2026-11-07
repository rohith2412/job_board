"use client";

import { useRef, useState } from "react";
import FeaturedCard, { type FeaturedCardProfile } from "@/components/FeaturedCard";
import { HIGHLIGHT_DESIGN, STAR_PATH } from "@/lib/card-design";

type Student = FeaturedCardProfile & { id: string };

function CompactCard({ student, onOpen }: { student: Student; onOpen: () => void }) {
  const top = student.highlights[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="flex h-full w-full gap-3 rounded-2xl border-2 border-black bg-white p-3 text-left shadow-[0_4px_0_0_#000] transition-all hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={student.image}
        alt=""
        className="h-[72px] w-[72px] shrink-0 rounded-xl border-2 border-black object-cover object-[center_30%]"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-bold leading-tight text-gray-900">{student.name}</span>
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-green-600" aria-label="Featured">
            <path d={STAR_PATH} />
          </svg>
        </span>
        <span className="mt-0.5 truncate text-xs text-gray-500">
          {student.school}
          {student.gradYear ? ` · Class of ${student.gradYear}` : ""}
        </span>
        <span className="mt-1 line-clamp-1 text-[13px] text-gray-600">{student.headline}</span>
        {top && (
          <span className="mt-1.5 flex min-w-0 items-center gap-1.5">
            <span
              className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border border-black ${HIGHLIGHT_DESIGN[top.kind].bgClass}`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5 text-black" aria-hidden="true">
                <path d={HIGHLIGHT_DESIGN[top.kind].path} />
              </svg>
            </span>
            <span className="truncate text-xs font-semibold text-gray-900">{top.text}</span>
          </span>
        )}
      </span>
    </button>
  );
}

export default function FeaturedStudentsRow({ students }: { students: Student[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Student | null>(null);

  function open(student: Student) {
    setSelected(student);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <ul className="-mx-6 mt-4 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-3 pt-1 [scrollbar-width:thin]">
        {students.map((student) => (
          <li key={student.id} className="w-[300px] shrink-0 snap-start pb-1 sm:w-[340px]">
            <CompactCard student={student} onOpen={() => open(student)} />
          </li>
        ))}
      </ul>

      {/* Native <dialog> gives focus trapping, Escape to close and inert background for free. */}
      <dialog
        ref={dialogRef}
        aria-label={selected ? `${selected.name}'s featured profile` : "Featured profile"}
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto w-[min(360px,calc(100vw-2rem))] overflow-visible bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {selected && (
          <div className="relative">
            <FeaturedCard profile={selected} />
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute -right-2 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-[0_2px_0_0_#000] hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
