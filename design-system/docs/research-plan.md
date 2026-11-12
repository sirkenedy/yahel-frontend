# Research plan

Status: **not started.** Nothing in this design system has been tested with people. Every guideline is a hypothesis until it has. This file is the plan for testing them; it is not a record of results.

## What needs evidence, in priority order

| # | Question | Why it matters | Method |
|---|---|---|---|
| 1 | Do people always know whether they are in their personal account or an organisation? | Mistakes here leak private or company data | Task test: 8 tasks across both contexts; ask "where is this saved, who can see it?" after each |
| 2 | Can people share correctly, and notice when a share goes outside the organisation? | Highest-consequence everyday action | Task test with the share sheet; measure errors and whether the external warning is read |
| 3 | Are storage warnings understood without feeling like pressure? | Trust in the free tier | Show each meter state; ask what will happen and what they would do |
| 4 | Can people tell the nine apps apart at launcher size, including colour-blind participants? | App colours were chosen by calculation only | Find-the-app timing test; include at least 3 participants with red-green colour blindness |
| 5 | Is the pointer type size comfortable for a full working day? | We chose 14 px over Apple's 13 | Diary study with the Mail screen over a week; compare 13, 14, 15 |
| 6 | Does the orbit mark read as intended and stay distinct at small sizes? | Chosen by rule, not reaction | Five-second test and a favicon-size recognition test |
| 7 | Is every flow usable with a screen reader, keyboard only, 200% text and increased contrast? | Accessibility claims are computed, not observed | Sessions with assistive-technology users on the first coded components |
| 8 | Do the plan names and prices make sense, and is 15 GB perceived as generous? | Commercial viability | Survey plus price-sensitivity questions |

## Minimum bar before 1.0

- Rounds 1, 2, 4 and 7 completed with at least 5 participants each, and their findings recorded in `decisions.md`.
- An automated accessibility check and a manual screen-reader pass on every Stable component.
- Arabic and pseudo-locale review of every Stable component.

## Recording results

Each round adds an entry to `decisions.md`: date, who took part (roles only), what was tested, what was found, what changed. A finding that contradicts a guideline changes the guideline.
