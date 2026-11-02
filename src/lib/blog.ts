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
      "Which internships pay the most, when apps open, and what actually gets you the offer.",
    date: "2026-11-01",
    readTime: "5 min read",
    content: `Every year around August, the SWE internship rush begins. If you're a sophomore or junior trying to lock down a Summer 2027 spot, the window is already open - and some of the best-paying ones close fast.

## Who's paying the most?

Intern pay varies wildly. Some companies pay $25/hr, others pay more than most people's first full-time salary. These are the ones that consistently pay the highest:

- **Jane Street** - $60/hr+ in NYC. Probably the single highest-paying internship you can get. Extremely competitive.
- **Google** - $55/hr+ in Mountain View. They also throw in a housing stipend, which matters when Bay Area rent is $3K/month.
- **Stripe** - $55/hr+ in SF. Smaller intern class, so you actually get real mentorship instead of being one of 3,000 interns.
- **Meta** - $52/hr+ in Menlo Park. Relocation package included.
- **Amazon** - $50/hr+ across a bunch of locations. Probably the easiest of these to get into - they hire a lot of interns.

## Application timelines

This catches people off guard every year. Quant firms and trading shops open apps in **August**. By the time you hear about it in November, half the spots are already gone.

- **Aug–Sep**: Jane Street, Two Sigma, Citadel (these fill up quick)
- **Sep–Nov**: Google, Meta, Amazon, Microsoft
- **Oct–Feb**: Startups and mid-size companies - still great roles, just less name recognition

## Actually getting the offer

Forget trying to optimize your LinkedIn profile. The stuff that actually moves the needle:

1. **Have a real project** - Not a to-do app from a tutorial. Deploy something. Even if it's small, having a live URL you can point to separates you from 90% of applicants.
2. **Grind LeetCode** - Nobody loves it, but mediums are the standard. You need to be comfortable solving them in 25 minutes.
3. **Don't only apply to FAANG** - Stripe, Databricks, Ramp, and a bunch of other companies have great intern programs. Less competition too.
4. **Get referrals where you can** - A referral won't get you the job, but it will get your resume looked at instead of filtered out by some ATS.

## Where to look

We post internship openings on Reblet as we find them - check [the internships page](/jobs/internships) if you want to skip the noise of LinkedIn and Handshake.`,
  },
  {
    slug: "new-grad-software-engineer-salary-guide-2027",
    title: "New Grad Software Engineer Salary Guide 2027",
    description:
      "A breakdown of what new grad software engineers actually make in 2027 - base, stock, bonus, and the stuff nobody tells you about negotiation.",
    date: "2026-10-28",
    readTime: "6 min read",
    content: `Everyone asks "what's the TC?" but nobody gives you a straight answer. So here's a real breakdown of what new grads are making at the big companies in 2027, based on what people are reporting on Levels.fyi and Blind.

## The numbers

These are total comp figures - base + stock + bonus, annualized. Your actual offer will depend on team, location, and how well you negotiate.

| Company | Base Salary | Stock/yr | Bonus | Total Comp |
|---------|-----------|---------|-------|-----------|
| Google (L3) | $125K | $40K | $15K | $180K |
| Meta (E3) | $120K | $50K | $15K | $185K |
| Amazon (SDE1) | $128K | $20K | $25K | $173K |
| Microsoft (59) | $115K | $25K | $0 | $140K |
| Apple (ICT2) | $125K | $30K | $15K | $170K |
| Stripe | $130K | $40K | $10K | $180K |

A few notes: Amazon's stock vesting is backloaded (5/15/40/40), so Year 1 TC is lower than what's shown here. Microsoft doesn't do signing bonuses at the 59 level anymore. Meta's stock has been volatile, so that $50K/yr number swings a lot.

## What actually affects your offer

**Where you work** - A Google offer in Mountain View is going to be 15–30% higher than the same role in Raleigh. But SF rent is $3K+ for a studio, so do the math before you get excited about a Bay Area number.

**Big company vs. startup** - Big tech comp is predictable. You know what you're getting. Startups might offer $100K base with a chunk of equity that could be worth a lot or literally nothing. Depends on your risk tolerance.

**Whether you negotiate** - Most new grads just accept the first number. Don't do that. You don't need to be aggressive about it - just having another offer and saying so is usually enough to bump your stock grant or get a signing bonus.

## Getting a better offer

1. **Have competing offers** - This is by far the most effective thing. Two offers from similar companies and suddenly both of them want to pay you more.
2. **Check Levels.fyi** - Know what the band is for your role before you talk numbers.
3. **Ask for stock or a signing bonus** - Base salary bands are usually rigid. Stock and signing bonuses are where there's room.
4. **Look at the full picture** - $140K at Microsoft with low cost of living in Seattle might leave you with more money than $185K at Meta in Menlo Park.

We list full-time SWE roles on the [new grad jobs page](/jobs/new-grad) - worth bookmarking if you're still looking.`,
  },
  {
    slug: "how-to-land-first-software-engineering-job",
    title: "How to Land Your First Software Engineering Job",
    description:
      "What actually works when you're trying to get your first SWE job - from someone who's been through it.",
    date: "2026-10-25",
    readTime: "7 min read",
    content: `The first job is the hardest one to get. After that, everything gets easier because you have experience on your resume. But getting from zero to one is rough, and a lot of the advice out there is either too vague or written by people who haven't applied to a job in 15 years.

## Your resume

Keep it one page. Seriously. Nobody is reading page two.

- **Projects go first, not coursework.** A class project counts if you actually built something - but "completed CS 101" tells a recruiter nothing. If you built a web app, deployed it, and people used it, that's what goes at the top.
- **Add numbers.** "Built a React app" is boring. "Built a React app that 500 people use daily" - now you have my attention. Even rough numbers are better than none.
- **Plain formatting.** Those fancy two-column resume templates with icons and progress bars? ATS software can't parse them. Use a simple single-column layout. Jake's Resume template on Overleaf is a safe bet.

## Interview prep

Most tech interviews look roughly the same:

1. **Recruiter call** - 30 min, mostly behavioral, checking if you're a real person
2. **Technical screen** - 45 min LeetCode-style problem, usually easy-to-medium difficulty
3. **Onsite (or virtual onsite)** - 3–5 rounds of coding, maybe one system design if it's a more senior role, and a behavioral round

### How to study

Don't just randomly grind LeetCode. That's a waste of time.

- **First month**: Learn the patterns. Sliding window, two pointers, BFS/DFS, basic DP. Neetcode.io has a good roadmap for this.
- **Second month**: Do 2–3 problems a day. Focus on mediums. If you can consistently solve a medium in 25 minutes, you're in good shape.
- **Third month**: Do mock interviews. Practice talking through your solution out loud - that's the part most people skip and it's the part that trips them up in the actual interview.

## The job search itself

The conversion rate from application to offer is somewhere around 2–5%. That means if you apply to 50 places, you might get 1–3 offers. That's normal. Don't take rejection personally - it's a volume game.

- **Apply early** - Most companies do rolling admissions for new grad roles. The spots fill up. Applying in January for a role that opened in September means you're competing for fewer seats.
- **Don't sleep on mid-size companies** - Everyone applies to Google and Meta. Not everyone applies to Datadog, Cloudflare, or Ramp. Less competition, and honestly some of these places have better engineering cultures than Big Tech.
- **LinkedIn job search is noisy** - You'll see the same 200-applicant postings everyone else sees. Smaller job boards that focus on SWE roles ([like this one](/jobs)) tend to have less noise.

## Don't burn out

It's easy to go hard for two weeks and then stop. Set a small daily target - like 3 applications and 1 LeetCode problem - and actually stick to it. Consistency beats intensity. Most people who are actively searching land something within a couple months.`,
  },
  {
    slug: "companies-still-hiring-swe-interns-november-2026",
    title: "Companies Still Hiring SWE Interns (November 2026)",
    description:
      "Missed the early recruiting window? These companies are still taking applications.",
    date: "2026-11-02",
    readTime: "4 min read",
    content: `If you're reading this in November and panicking because you don't have an internship lined up yet — relax. You're not as behind as Twitter makes you think.

Yeah, Jane Street and Citadel closed their apps in September. Google's been filling spots since October. But there are a ton of companies that are still actively hiring right now, and some of them won't even open apps until January.

## Who's still open?

This isn't an exhaustive list, but these are companies we've confirmed are still accepting applications as of early November 2026:

- **Amazon** — They hire so many interns that their pipeline stays open well into the winter. If you haven't applied yet, do it today. The bar isn't lower later, but there are still seats.
- **Microsoft** — Explore program for freshmen/sophomores and regular SWE internships both tend to stay open through December.
- **Capital One** — Their tech internship program recruits on a longer timeline than most finance companies. Usually open through November/December.
- **IBM** — Not the sexiest name, but they hire a lot of interns across a ton of locations and the process is straightforward.
- **Salesforce** — Futureforce internships usually stay open late. Good mentorship, decent pay, and the vibe is more chill than FAANG.

## Companies that hire on rolling timelines

Some companies don't do a single big recruiting push. They post roles as teams need them, which means new openings pop up all year:

- Most **defense contractors** (Northrop Grumman, Lockheed Martin, Raytheon) — These aren't glamorous but they pay well and the interviews are way easier than Big Tech. Clearance stuff can be a hassle though.
- **Banks and financial institutions** — JPMorgan, Goldman Sachs tech programs, and a bunch of regional banks hire interns on longer timelines.
- **Startups** — Series A and B companies often don't think about their intern program until Q1. Check Y Combinator's Work at a Startup page, or just browse company career pages directly.

## What if you're applying late?

A few things to keep in mind:

**Your application isn't weaker just because it's November.** Companies that are still hiring expect to receive applications now. You're not competing against the people who applied in August — those spots are already filled. You're competing against other November applicants.

**Smaller companies are your friend right now.** The 50-person startup that just raised a Series B probably hasn't even thought about interns yet. When they do post, there will be way fewer applicants than a Google or Meta posting.

**Tailor your resume for each application.** When there are fewer spots, every detail matters more. If the job description mentions Python and AWS, make sure those are visible on your resume — not buried in a skills section at the bottom.

**Follow up.** At smaller companies, sending a polite follow-up email to the recruiter or hiring manager a week after applying can genuinely make a difference. Don't do this at FAANG (nobody will read it), but at a 200-person company? It works.

## Keep checking

We add new internship postings to Reblet as we find them. The [internships page](/jobs/internships) filters down to just intern roles — worth checking every few days since new ones show up all the time.

The recruiting cycle isn't over just because r/csMajors says it is. Keep applying.`,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
