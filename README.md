# Yahel frontend

Web frontend for Yahel: a suite of apps for personal accounts and organisations. The backend lives in a separate repository.

```bash
pnpm install
cp .env.example .env        # point VITE_API_URL at the backend (default http://localhost:3200/api)
pnpm dev                    # http://localhost:5173
pnpm dev:accounts           # sign-in and account flows, http://localhost:5175
pnpm verify                 # everything CI checks
```

Requires Node 22 or later and pnpm.

## Settings

Copy `.env.example` to `.env`. The shell uses only `VITE_API_URL`; the accounts app reads all of them.

| Variable | For |
|---|---|
| `VITE_API_URL` | The backend, ending in `/api` |
| `VITE_APP_URL` | Where someone goes after signing in when no other address was asked for |
| `VITE_RETURN_ORIGINS` | Further origins a `?return=` address may point to, comma separated. Anything else is ignored |
| `VITE_SIGN_UP_URL` | Where "Create an account" leads. The link is hidden while unset |
| `VITE_HELP_URL`, `VITE_PRIVACY_URL`, `VITE_TERMS_URL` | Footer links. Each is hidden while unset |
| `VITE_BUSINESS_SIGN_UP` | `on` offers workspace sign-up (“For my business or team”) in a release build. Leave it unset until the backend can send the administrator’s confirmation code to a mailbox they already have (`docs/decisions.md` F-78): unset, the choice says it isn’t available yet. A demo build offers it unless this is `off`. Anything else fails the build |
| `VITE_BUSINESS_SIGN_UP_URL` | Where the business choice leads when it is offered. Unset, `/business` in this app |
| `VITE_LOCAL_BUILD` | `local` lets a build use the development addresses. `pnpm build` sets it. A release is built with `pnpm --filter @yahel/accounts build:release`, which fails unless `VITE_API_URL` and `VITE_APP_URL` are https addresses |
| `VITE_STAND_INS` | `on` serves features the backend lacks (passkeys, the account chooser, texted codes, account help) from stand-ins and shows a "Demo data" label. Development only: a build with it on fails unless `VITE_STAND_INS_ALLOW_BUILD=demo` is also set |

| Read | For |
|---|---|
| `CLAUDE.md` | The short operating manual for anyone, human or agent, changing this repository |
| `docs/architecture.md` | Where code goes and why |
| `docs/rulebook.md` | The rules |
| `docs/roadmap.md` | What exists and what is next |
| `docs/agents.md` | How agents develop and merge here, the safeguards, and one-time setup |
| `docs/decisions.md` | Decisions and open questions |
| `design-system/` | The design system: principles, foundations, patterns, component specs |
