# Tab bar

Status: Specified

## Purpose
App-level navigation in compact width: it switches between the top-level sections of one app and keeps each section's place. It never holds actions; those go in a toolbar or the floating action button. In regular and wide layouts the sidebar shows the same destinations in the same order. For switching panes inside a page, use the tab view in `tabs.md`.

## Anatomy
- **Bar**: a floating glass surface at the bottom of the screen, inside the safe area.
- **Tabs**, three to five: icon above a one-word label.
- **Selection shape** behind the selected tab.
- **Badge** (optional) on a tab's icon.
- **Search tab** (optional): the trailing tab, set slightly apart.

## Variants and sizes

| Variant | Use |
|---|---|
| Standard | Default. Tabs share the width equally |
| With search tab | Apps where search is a main task. The search tab is last, drawn as a separate circular button |
| Minimised | While content scrolls down, the bar may shrink to icons only. It returns on scroll up, at the top, or when a tab is pressed |

Each tab is at least `target.touch` wide and tall. Icons are `icon.lg`; labels are `type.caption-2`. The bar is inset `margin.compact` from the screen edges with `radius.full` ends. There is no pointer size: on pointer in a compact window the same bar is used at touch dimensions.

## States

| State | Appearance |
|---|---|
| Default | Icon and label in `color.label.secondary`, outline icon |
| Hover (pointer) | `color.fill.tertiary` behind the tab |
| Pressed | `color.fill.secondary` behind the tab |
| Keyboard focus | Focus ring around the tab |
| Selected | Filled icon and label in `color.label.primary`, label at its emphasised weight, on a `color.fill.secondary` selection shape |
| Disabled | Never. Tabs are not disabled or hidden; an empty or unavailable section explains itself in its own view |
| Loading | The tab selects at once; its view shows skeletons |
| Error | Shown in the section's view, never on the bar |
| Badged | A dot or count in `color.danger.solid` with `color.label.on-accent` text, at the icon's trailing top corner |

## Tokens
- Colour: `material.thin`, `material.edge`, `color.bg.elevated` (solid fallback), `color.label.primary`, `color.label.secondary`, `color.fill.tertiary`, `color.fill.secondary`, `color.danger.solid`, `color.label.on-accent`, `color.accent.default` (focus ring only).
- Type: `type.caption-2`, at its emphasised weight when selected.
- Space and shape: `space.2` (icon to label), `space.4` (bar padding), `space.8` (gap before the search tab, offset from the bottom safe area), `margin.compact`, `radius.full`, `icon.lg`, `target.touch`, `border.hairline` (glass edge), `border.focus`, `border.focus-offset`.
- Depth and motion: `blur.thin`, `elevation.2`, `z.bar`, `duration.standard`, `easing.spring` (selection shape slide), `duration.quick`, `easing.standard` (minimise and restore).
- Also used (sizes, selection, increased contrast): `color.separator.opaque`.

## Behaviour
- Visible on every screen of the app except behind a sheet, dialog or full-screen layer. Pushing a detail view does not hide it.
- Selecting a tab shows that section where the person left it. Selecting the current tab returns to the section's root and then scrolls to the top.
- The bar is monochrome. The accent is not used for the selected tab; fill, weight and the filled icon mark it.
- Content scrolls under the bar with the scroll edge fade, and lists add bottom padding so the last row clears it.
- No overflow. If an app has more than five sections, the rest live inside a section, not in a "More" tab.
- Badges are for things that need the person's attention (unread mail, a missed call), never for promotion.
- The search tab opens search with the field focused and returns the person to the previous tab when they leave search.
- The bar does not move when the keyboard appears; it is covered by it.
- Tab order matches the sidebar order, so changing window size never reorders navigation.
- Right to left: tab order mirrors; the search tab moves to the left end.
- Reduced motion: the selection shape cross-fades and the bar does not minimise. Reduced transparency: `color.bg.elevated` with the same edge.

## Accessibility
- Element: `nav` with a list of links, the current one marked as the current page; on native platforms, the system tab bar styled with our tokens.
- Each tab's name is its label; badges are read with meaning: "Mail, 4 unread".
- Labels are always shown in the standard state. They are never dropped to save space at default text size; at the largest text sizes, a long press shows an enlarged label.
- Selection never depends on colour: the icon changes from outline to filled and the shape appears.
- Increased contrast: the bar gains a `color.separator.opaque` edge, and the selected tab an outline in `color.label.primary`.

## Content
- One word per tab, a noun that names the section. Good: "Inbox", "Files", "Shared", "Search". Bad: "My files and folders", "Go", "New".
- Never a verb for an action: "Compose" is a button, not a tab.
- Badge counts are numerals; above 99 show "99+".

Apple reference: Tab bars, read 2026-11-11
