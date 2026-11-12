# Layout and shape

Values: `tokens/scale.json` (`space`, `radius`, `target`, `breakpoint`, `margin`). CSS: `--ws-space-*`, `--ws-radius-*`, `--ws-target-*`.

## Spacing

A 4-point base. Tokens are named by pixel value: `space.2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

| Relationship | Space |
|---|---|
| Icon to its label, inside a control | 8 to 12 |
| Between related items in a group | 12 to 16 |
| Between groups | 24 to 32 |
| Between page sections | 40 to 64 |

## Size classes

| Class | Width | Columns | Margin | Navigation |
|---|---|---|---|---|
| Compact | under 600 | 4 | 16 | Tab bar, full-screen sheets |
| Regular | 600 to 1023 | 8 | 24 | Collapsible sidebar |
| Wide | 1024 and up | 12 | 32 | Sidebar, list and detail side by side |

Layouts are fluid within a class. Content respects device safe areas.

## Targets

- Touch: at least 44 by 44, even when the visible shape is smaller.
- Pointer: 32 tall preferred, 28 minimum.
- Adjacent targets keep at least 8 between them.

## Corner radius

| Token | Value | Use |
|---|---|---|
| `radius.xs` | 6 | Tags, checkboxes |
| `radius.sm` | 8 | Pointer-size controls, list row highlights |
| `radius.md` | 12 | Buttons, fields |
| `radius.lg` | 16 | Menus, tiles, inner cards |
| `radius.xl` | 20 | Cards, grouped lists |
| `radius.2xl` | 28 | Sheets, dialogs |
| `radius.full` | 999 | Pills, avatars, toggles |

Rules:

- **Concentric nesting.** A shape inside a padded container uses the container radius minus the padding. This produces derived values (for example 10 inside a 12 container with 2 padding); they are correct and are not added to the scale.
- **Icon tiles** use 25% of their size (a 40 tile has radius 10).
- **Continuous curvature.** iOS uses the continuous corner style natively. On web, apply `corner-shape: squircle` as progressive enhancement where supported; plain `border-radius` is the baseline.
- **People are circles, organisations are rounded squares.** Avatars carry the account context by shape.
