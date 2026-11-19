# Yahel frontend

Web frontend for Yahel: a suite of apps for personal accounts and organisations. The backend lives in a separate repository.

```bash
pnpm install
cp .env.example .env        # point VITE_API_URL at the backend (default http://localhost:3200/api)
pnpm dev                    # the app, http://localhost:5173
pnpm dev:website            # the public website, http://localhost:5174
pnpm verify                 # everything CI checks
```

The public website reads `VITE_APP_URL` (the address of the app, for its sign-in links) from the same root `.env`. Its build writes each page to disk as HTML with those links in it, so the build itself refuses the address: `pnpm --filter @yahel/website build` fails unless `VITE_APP_URL` is an https address. This is the command a deployment runs.

A build that stays on this machine (a local preview, the browser tests) has to say so with `WEBSITE_LOCAL_BUILD=1`, and then falls back to `http://localhost:5173`. `pnpm build` and `pnpm verify` set it; never set it where the site is built to be deployed. A local build served from anywhere but this machine still refuses to start in the browser, and takes its written page down with it.

Requires Node 22 or later and pnpm.

| Read | For |
|---|---|
| `CLAUDE.md` | The short operating manual for anyone, human or agent, changing this repository |
| `docs/architecture.md` | Where code goes and why |
| `docs/rulebook.md` | The rules |
| `docs/roadmap.md` | What exists and what is next |
| `docs/agents.md` | How agents develop and merge here, the safeguards, and one-time setup |
| `docs/decisions.md` | Decisions and open questions |
| `design-system/` | The design system: principles, foundations, patterns, component specs |
