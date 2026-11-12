# Tab view

Status: Specified

## Purpose
Switches between closely related panes of content inside one page: "Members", "Groups" and "Roles" in Admin; "Details" and "Activity" for a file. It is not app navigation; that is the tab bar or sidebar. Use a segmented control to change how the same content is shown, and a select when there are too many panes for tabs.

## Anatomy
- **Tab list**: a row of tabs along the top edge of the content area, above a hairline.
- **Tab**: label, optional leading icon, optional counter.
- **Selection indicator**: a bar under the selected tab.
- **Pane**: the content of the selected tab.
- **Overflow control** (pointer) when tabs do not fit.

## Variants and sizes

| Size | Tab height | Label |
|---|---|---|
| Touch | `target.touch` | `type.body` |
| Pointer | `target.pointer` | `type.body` |

Two to six tabs. With more, restructure or use a select. Tabs are as wide as their labels plus `space.12` padding each side, with `space.8` between tabs; in compact with two or three tabs they may share the width equally.

## States

| State | Appearance |
|---|---|
| Default | Label in `color.label.secondary` |
| Hover | Label in `color.label.primary`; `color.fill.tertiary` behind the tab |
| Pressed | `color.fill.secondary` |
| Keyboard focus | Focus ring around the tab |
| Selected | Label in `color.label.primary` at its emphasised weight, plus the indicator bar in `color.accent.default` |
| Disabled | Avoid. If a pane cannot be used, keep the tab and explain inside the pane. Where policy removes a pane, the tab is removed, not dimmed |
| Loading | The tab selects at once; the pane shows a skeleton |
| Error | The pane shows the message and "Try again"; a tab whose pane holds a form error shows an error icon next to its label |

## Tokens
- Colour: `color.label.primary`, `color.label.secondary`, `color.accent.default` (indicator, focus), `color.fill.tertiary`, `color.fill.secondary`, `color.separator.default` (rule under the list), `color.danger.text` (error icon).
- Type: `type.body` and its emphasised weight; `type.caption-1` (counter).
- Space and shape: `space.2` (indicator thickness), `space.8`, `space.12`, `space.16` (list to pane), `radius.sm` (hover shape), `radius.full` (indicator ends), `icon.sm`, `border.hairline`, `border.focus`, `border.focus-offset`.
- Motion: `duration.standard`, `easing.standard` (indicator slide), `duration.quick` (pane cross-fade), `duration.instant` (hover, press).
- Also used (sizes, selection, increased contrast): `target.touch`, `target.pointer`, `space.4`, `color.separator.opaque`.

## Behaviour
- Selecting a tab shows its pane in the same place. Controls inside a pane affect only that pane.
- Each pane keeps its own state (scroll, filters, unsent input) while the person switches.
- The selected tab is part of the URL on web, so a link and Back return to the same pane.
- The indicator slides from the old tab to the new one; panes cross-fade and do not slide.
- When tabs do not fit: the list scrolls sideways on touch with a fade at the cut edge; on pointer the extra tabs move into an overflow menu at the trailing end. The selected tab is always visible.
- Keyboard: one Tab stop for the list; Left and Right move and select; Home and End jump to the first and last; Tab then moves into the pane.
- Reserve bold for the selected tab only, and size tabs for the bold label so the row does not shift.
- Right to left: tab order and the indicator's travel mirror.
- Reduced motion: the indicator jumps; panes change without a fade.

## Accessibility
- Roles: tab list, tab and tab panel, each panel labelled by its tab. The selected state is exposed.
- Selection is shown by weight and the indicator bar as well as colour.
- Counters are read with meaning: "Requests, 3 pending".
- Holds at 200% text: tabs keep one line and the list scrolls or overflows; labels are never truncated to meaninglessness.
- Increased contrast: the indicator thickens to `space.4` and the rule uses `color.separator.opaque`.

## Content
- Labels are nouns or short noun phrases that describe the pane, one or two words, sentence case.
- Good: "Members", "Shared drives", "Activity". Bad: "View Members", "Tab 2", "Miscellaneous".
- Parallel wording across a set: all nouns, not a mix of nouns and verbs.

Apple reference: Tab views, read 2026-11-11
