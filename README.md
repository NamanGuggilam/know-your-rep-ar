# Know Your Rep AR

A nonpartisan web app that helps Arkansans understand their ballot and their government. Built for the Congressional App Challenge (Arkansas's 3rd District).

Type your address and see:

- **Your ballot, side by side.** Every candidate in each race on the November 3, 2026 general election, compared on the same 10 topics, in their own words. Every quote is checked word-for-word against its source, and every entry links to it.
- **Your representatives.** Your two U.S. Senators, U.S. Representative, State Senator, and State Representative, with one-tap call, email, and a "help me write a message" tool.
- **Where they stand.** Each official's role, committees, and the bills they sponsored, from official records.
- **Who does what.** The powers and responsibilities of each office, in plain English.
- **How to vote.** A first-time voter guide that links to official Arkansas Secretary of State resources.

## Built for everyone

- Written at a 6th-8th grade reading level, with tap-to-define civic words.
- Accessibility menu on every page: 4 text sizes, light/dark/high-contrast themes, Atkinson Hyperlegible and OpenDyslexic fonts, line spacing, Simple mode, reduce motion.
- Keyboard and screen-reader friendly. Every page is checked with axe-core at phone and desktop widths, in every theme, at the largest text size (`npm run audit:a11y`).
- Installable on a phone home screen (PWA).

## Staying neutral

- Every candidate gets the same layout, the same topics, and the same search effort, in official ballot order.
- Candidates are shown only in their own words: their campaign site first, then direct quotes in news, debates, questionnaires, and official sites. No opinion columns, opponents, party sites, or advocacy ratings.
- The AI only sorts and restates. Code rejects any quote that is not found word-for-word on its source page, and any summary that uses political labels.
- The question helper answers only from the app's sources and never says who to vote for.
- Party labels always show the party name in words, never color alone.

See the in-app "How we stay neutral" page for the full rules.

## Data sources

| What | Source |
| --- | --- |
| Address to districts | U.S. Census Bureau Geocoder |
| District maps | U.S. Census Bureau TIGERweb |
| Members of Congress, committees | `unitedstates/congress-legislators` |
| Federal bills | Congress.gov API |
| Arkansas legislators | Open States, cross-checked with the Arkansas State Legislature |
| State bills and committees | Arkansas State Legislature (arkleg.state.ar.us) |
| 2026 candidates and ballot order | Official sample ballot, Arkansas Secretary of State |
| Candidate positions | Candidates' own websites and direct quotes (sources shown on every entry) |
| Voter information | Arkansas Secretary of State |

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run audit:a11y # accessibility audit (needs the dev server running)
```

Optional keys go in `.env.local` (see `.env.example`): `ANTHROPIC_API_KEY` turns on the question helper, `GOOGLE_CIVIC_API_KEY` adds polling places, `CONGRESS_GOV_API_KEY` raises Congress.gov rate limits.

## Tech

Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel. No accounts, no tracking, and addresses are never stored.

_Know Your Rep AR is an independent student project. It is not affiliated with or endorsed by any government office._
