import type { Highlight } from "@/lib/highlights";
import type { LinkIcon } from "@/lib/card-design";

// Fictional students for the /featured sales page. Photos are free Unsplash License portraits
// stored in public/featured-examples; every card shown from this data is labelled as an example.
export type FeaturedExample = {
  slug: string;
  name: string;
  photo: string;
  photoSource: string;
  school: string;
  gradYear: string;
  country: string;
  headline: string;
  highlights: Highlight[];
  links: LinkIcon[];
};

export const FEATURED_EXAMPLES: FeaturedExample[] = [
  {
    slug: "marcus-bell",
    name: "Marcus Bell",
    photo: "student-1.jpg",
    photoSource: "https://unsplash.com/photos/Ft4p5E9HjTQ",
    school: "Georgia Tech",
    gradYear: "2026",
    country: "US",
    headline: "CS senior focused on distributed systems, open to new grad SWE roles",
    highlights: [
      { kind: "experience", text: "Backend intern, cut API latency by 40%" },
      { kind: "award", text: "Winner, campus hackathon out of 150 teams" },
    ],
    links: ["linkedin", "github", "portfolio"],
  },
  {
    slug: "sofia-moretti",
    name: "Sofia Moretti",
    photo: "student-2.jpg",
    photoSource: "https://unsplash.com/photos/mpDV4xaFP8c",
    school: "UIUC",
    gradYear: "2027",
    country: "US",
    headline: "Junior building ML tools, seeking Summer 2027 SWE internships",
    highlights: [
      { kind: "research", text: "NLP lab researcher, co-authored a 2026 paper" },
      { kind: "leadership", text: "President, Women in CS (400 members)" },
    ],
    links: ["linkedin", "github", "resume"],
  },
  {
    slug: "arjun-mehta",
    name: "Arjun Mehta",
    photo: "student-3.jpg",
    photoSource: "https://unsplash.com/photos/p5BoBF0XJUA",
    school: "UT Austin",
    gradYear: "2026",
    country: "US",
    headline: "Full-stack engineer shipping products students love",
    highlights: [
      { kind: "project", text: "Built a course planner used by 12,000 students" },
      { kind: "experience", text: "SWE intern at a Series B fintech startup" },
    ],
    links: ["linkedin", "github", "portfolio"],
  },
  {
    slug: "emily-tran",
    name: "Emily Tran",
    photo: "student-4.jpg",
    photoSource: "https://unsplash.com/photos/0Zx1bDv5BNY",
    school: "University of Washington",
    gradYear: "2027",
    country: "US",
    headline: "iOS developer and design-minded engineer",
    highlights: [
      { kind: "project", text: "Shipped an iOS app with 50,000+ downloads" },
      { kind: "award", text: "1st place, university app design competition" },
    ],
    links: ["linkedin", "github", "portfolio"],
  },
  {
    slug: "daniel-novak",
    name: "Daniel Novak",
    photo: "student-5.jpg",
    photoSource: "https://unsplash.com/photos/WMD64tMfc4k",
    school: "Purdue University",
    gradYear: "2026",
    country: "US",
    headline: "Infrastructure-minded CS senior, AWS certified",
    highlights: [
      { kind: "experience", text: "SRE intern, automated deploys for 200+ services" },
      { kind: "academic", text: "Dean's List every semester, 3.9 GPA" },
    ],
    links: ["linkedin", "github", "resume"],
  },
  {
    slug: "amara-okafor",
    name: "Amara Okafor",
    photo: "student-6.jpg",
    photoSource: "https://unsplash.com/photos/1l6UeCc9P9o",
    school: "University of Maryland",
    gradYear: "2027",
    country: "US",
    headline: "Engineer working where machine learning meets healthcare",
    highlights: [
      { kind: "research", text: "Built a model that flags sepsis risk 6h earlier" },
      { kind: "leadership", text: "Founded the campus AI club, now 250 members" },
    ],
    links: ["linkedin", "github", "portfolio"],
  },
];
