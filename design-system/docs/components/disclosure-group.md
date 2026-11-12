# Disclosure group

Status: Specified

## Purpose
Hides detail until it is relevant: advanced options, a collapsed sidebar group, quoted mail, a nested folder. Use tabs to switch between peer views, and a sheet for a separate task. Do not hide anything most people need.

## Anatomy
- **Header**: disclosure indicator (chevron), label, optional summary value or counter.
- **Content**: revealed below the header, indented or inset to show it belongs to it.

The whole header is the control. The indicator sits at the leading edge for hierarchies (sidebar groups, folder trees) and at the trailing edge for rows in a grouped list.

## Variants and sizes

| Variant | Use |
|---|---|
| Row | A row in a grouped list that expands in place ("Advanced") |
| Tree | Nested levels in a sidebar or the first column of a table |
| Inline | A text-style control inside content ("Show quoted text") |

Header height: `target.touch` on touch, `target.pointer` on pointer. The inline variant keeps the same target through padding even though it looks like text. The indicator is `icon.sm`.

## States

| State | Appearance |
|---|---|
| Default (collapsed) | Indicator points towards the trailing edge |
| Expanded | Indicator points down; content visible |
| Hover | `color.fill.tertiary` behind the header |
| Pressed | `color.fill.secondary` |
| Keyboard focus | Focus ring around the header |
| Disabled | Header at `opacity.disabled`; stays collapsed, with the reason stated nearby |
| Loading (content fetched on open) | Indicator points down at once; skeleton rows in the content area |
| Error | "Unable to load" with "Try again" inside the content area; the group stays open |
| Selected | Only in a tree, where the header is also a destination; see `sidebar.md` |

## Tokens
- Colour: `color.label.primary` (label), `color.label.secondary` (summary, indicator), `color.accent.default` (inline variant label, focus), `color.fill.tertiary`, `color.fill.secondary`, `color.separator.default`.
- Type: `type.body` (row), `type.footnote` (sidebar group label), `type.subhead` (inline).
- Space and shape: `space.4`, `space.8` (indicator to label), `space.12`, `space.16` (content inset), `radius.sm`, `icon.sm`, `border.hairline`, `border.focus`, `border.focus-offset`.
- Motion: `duration.standard`, `easing.standard` (expand), `duration.quick`, `easing.exit` (collapse), `duration.instant` (hover, press), `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `target.touch`, `target.pointer`.

## Behaviour
- Selecting the header toggles the content. Content pushes what follows down; it never overlays.
- The most-used controls stay outside the group, always visible. Collapsed is the default for advanced content.
- Expansion state is remembered per person and place. A group that holds the current selection, a validation error or a search match opens on its own.
- In a tree where the header is also a destination, the indicator toggles and the label navigates; both have full-size targets.
- Keyboard: Enter or Space toggles. In a tree, Right expands, Left collapses and then moves to the parent.
- The indicator rotates and the content height animates together, and can be reversed mid-way.
- No more than two levels of nesting in navigation; see `sidebar.md`.
- Right to left: the collapsed indicator points left; indentation mirrors.
- Reduced motion: content appears with a cross-fade and the indicator changes without rotating.

## Accessibility
- Element: a `button` with its expanded state exposed and tied to the content it controls; or native `details` and `summary`. In a tree, tree items with level and expanded state.
- Collapsed content is removed from the focus order and from assistive technology, not just hidden visually.
- Focus stays on the header after toggling. Opening does not scroll the header out of view.
- The indicator's direction is not the only cue: state is announced as "expanded" or "collapsed".
- Increased contrast: the indicator uses `color.label.primary`.

## Content
- The label says what is revealed, and does not change between states. Good: "Advanced options", "Quoted text". Bad: "More", "Click to expand".
- Inline variant may name the action when that is clearer: "Show quoted text" and "Hide quoted text".
- A summary states the current value so people need not open the group: "Advanced, 2 changed".

Apple reference: Disclosure controls, read 2026-11-11
