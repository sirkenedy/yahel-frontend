# Design system

The written design system for Yahel. This copy is canonical (decision F-8 in `../docs/decisions.md`).

| Where | What |
|---|---|
| `docs/` | Principles, foundations, patterns, 60 component specs, decisions, coverage against Apple's HIG, research plan |
| `canvas/` | Source of the review canvas |
| `../packages/tokens/` | Token source (`tokens/*.json`), build and contrast checks, generated `dist/tokens.css` and `dist/tokens.json` |
| `../packages/ui/` | Component CSS, React components, icons, app icons, logo and fonts with their licences |

```bash
pnpm tokens                                   # rebuild tokens; fails on contrast or missing values
pnpm check:tokens                             # tokens plus: component CSS uses only real tokens
pnpm --filter @yahel/tokens decision-tests    # colour measurements behind the design decisions
```

Paths inside `docs/` that mention `tokens/`, `assets/`, `packages/css/` or `scripts/` refer to the locations in the table above.
