# Depth and motion

Values: `tokens/semantic.*.json` (`elevation`, `material`), `tokens/scale.json` (`blur`, `duration`, `easing`). CSS: `--ws-elevation-*`, `--ws-material-*`, `--ws-blur-*`, `--ws-duration-*`, `--ws-easing-*`.

## Elevation

| Level | Use | Light | Dark |
|---|---|---|---|
| 0 | Page, content panes | none | none |
| 1 | Cards, grouped lists | faint two-layer shadow | no shadow; `bg.elevated` |
| 2 | Menus, popovers, floating bars | soft shadow | shadow plus `bg.elevated-2` |
| 3 | Sheets, dialogs | larger shadow, with scrim | same |
| 4 | Items being dragged | largest shadow | same |

The higher the level, the more temporary the surface. Never stack two level-3 surfaces.

## Materials

Glass is a background colour (`material.clear|thin|regular|thick`) with a matching backdrop blur (`blur.*`), saturation of 180% and a 1 px `material.edge` border. Opacity is deliberately high (0.64 to 0.90): legibility comes first, which is also the direction Apple took when it reduced Liquid Glass transparency in iOS 27.

| Material | Use |
|---|---|
| Clear | Controls floating over photos and video only. Add the `material.dim` layer (35% black) behind the control when the media is bright |
| Thin | Tab bars and small floating controls over content |
| Regular | Toolbars and sidebars that content scrolls under |
| Thick | Menus and sheets that carry text |

Rules:

- Glass is only for the navigation and control layer that floats over content. Cards, lists and documents sit on solid surfaces.
- Anything with a significant amount of text (sidebars, menus, alerts) uses regular or thick, never clear or thin.
- **Scroll edge.** Content scrolling under a pinned glass bar fades and blurs at that edge so text never collides with bar labels. One such edge per view.
- Keep colour off glass: labels and icons on bars are monochrome; a single tinted or filled control may mark the primary action.
- On native iOS, standard bars and controls take the system's Liquid Glass automatically. Do not imitate it with custom drawing.
- Text on glass uses primary or secondary label only. One exception: a destructive menu item may use `color.danger.text` on the thick material.
- In a split view each pane may have its own scroll edge, at a consistent height.
- When the reader prefers reduced transparency, or `backdrop-filter` is unsupported, use `bg.elevated` with the same border.
- No glass on glass.

## Motion

| Token | Value | Use |
|---|---|---|
| `duration.instant` | 100 ms | Hover, press, focus feedback |
| `duration.quick` | 180 ms | Exits, small state changes |
| `duration.standard` | 280 ms | Elements moving or resizing on screen |
| `duration.emphasized` | 420 ms | Sheets, navigation transitions |
| `easing.standard` | fast start, gentle stop | Default |
| `easing.exit` | accelerate away | Leaving the screen |
| `easing.spring` | slight overshoot | Sheets, toggles, drops |

Rules:

- Motion starts from the element the person acted on and ends where the result lives.
- Anything animated can be interrupted and reversed mid-flight.
- Motion follows the gesture and its direction. A layer leaves the way it arrived: a sheet that rose from the bottom is dismissed downward, never sideways.
- Frequent actions (typing, selecting a row, switching tabs, ticking a checkbox) get no custom animation beyond the instant state change. Nobody should sit through the same animation many times an hour.
- Motion is never the only carrier of information. Whatever an animation tells the person is also shown by a lasting visual change or words, and on mobile may be supported by a haptic or sound.
- Native iOS and Android use the platform's own spring APIs; the cubic-bezier values are the web approximation.
- Under `prefers-reduced-motion`: movement becomes a 180 ms cross-fade, springs lose their overshoot, nothing animates in depth or into and out of blur, and nothing moves in the periphery. Nothing loops without a pause control.
- Motion is feedback, not decoration. If removing an animation loses no information, it should be brief or absent.

## Layering

`z.*` tokens fix the stacking order: `base`, `sticky` (pinned headers), `bar` (toolbars, tab bars), `popover` (menus, tooltips), `sheet` (sheets, dialogs and their scrim), `toast`. Components never set a raw z-index.

Checked against Apple HIG: Motion, 2026-11-11.
