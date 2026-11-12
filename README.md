# Yahel frontend

Web frontend for Yahel: a suite of apps for personal accounts and organisations. The backend lives in a separate repository.

```bash
pnpm install
cp .env.example .env        # point VITE_API_URL at the backend (default http://localhost:3200/api)
pnpm dev                    # http://localhost:5173
pnpm verify                 # everything CI checks
```

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
