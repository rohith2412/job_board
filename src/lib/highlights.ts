export const HIGHLIGHT_KINDS = [
  { value: "experience", label: "Experience", example: "SWE Intern at Capital One, Summer 2026" },
  { value: "award", label: "Award", example: "1st place at HackMIT 2025, out of 200 teams" },
  { value: "project", label: "Project", example: "Built a study app used by 5,000+ students" },
  { value: "leadership", label: "Leadership", example: "President, UMD Women in Computing" },
  { value: "research", label: "Research", example: "Co-author, paper accepted at ACM CHI 2026" },
  { value: "academic", label: "Academic", example: "Dean's List every semester, 3.9 GPA" },
] as const;

export type HighlightKind = (typeof HIGHLIGHT_KINDS)[number]["value"];

export type Highlight = { kind: HighlightKind; text: string };

export const MAX_HIGHLIGHTS = 3;
export const HIGHLIGHT_MAX_LENGTH = 80;

export function isHighlightKind(value: unknown): value is HighlightKind {
  return HIGHLIGHT_KINDS.some((k) => k.value === value);
}
