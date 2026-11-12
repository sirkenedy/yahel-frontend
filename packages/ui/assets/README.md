# Assets

| Folder | Contents | Licence |
|---|---|---|
| `logo/` | `mark.svg` (tile, for app launcher and sign-in), `mark-mono.svg` (single colour, takes `currentColor`) | Ours |
| `app-icons/` | One tile per app in its identity hue from `tokens/apps.json` | Ours |
| `icons/` | Interface icons in three weights: `regular`, `bold`, `fill`. Named by what they mean in our product; `icons.json` maps each to its source name | Phosphor Icons 2.1.1, MIT (`LICENSE-phosphor.txt`) |
| `fonts/` | Inter Variable, Latin and Latin Extended subsets, with `inter.css` | SIL Open Font Licence 1.1 (`LICENSE-inter.txt`) |

## Rules

- Reference icons by our name (`trash`, `share`), never the source name, so the family can be swapped without touching product code.
- `regular` beside Regular and Medium text, `bold` beside Semibold and Bold text, `fill` for the selected state in tab bars and toggled controls.
- Icons are 256-unit vectors that take `currentColor`. Render at `icon.sm` 16, `icon.md` 20 or `icon.lg` 24.
- To add an icon: copy the three weights from the same source version, add the mapping to `icons.json`, and keep the licence file.
- App icon glyphs are drawn by us on a 24 grid with a 1.7 stroke. If an app hue changes in `tokens/apps.json`, update the matching tile here and run `node scripts/decision-tests.mjs` to confirm the set still separates.
- No San Francisco font files and no SF Symbols anywhere in this folder. Their licence limits them to Apple platforms.
