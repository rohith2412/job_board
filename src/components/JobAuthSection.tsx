export default function JobAuthSection({
  snippet,
  link,
}: {
  snippet: string;
  link: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-6 p-6 bg-gray-50 rounded-2xl">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
            About this role
          </h2>
          <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
            {snippet}
          </p>
        </div>
      </div>
      <div className="pb-24" />

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 z-50">
        <div className="mx-auto max-w-3xl">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-full transition-all text-black text-lg font-semibold border-2 border-black hover:brightness-95 active:translate-y-1 active:shadow-none"
            style={{
              backgroundColor: "#6fde8a",
              boxShadow: "0 4px 0 0 #000",
            }}
          >
            Apply
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        </div>
      </div>
    </>
  );
}
