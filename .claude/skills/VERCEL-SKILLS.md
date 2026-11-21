# Vercel skills in this project

Three skills published by Vercel are vendored here unchanged, from https://github.com/vercel-labs/agent-skills at commit `5a37a63` (MIT licence):

| Folder | Use it for |
|---|---|
| `vercel-react-best-practices/` | Writing or reviewing React components: re-renders, rendering cost, bundle size, client data fetching, JavaScript performance |
| `vercel-composition-patterns/` | Component APIs: compound components, lifting state, avoiding boolean-prop sprawl, React 19 changes |
| `vercel-web-design-guidelines/` | Reviewing interface code against the Web Interface Guidelines (accessibility, forms, focus, motion, touch) |

## How they apply here

This project is client-rendered React on Vite with TanStack Router and TanStack Query. It is not Next.js.

- Ignore every `server-*` rule and anything about Server Components, Server Actions, `next/*` imports or Vercel's hosting. They do not apply.
- Where a Vercel rule and `docs/rulebook.md` or the design system disagree, the rulebook and the design system win. Say so in the pull request if you depart from a Vercel rule for that reason.
- Data fetching follows rulebook section 2 (the typed API client and TanStack Query), not SWR.

To update: replace a folder with the newer upstream copy, review the diff, and change the commit above. The folders are not edited by hand.
