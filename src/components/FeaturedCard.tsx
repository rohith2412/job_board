import { Bricolage_Grotesque } from "next/font/google";
import { HIGHLIGHT_KINDS, type Highlight } from "@/lib/highlights";
import {
  GRAD_CAP_PATH,
  HIGHLIGHT_DESIGN,
  LINK_ICON_PATHS,
  STAR_PATH,
  type LinkIcon,
} from "@/lib/card-design";

const display = Bricolage_Grotesque({ subsets: ["latin"], display: "swap" });

export type FeaturedCardProfile = {
  name: string;
  image: string;
  headline: string;
  school: string;
  gradYear: string;
  highlights: Highlight[];
  linkedin?: string;
  github?: string;
  resume?: string;
  portfolio?: string;
  links?: string[];
};

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Icon({ name }: { name: LinkIcon }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d={LINK_ICON_PATHS[name]} />
    </svg>
  );
}

export default function FeaturedCard({
  profile,
  example = false,
}: {
  profile: FeaturedCardProfile;
  // Sample cards on the sales page: labelled, and their link icons aren't real links.
  example?: boolean;
}) {
  const actions = [
    profile.linkedin && { href: profile.linkedin, label: "LinkedIn", icon: "linkedin" as const },
    profile.github && { href: profile.github, label: "GitHub", icon: "github" as const },
    profile.resume && { href: profile.resume, label: "Resume", icon: "resume" as const },
    profile.portfolio && { href: profile.portfolio, label: "Portfolio", icon: "portfolio" as const },
    ...(profile.links ?? []).map((href) => ({ href, label: hostname(href), icon: "link" as const })),
  ].filter((a): a is { href: string; label: string; icon: LinkIcon } => Boolean(a));

  const classOf = profile.gradYear ? `Class of ${profile.gradYear}` : "";

  return (
    <article className="relative mx-auto flex aspect-[5/7] w-full max-w-[340px] flex-col rounded-3xl text-left border-2 border-black bg-white shadow-[6px_6px_0_0_#000]">
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden rounded-t-[22px] bg-gradient-to-br from-green-300 via-emerald-200 to-lime-100">
        {profile.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.image}
            alt={profile.name}
            className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border-2 border-black bg-green-300 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-black shadow-[0_2px_0_0_#000]">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden="true">
            <path d={STAR_PATH} />
          </svg>
          Featured
        </span>
        {example && (
          <span className="absolute right-3 top-3.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Example
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 px-4 pb-3 text-white">
          <h2 className={`${display.className} line-clamp-2 text-[26px] font-bold leading-[1.05] tracking-tight [text-wrap:balance]`}>
            {profile.name}
          </h2>
          <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-white/85">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
              <path d={GRAD_CAP_PATH} />
            </svg>
            <span className="truncate">{profile.school}</span>
            {classOf && (
              <>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">{classOf}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <p className="line-clamp-2 shrink-0 text-[13px] leading-snug text-gray-600">{profile.headline}</p>

        {profile.highlights.length > 0 && (
          <ul className="mt-3 flex shrink-0 flex-col gap-2" aria-label="Highlights">
            {profile.highlights.map((h, i) => {
              const style = HIGHLIGHT_DESIGN[h.kind];
              const label = HIGHLIGHT_KINDS.find((k) => k.value === h.kind)?.label;
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    title={label}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-black text-black ${style.bgClass}`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d={style.path} />
                    </svg>
                  </span>
                  <p className="line-clamp-2 pt-[3px] text-[13px] font-semibold leading-snug text-gray-900">
                    <span className="sr-only">{label}: </span>
                    {h.text}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {actions.length > 0 && (
          <div className="mt-auto flex gap-1.5 pt-3">
              {actions.slice(0, 5).map((a) =>
                example ? (
                  <span
                    key={a.href}
                    title={a.label}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-[0_2px_0_0_#000]"
                  >
                    <Icon name={a.icon} />
                  </span>
                ) : (
                <a
                  key={a.href}
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={a.label}
                  title={a.label}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-[0_2px_0_0_#000] transition-all hover:translate-y-[1px] hover:bg-green-300 hover:shadow-[0_1px_0_0_#000]"
                >
                  <Icon name={a.icon} />
                </a>
                )
              )}
          </div>
        )}
      </div>
    </article>
  );
}
