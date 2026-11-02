export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  content: string;
}

export const posts: BlogPost[] = [
  {
    slug: "best-swe-internships-summer-2027",
    title: "Best Software Engineering Internships for Summer 2027",
    description:
      "A curated guide to the top SWE internships for Summer 2027 — where to apply, what they pay, and how to stand out.",
    date: "2026-11-01",
    readTime: "5 min read",
    content: `Landing a software engineering internship at a top company can launch your career. Here's what you need to know about the best SWE internships for Summer 2027.

## Top-Paying SWE Internships

The highest-paying software engineering internships consistently come from big tech and finance:

- **Google** — $55/hr+ in Mountain View, with housing stipend
- **Meta** — $52/hr+ in Menlo Park, with relocation assistance
- **Jane Street** — $60/hr+ in NYC, one of the highest-paying internships
- **Stripe** — $55/hr+ in San Francisco, with great mentorship
- **Amazon** — $50/hr+ across multiple locations

## When to Apply

Most big tech companies open their Summer 2027 internship applications in **August–October 2026**. Some key timelines:

- **Early bird** (Aug–Sep): Jane Street, Two Sigma, Citadel
- **Peak season** (Sep–Nov): Google, Meta, Amazon, Microsoft
- **Rolling** (Oct–Feb): Startups, mid-size companies

## How to Stand Out

1. **Build projects** — Ship something real. A deployed web app beats a tutorial project.
2. **Practice DSA** — LeetCode medium-level problems are the standard.
3. **Apply broadly** — Don't just aim for FAANG. Companies like Stripe, Databricks, and Ramp have excellent intern programs.
4. **Get referrals** — A referral can move your application to the top of the pile.

## Where to Find Internships

Reblet curates the best SWE internship postings daily. Browse our [internship listings](/jobs/internships) to find roles that match your skills and location.`,
  },
  {
    slug: "new-grad-software-engineer-salary-guide-2027",
    title: "New Grad Software Engineer Salary Guide 2027",
    description:
      "What new grad software engineers earn in 2027 — base salary, stock, bonus, and total compensation at top companies.",
    date: "2026-10-28",
    readTime: "6 min read",
    content: `If you're graduating in 2027 and entering the software engineering job market, here's what you can expect to earn.

## Average New Grad SWE Compensation

Total compensation (TC) for new grad software engineers at top companies in 2027:

| Company | Base Salary | Stock/yr | Bonus | Total Comp |
|---------|-----------|---------|-------|-----------|
| Google (L3) | $125K | $40K | $15K | $180K |
| Meta (E3) | $120K | $50K | $15K | $185K |
| Amazon (SDE1) | $128K | $20K | $25K | $173K |
| Microsoft (59) | $115K | $25K | $0 | $140K |
| Apple (ICT2) | $125K | $30K | $15K | $170K |
| Stripe | $130K | $40K | $10K | $180K |

*Note: These are approximate figures based on publicly reported data. Actual offers vary by location, experience, and negotiation.*

## Factors That Affect Your Offer

**Location matters.** Bay Area and NYC roles pay 15–30% more than other cities, but cost of living is significantly higher. Remote roles typically pay based on a national band.

**Company stage matters.** Early-stage startups may offer lower base salary but more equity upside. Large companies offer more predictable compensation.

**Negotiation matters.** Most new grads don't negotiate, but you should. Having competing offers is the strongest lever.

## How to Maximize Your Offer

1. **Apply to multiple companies** — competing offers give you leverage
2. **Know your market rate** — use Levels.fyi and Glassdoor for data
3. **Negotiate** — ask for more stock or a signing bonus if base is fixed
4. **Consider total compensation** — don't fixate on base salary alone

Browse [new grad SWE jobs](/jobs/new-grad) on Reblet to start your search.`,
  },
  {
    slug: "how-to-land-first-software-engineering-job",
    title: "How to Land Your First Software Engineering Job",
    description:
      "A practical guide for CS students and bootcamp grads on getting your first SWE job — resume tips, interview prep, and job search strategy.",
    date: "2026-10-25",
    readTime: "7 min read",
    content: `Getting your first software engineering job is the hardest part of your career. Here's a practical guide to make it happen.

## Build a Strong Resume

Your resume is your first impression. For new grads:

- **Lead with projects**, not coursework. Hiring managers want to see what you've built.
- **Quantify impact.** "Built a React app" is weak. "Built a React app serving 500 daily users with 99.9% uptime" is strong.
- **Keep it to one page.** No exceptions for new grads.
- **Use a clean format.** No fancy templates — ATS systems can't read them.

## Prepare for Interviews

Most SWE interviews follow this pattern:

1. **Phone screen** — 30–45 min coding problem (LeetCode easy/medium)
2. **Technical rounds** — 2–4 rounds of DSA, system design (for senior), and coding
3. **Behavioral** — "Tell me about a time..." questions about teamwork and problem-solving

### Study Plan

- **Weeks 1–4:** Learn patterns (sliding window, two pointers, BFS/DFS, dynamic programming)
- **Weeks 5–8:** Practice 2–3 problems daily on LeetCode
- **Weeks 9–12:** Mock interviews with friends or platforms like Pramp

## Job Search Strategy

- **Apply early.** Most companies fill new grad roles on a rolling basis — earlier is better.
- **Cast a wide net.** Apply to 50+ companies. The conversion rate from application to offer is typically 2–5%.
- **Don't ignore smaller companies.** Startups and mid-size companies often have less competitive hiring and excellent learning opportunities.
- **Use niche job boards.** General boards like LinkedIn are noisy. Curated boards like [Reblet](/jobs) surface the best roles for new grads and interns.

## Stay Consistent

Job hunting is a numbers game. Set a daily goal (5 applications, 2 LeetCode problems) and stick to it. Most successful job seekers find their role within 2–3 months of active searching.

Start browsing [SWE jobs](/jobs) on Reblet — we add new roles daily.`,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
