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
    slug: "introducing-featured-student-profiles",
    title: "Introducing Featured Student Profiles on Reblet",
    description:
      "For $3, put your profile at the top of Reblet's job board for 30 days. Here's what you get, where it shows up, and how to make yours stand out.",
    date: "2026-11-06",
    readTime: "4 min read",
    content: `Job boards are built for one direction: students search, companies get flooded with applications. Recruiters looking for strong students have to dig through the same noisy channels everyone else uses.

Featured student profiles flip that. Instead of only applying to jobs on Reblet, you can put yourself where recruiters and hiring managers already look: the top of the job board.

## What you get

For **$3**, your profile is featured on Reblet for **30 days**. Your card includes:

- **A professional photo** - you upload it and crop it right in the browser, so your face is centered every time.
- **Your name, school, and graduation year** - the basics a recruiter checks first.
- **A one-line headline** - what you're about and what you're looking for.
- **Up to three highlights** - your best achievements, each tagged as experience, award, project, leadership, research, or academic.
- **Your links** - LinkedIn, GitHub, resume, portfolio, and extra links, one tap away.

## Where it shows up

Featured profiles appear in two places:

1. **The Featured students row** at the top of [the job board](/jobs), the first thing people see when they open Reblet.
2. **The featured student spotlight** - visitors periodically see one featured profile up close, rotating through everyone who's featured so each student gets a fair turn.

Anyone can click a card to see the full profile and open your links.

## Why highlights, not skill lists

Most profiles list the same tools: Python, Java, React, SQL. That doesn't help a recruiter tell students apart. So the featured card is built around what you've done, not what you've listed.

A highlight like "Built a course planner used by 12,000 students" or "1st place out of 150 teams at a campus hackathon" says more in one line than a row of logos. We wrote a whole post on this: [Stand Out to Recruiters: Lead With Achievements, Not Skill Lists](/blog/stand-out-to-recruiters-achievements-not-skills).

## How to get featured

1. **Sign in** to your Reblet account.
2. **Go to [the Featured page](/featured)** and continue to payment.
3. **Build your profile.** Upload and crop your photo, then fill in your details and highlights. A live preview shows your card exactly as recruiters will see it, and it updates as you type.
4. **Save, and you're live.** Your card shows up on the job board within minutes.

You can edit your profile any time during your 30 days. Find it under **Your featured profile** on your [profile page](/profile).

## Tips for a strong card

- **Use a clear, well-lit headshot.** Face the camera, plain background, no group photos.
- **Make every highlight specific.** Start with an action and include a number: users, rank, percent, members.
- **Keep the headline short.** Say what you are and what you want: "CS junior building ML tools, seeking Summer 2027 internships."
- **Add your links.** A recruiter who likes your card will click through to your GitHub or resume, so make sure they're up to date.

## Ready?

[Get featured on Reblet](/featured) and put your best work in front of the people hiring.`,
  },
  {
    slug: "stand-out-to-recruiters-achievements-not-skills",
    title: "Stand Out to Recruiters: Lead With Achievements, Not Skill Lists",
    description:
      "Every student lists Python and React. Here's how to show recruiters what you've actually done, in the few seconds they give you.",
    date: "2026-11-06",
    readTime: "6 min read",
    content: `Open ten student resumes and you'll see the same line ten times: "Skills: Python, Java, React, SQL, Git, AWS." It's not wrong. It's just invisible. When every candidate lists the same tools, the list stops telling a recruiter anything.

What does tell them something is what you did with those tools. That's the shift this post is about.

## Why skill lists don't work

Recruiters skim. A first pass on a profile takes seconds, not minutes. In that window they're asking one question: has this person done something real?

A skill list can't answer that. "React" could mean you shipped a product used by thousands of people, or that you finished half a tutorial. Recruiters know this, so they mostly skip the list and look for evidence.

Skills still matter. They help you show up in keyword searches and get past applicant tracking systems. But they're the filter, not the pitch. Once a human is looking, achievements do the work.

## What counts as an achievement

You probably have more than you think. An achievement is anything with a result attached. Six kinds show up again and again on strong student profiles:

- **Experience** - an internship, a research assistant role, a part-time dev job. "SWE intern at a fintech startup, built the dashboard customers use to track payments."
- **Awards** - hackathons, coding competitions, scholarships. "1st place out of 150 teams at a campus hackathon."
- **Projects** - something you built that other people use. "Course planner used by 12,000 students at my university."
- **Leadership** - running a club, organizing an event, mentoring. "President of Women in CS, grew membership from 120 to 400."
- **Research** - lab work, papers, posters. "Co-authored a paper on efficient NLP models, accepted at a 2026 workshop."
- **Academics** - when they're genuinely strong. "Dean's List every semester, 3.9 GPA."

You don't need one of each. Two or three strong ones beat ten weak ones.

## How to write one that lands

The difference between a forgettable line and a memorable one is usually specifics. Compare:

- "Worked on backend services" vs. "Cut API latency by 40% by adding a caching layer"
- "Built a mobile app" vs. "Shipped an iOS app with 50,000+ downloads"
- "Member of the AI club" vs. "Founded the campus AI club, now 250 members"

The second version of each one does three things:

1. **Starts with an action** - built, shipped, cut, founded, led. Not "worked on" or "helped with."
2. **Has a number** - users, percent, rank, members, dollars saved. Numbers are the fastest thing for a skimming eye to catch.
3. **Fits on one line** - if it needs a paragraph to explain, it's not a highlight yet. Trim it until it reads in one breath.

If you don't have a number, use scale or context instead: "used by my whole department," "adopted by the club as its official tool," "selected as one of 10 finalists."

## Don't have big achievements yet?

That's normal, and it's fixable faster than you'd think.

- **Ship something small, then get people to use it.** A tool your classmates actually use is a better story than a complex project nobody touched. Even 50 users is a real number.
- **Enter one hackathon.** You don't need to win. "Built a working prototype in 24 hours with a team of four" is already more interesting than a skill list.
- **Take on one thing in a club.** Organize a workshop, run the Discord, ship the club website. Leadership doesn't require a title.
- **Measure what you already did.** Go back to old projects and find the numbers. How many users? How much faster? How many stars or forks?

## Put achievements where recruiters look

Once you have two or three strong lines, put them everywhere a recruiter might land:

- **Top of your resume** - a short highlights section above your experience works well for students with thin work history.
- **Your LinkedIn headline and About section** - lead with your best result, not your major.
- **Your portfolio homepage** - the first screen should show what you built and who used it, not a list of logos.

Reblet's [featured student profiles](/featured) are built around this idea. Instead of a wall of programming languages, your card leads with up to three highlights, each tagged as experience, award, project, leadership, research, or academic, right next to your photo, school, and links. Recruiters browsing [the job board](/jobs) see what you've done at a glance.

## The bottom line

Your skills get you into the search results. Your achievements get you the interview. Pick your best two or three, make each one specific with a number, and put them where recruiters look first.`,
  },
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
    slug: "side-projects-that-actually-get-you-hired",
    title: "Side Projects That Actually Get You Hired",
    description:
      "Not all projects are created equal. Here's what hiring managers actually notice on your resume.",
    date: "2026-11-02",
    readTime: "6 min read",
    content: `You've probably heard that you need side projects on your resume. That's true. But there's a massive gap between "I followed a YouTube tutorial and made a weather app" and "I built something that a hiring manager actually wants to talk about in an interview."

Let's close that gap.

## Why most projects don't help you

Recruiters see thousands of resumes. Most of them have the same handful of projects: a to-do app, a calculator, a portfolio website, a CRUD app with React and Node. These technically count as projects, but they don't tell the recruiter anything about you that they couldn't assume about every other CS student.

The bar isn't "can you code?" It's "can you solve a real problem, make decisions about trade-offs, and ship something that works?"

## What actually stands out

**Projects that solve a real problem you had.** The best projects come from scratching your own itch. If you built a tool because you needed it — a Chrome extension that blocks distracting subreddits during study hours, a script that scrapes your university's course catalog and alerts you when a seat opens — that story writes itself in the interview. You can explain the why, not just the what.

**Projects with users.** Even five real users puts you ahead of 95% of applicants. Deploy it. Share it. Put a link on your resume. If someone other than you has used your thing, that shows you can ship software that other people can actually figure out, which is literally the job.

**Projects that use infra.** A React app running locally is one thing. A React app deployed on Vercel with a Postgres database, auth, and a CI pipeline? Now you're demonstrating that you understand how real software works. You don't need to overcomplicate it — just going from "runs on my laptop" to "runs on the internet with real data" is a meaningful step.

## Project ideas worth building

If you're stuck for ideas, here are a few categories that tend to produce good resume material:

### Developer tools
Build something that makes developers' lives easier. A VS Code extension, a CLI tool, a GitHub Action. These tend to be small enough to finish in a few weekends but interesting enough to talk about. Bonus: other developers might actually use them.

### Data projects
Scrape an interesting dataset, clean it, and build something on top of it. A dashboard that tracks housing prices in your city. A tool that analyzes your Spotify listening history. An API that serves data about something niche you care about. Data projects show you can handle the messy reality of real-world information.

### Full-stack apps with auth
Pick a problem and build the whole thing. A study group finder for your university. A split-the-bill app. A workout tracker that does something Strava doesn't. Use a database, add login, deploy it. These are the closest thing to the actual work you'd do at a job.

### Open source contributions
Contributing to an existing open source project shows you can read someone else's code, navigate a large codebase, and work within established patterns. You don't need to land a massive feature — fixing a bug or improving docs for a well-known project still counts and still impresses.

## How to present them

Your resume bullet should focus on impact and decisions, not technologies:

**Weak:** "Built a web app using React, Node.js, Express, and MongoDB"

**Strong:** "Built a course seat tracker that monitors 2,000+ classes and texts students when spots open — used by 300 students at UMD"

See the difference? The second one tells a story. It has a number, a real use case, and an implied technical challenge (monitoring, notifications, scale).

## The one-project rule

You don't need five projects. You need one good one. If you spend a semester going deep on a single project — iterating on it, getting users, fixing bugs, adding features — that's worth more than five half-finished tutorials.

In interviews, depth beats breadth. Being able to talk for ten minutes about the design decisions, trade-offs, and bugs in one project is way more impressive than having a shallow explanation of five.

## Where to share

Put the live URL on your resume. Put the GitHub link on your resume. If the project has a landing page, even better. Make it trivially easy for someone reviewing your resume to go from reading about your project to seeing it live.

Check out the [new grad jobs page](/jobs/new-grad) and [internships page](/jobs/internships) to find roles worth applying to once your resume is in shape.`,
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
  {
    slug: "remote-vs-in-office-new-grad",
    title: "Remote vs In-Office: What New Grads Should Actually Pick",
    description:
      "The remote vs office debate hits different when you have zero years of experience. Here's the honest trade-off.",
    date: "2026-10-20",
    readTime: "5 min read",
    content: `Every new grad job posting now has a little tag: Remote, Hybrid, or On-site. And you probably have a strong opinion about which one you want. But the honest answer for most new grads is more nuanced than "remote is always better."

## The case for going in

This isn't a boomer take. Here's the reality:

**You learn faster in person.** When you're stuck on something and the senior engineer is ten feet away, you can ask a quick question and get unstuck in two minutes. Over Slack, that same question might take an hour to get answered — or you burn two hours going down the wrong path because you didn't want to "bother" anyone.

**You build relationships that matter.** The people you work with early in your career become your professional network for the next decade. It's a lot easier to build those relationships over lunch than over Zoom calls with cameras off.

**You get more visibility.** Promotions and interesting projects tend to go to people that managers actually know. When you're remote, you have to be much more intentional about making your work visible. In the office, some of that happens naturally.

## The case for remote

**Money.** A remote job at a Bay Area company while living in Austin or Denver means you pocket a massive cost-of-living difference. Some companies adjust pay by location, but many don't — and even adjusted remote pay in a low-cost city often goes further than full pay in SF.

**Focus time.** Open offices are loud. If you do your best work in long uninterrupted blocks, remote is hard to beat. You can set up your own space exactly how you want it.

**No commute.** Getting two hours of your day back is real. That time compounds — over a year, you're getting back an entire month of waking hours.

## The honest recommendation

If this is your first job out of school, **lean toward in-person or hybrid for at least the first year.** The learning acceleration is real and it compounds. You'll ramp up faster, build stronger relationships, and have a much easier time figuring out how a real engineering org works.

After that first year, when you know what you're doing and have a network in place, go fully remote if you want. You'll have the context to be effective independently.

## The exception

If the remote job is at a meaningfully better company — better engineering culture, better comp, more interesting problems — take the remote job. Company quality matters more than location policy. A great remote job beats a mediocre in-office one every time.

Browse [remote SWE roles](/jobs/remote) or [all jobs](/jobs) on Reblet to see what's out there.`,
  },
  {
    slug: "technical-interview-mistakes-to-avoid",
    title: "Technical Interview Mistakes Everyone Makes",
    description:
      "The mistakes that cost you offers aren't the ones you think. Most of them happen before you write a single line of code.",
    date: "2026-10-15",
    readTime: "6 min read",
    content: `You studied LeetCode for months. You can solve mediums. You feel ready. Then you bomb an interview and have no idea what went wrong. Sound familiar?

Most interview failures aren't about not knowing the algorithm. They're about everything around the code — how you communicate, how you handle being stuck, and how you manage your time. Here are the mistakes that actually cost people offers.

## Jumping straight into code

This is the number one mistake. You hear the problem and immediately start typing. The interviewer wanted you to:

1. Ask clarifying questions
2. Talk through your approach
3. Confirm the approach makes sense
4. Then code

When you skip steps 1–3, you might solve the problem perfectly and still get a "no hire" because the interviewer couldn't tell if you understood what you were doing or got lucky.

**Fix:** Spend the first 3–5 minutes talking. Repeat the problem back. Ask about edge cases. Say "I'm thinking about using X approach because of Y" and wait for a nod before you start coding.

## Going silent

When you're stuck, your instinct is to go quiet and think. The interviewer interprets silence as "they have no idea what they're doing."

**Fix:** Think out loud. Say "I'm considering whether a hash map or sorting would be better here" or "I'm stuck on the edge case where the array is empty — let me think about that." The interviewer might even give you a hint if they can see where your thinking went wrong.

## Not managing time

A 45-minute interview is actually about 35 minutes of coding time (after intros and questions at the end). If you're still working on the brute force solution at minute 25, you're not going to have time for the optimal one.

**Fix:** If you can't see the optimal solution in 3 minutes, code the brute force fast and then optimize. A working brute force plus a verbal explanation of how you'd optimize beats an incomplete optimal solution every time.

## Ignoring edge cases

You solve the main case, say "done," and the interviewer asks "what if the input is empty?" and your code crashes.

**Fix:** Before you say you're done, test your code mentally with: empty input, single element, duplicates, negative numbers, and the largest possible input. Literally walk through your code with a simple example. This takes 60 seconds and catches most bugs.

## Over-engineering the solution

Sometimes the problem is simpler than you think. If the input size is small (n < 1000), a brute force O(n²) solution is fine. You don't need to invent a novel algorithm for everything.

**Fix:** Ask about input constraints. "What's the expected size of the input?" changes whether you need an O(n) solution or if O(n log n) is perfectly fine. Interviewers respect engineers who consider practical constraints.

## Being defensive about mistakes

The interviewer points out a bug. You get flustered and defensive. This is natural but it's a bad look.

**Fix:** Say "good catch, let me fix that." That's it. Interviewers expect bugs — they're looking at how you respond to feedback, not whether your first draft is perfect. Being coachable is literally on the rubric at most companies.

## Not preparing behavioral answers

You crushed the coding round and then stumble through "tell me about a time you disagreed with a teammate." Behavioral rounds matter more than people think, especially at companies like Amazon where they weight Leadership Principles heavily.

**Fix:** Prepare 4–5 stories from school, internships, or projects that cover: conflict, failure, leadership, a technical decision, and something you're proud of. Use the STAR format (Situation, Task, Action, Result) to keep them structured and under 2 minutes each.

## The meta-mistake

The biggest mistake is treating interviews as a test you either pass or fail. They're a conversation. The interviewer wants to hire you — their day is better when a candidate does well. Approach it like you're pair-programming with a colleague, not performing for a judge.

Ready to put this into practice? Check out the latest [SWE jobs](/jobs) and [internships](/jobs/internships) on Reblet.`,
  },
  {
    slug: "software-engineering-internship-no-experience",
    title: "How to Get a Software Engineering Internship With No Experience",
    description:
      "You don't need prior work experience to land a SWE internship. Here's exactly what to do if your resume feels empty.",
    date: "2026-11-03",
    readTime: "7 min read",
    content: `The biggest catch-22 in tech: you need experience to get an internship, but you need an internship to get experience. It feels impossible, but thousands of students land software engineering internships every year with zero prior work experience. Here's how they do it.

## First, redefine "experience"

When a job posting says "experience preferred," they don't exclusively mean paid work. They mean evidence that you can write code, solve problems, and work on something real. That evidence can come from anywhere:

- A personal project you built and deployed
- An open source contribution
- A class project where you went beyond the assignment
- A hackathon project
- A freelance project for a local business or campus organization

All of these count. A student who built and deployed a full-stack app used by 200 people at their university has more relevant experience than someone who spent a summer filing papers at a tech company.

## Build one real project

You don't need a portfolio of ten projects. You need one good one. Something you can talk about for ten minutes in an interview — what problem it solves, what technical decisions you made, what you'd do differently.

The key is that it needs to be **deployed and usable**. A GitHub repo with a README is okay. A live app with a URL that an interviewer can actually click on is way better. It shows you understand the full lifecycle of software — not just writing code, but shipping it.

**Good project ideas for someone with no experience:**

- A tool that solves a problem at your school (course scheduler, dining hall menu aggregator, study group finder)
- A Chrome extension that does something useful for a specific group of people
- A Discord or Slack bot for a community you're in
- A data dashboard that visualizes something interesting (your city's public transit data, sports stats, campus crime reports)

Pick something you actually care about. Passion projects are easier to build, easier to finish, and way easier to talk about in interviews.

## Target the right companies

Here's where most first-time applicants go wrong: they apply exclusively to FAANG and wonder why they never hear back.

Google gets over two million applications per year. Your odds there, with no experience, are extremely slim. But there are thousands of companies hiring SWE interns that get a fraction of those applications.

**Where to look:**

- **Defense and government contractors** (Northrop Grumman, Lockheed Martin, Booz Allen) — They hire tons of interns, the interview process is more straightforward, and the pay is solid. You might need US citizenship for some roles.
- **Banks and financial institutions** (Capital One, JPMorgan, Fidelity) — Tech intern programs at banks are often overlooked by CS students but they're well-structured with real mentorship.
- **Mid-size tech companies** (Datadog, Cloudflare, Ramp, Toast) — Less name recognition than FAANG but excellent engineering cultures and less competitive hiring.
- **Local companies and startups** — Check your city's tech scene. A 50-person startup might not post on LinkedIn but they'd love a motivated intern. Email them directly.

## Make your resume work with no experience

Your resume doesn't need to be long. It needs to be specific.

**Education section:** Put your GPA if it's above 3.0. List relevant coursework — Data Structures, Algorithms, Databases, Operating Systems. If you're in any CS-related clubs or honor societies, add them.

**Projects section:** This is the star of your resume. Two or three projects with impact-focused descriptions:

- Weak: "Built a web app using React and Node.js"
- Strong: "Built a course seat tracker that monitors 2,000+ classes and sends SMS alerts when spots open — used by 300 students at UMD"

The difference is specificity. Numbers, users, outcomes.

**Skills section:** List languages and tools you're genuinely comfortable with. Don't list 15 technologies you used once in a tutorial. Five or six that you can actually use in an interview setting is more honest and more convincing.

## Nail the behavioral interview

Companies hiring interns with no experience put extra weight on behavioral signals. They want to know: Is this person motivated? Can they learn quickly? Are they coachable?

Prepare stories about:

- **A hard problem you solved** — Doesn't have to be at a job. A tricky bug in a class project counts.
- **Working on a team** — Group projects, hackathons, open source. Show you can collaborate.
- **Learning something on your own** — Taught yourself a framework? Figured out deployment? Built something outside of class requirements? That initiative matters.

Use the STAR format (Situation, Task, Action, Result) to keep your answers structured and under two minutes each.

## Apply early and apply broadly

The conversion rate from application to interview is around 5-10% for experienced candidates. For someone with no experience, assume it's lower. That means you need volume.

**Set a daily target.** Three applications per day is sustainable. Over a month, that's 90 applications. You'll likely get 5-10 responses, which is all you need.

**Apply as soon as roles open.** Many companies review applications on a rolling basis. Applying in week one versus week eight for the same role can be the difference between getting an interview and getting auto-rejected.

**Track everything.** Use a spreadsheet: company, role, date applied, status, follow-up date. It keeps you organized and prevents you from accidentally applying twice.

## The secret nobody talks about

Here it is: most companies hiring interns expect you to know very little. They're investing in your potential, not your current skill set. If you can write basic code, understand data structures, communicate clearly, and show genuine enthusiasm for learning — that's enough for most intern programs.

The students who don't get internships aren't the ones who lack experience. They're the ones who either don't apply broadly enough, apply too late, or don't prepare for the interview format.

Start with one project, target 50+ companies that aren't FAANG, and prepare your stories. The math works out.

Browse [internship openings](/jobs/internships) and [entry-level SWE roles](/jobs/new-grad) on Reblet — we post new ones daily.`,
  },
  {
    slug: "how-to-use-linkedin-for-swe-jobs",
    title: "How to Actually Use LinkedIn to Get a SWE Job",
    description:
      "LinkedIn is noisy, but it still works if you use it right. Here's what to do and what to skip.",
    date: "2026-10-10",
    readTime: "5 min read",
    content: `LinkedIn gets a lot of hate from developers. The feed is full of humble-brag posts and "I'm thrilled to announce" spam. But here's the thing — it still works for getting jobs. You just have to use it differently than most people do.

## Your profile

Most LinkedIn profiles are bad. They read like a copy-paste of a resume, which itself was probably bad. Here's what actually matters:

**Headline:** Don't just put "Computer Science Student at State University." Put what you want to do: "Software Engineer | CS @ State University | Building tools with React and Python." Recruiters search by keywords, and your headline is the first thing they see.

**About section:** Two or three sentences. What you're into, what you're looking for, and one thing that makes you interesting. Not a wall of text. Not your life story.

**Experience:** Same rules as your resume — projects first, impact-focused bullets, include numbers where you can. But on LinkedIn you have more room, so you can add a bit more context than a resume bullet.

**Skills section:** Add every relevant technology. Recruiters filter by skills. If you know Python but it's not in your skills section, you won't show up in their search. It takes two minutes to add 15 skills.

## Finding jobs

The LinkedIn job board is... fine. It's not the best and it's not the worst. The problem is that every popular posting has 200+ applicants within 48 hours.

**Use filters aggressively.** Set the date to "Past week" to find fresh postings. Filter by experience level (Entry level, Internship). Filter by location if you care about it.

**Set up job alerts.** Search for "software engineer new grad" or "software engineering intern," then click the bell icon to get daily emails with new matches. This is actually LinkedIn's most useful feature — you see postings before they get 500 applicants.

**Check company pages directly.** If there are 10 companies you really want to work at, follow them and check their LinkedIn job tabs regularly. Sometimes postings show up on company pages before they hit the main job board.

## Networking (without being weird about it)

The word "networking" makes developers cringe, but it doesn't have to mean sending cold DMs that say "Hello sir/ma'am, I am very interested in your company."

**Connect after real interactions.** Met someone at a career fair? Attended a tech talk? Had someone review your PR in open source? Connect with them and mention the context. That's it. Don't pitch anything.

**Message recruiters at companies you've applied to.** After you apply, find the recruiter for that team and send a short message: "Hi [Name], I just applied to the [Role] position. I'm a CS senior at [School] with experience in [relevant thing]. I'd love to chat if the role is still open." This actually works — recruiters get measured on hires, so they want to hear from qualified candidates.

**Don't spam.** Don't send the same message to 50 people. Don't ask strangers for referrals without any prior interaction. Don't post engagement-bait content. These approaches burn bridges faster than they build them.

## What to skip

**LinkedIn Learning.** Your time is better spent on LeetCode, building projects, or reading actual documentation.

**"Open to Work" banner.** Controversial take, but the green banner can sometimes signal desperation to recruiters. Instead, use the private "Open to Work" setting — it shows your status to recruiters but not to your network.

**Commenting on viral posts.** Unless you genuinely have something to add, don't comment on posts just to get visibility. Recruiters aren't scanning comment sections.

**Premium.** Probably not worth it as a student or new grad. The InMail credits are the only useful feature, and you can usually find recruiter emails through other channels.

## The bottom line

LinkedIn is a tool, not a strategy. Use it to make yourself findable, apply to jobs early, and make warm connections — then close the tab and go back to actually preparing for interviews.

For a less noisy alternative, check out [Reblet's job board](/jobs) — we curate SWE roles for interns and new grads specifically, so you skip the noise.`,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
