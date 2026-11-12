# Divider and section header

Status: Specified

## Purpose
A divider separates neighbouring content with a hairline. A section header names the group of content that follows. Prefer space to a line: use a divider only where spacing alone does not make the grouping clear. Use a card or grouped list to enclose content.

## Anatomy
- **Divider**: one hairline, horizontal or vertical.
- **Section header**: title, optional counter, optional trailing action ("See all", a sort control), optional disclosure indicator when the section collapses.
- **Section footer** (optional): one or two lines of help text under a group.

## Variants and sizes

| Variant | Use |
|---|---|
| Full divider | Between regions of a view (toolbar and content, panes) |
| Inset divider | Between rows in a list, starting at the row's text edge |
| Vertical divider | Between groups of controls in a toolbar; its height is the control height minus `space.8` top and bottom |
| Header, list | Above a group in a grouped list. `type.footnote` |
| Header, content | Above a section of a page or grid. `type.title-3` |
| Sticky header | A list or content header that pins while its section scrolls |

A header's trailing action meets `target.touch` on touch and `target.pointer-min` or more on pointer, even when it looks like text.

## States
Dividers have no states. For headers:

| State | Appearance |
|---|---|
| Default | Title in `color.label.secondary` (list) or `color.label.primary` (content) |
| Hover, pressed | Only on the trailing action or a collapsible header: `color.fill.tertiary`, then `color.fill.secondary` |
| Keyboard focus | Focus ring on the trailing action or collapsible header |
| Disabled | Trailing action at `opacity.disabled` |
| Pinned (sticky) | Solid `color.bg.base` or `color.bg.grouped` behind the header, with a hairline under it |
| Loading | The header shows at once; its content shows skeletons |
| Error, selected | Not applicable |

## Tokens
- Colour: `color.separator.default`, `color.separator.opaque` (where lines would stack, and under pinned headers), `color.label.primary`, `color.label.secondary`, `color.accent.default` (trailing action, focus), `color.bg.base`, `color.bg.grouped`, `color.fill.tertiary`, `color.fill.secondary`.
- Type: `type.footnote` (list header and footer), `type.title-3` (content header), `type.subhead` (trailing action), `type.caption-1` (counter).
- Space and shape: `space.4`, `space.8` (header to its content), `space.16` (header inset in grouped lists), `space.24`, `space.32` (above a header, between groups), `border.hairline`, `border.focus`, `border.focus-offset`, `radius.sm` (action hover shape).
- Layering and motion: `z.sticky`, `duration.instant`, `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `target.touch`, `target.pointer-min`.

## Behaviour
- More space goes above a header than below it, so it reads as belonging to what follows.
- No divider after the last row of a group, next to a card edge, or between items already separated by `space.24` or more.
- Never two lines together; where a translucent line would cross another, use `color.separator.opaque`.
- Sticky headers pin under the top bar and are pushed away by the next header. They sit on a solid surface, not glass.
- List headers are not written in capitals. If a design calls for all-caps labels, the tracking rule in `typography.md` applies.
- Right to left: inset dividers start from the mirrored text edge; the trailing action moves to the left.

## Accessibility
- A divider that only decorates is hidden from assistive technology. One that separates groups of controls is a separator.
- Section headers are headings at the correct level; a collapsible header is a button inside the heading with its expanded state exposed.
- Footers are tied to their group as its description.
- A hairline is decoration, not a control border, so it is not held to 3:1; grouping must still be clear from spacing and headings without it.
- Increased contrast: all dividers use `color.separator.opaque`, and list headers use `color.label.primary`.

## Content
- Headers are short nouns in sentence case with no ending punctuation. Good: "Shared with me", "Today". Bad: "SHARED FILES:", "Here are your files".
- Trailing actions say what opens. Good: "See all". Bad: "More >".
- Footers are one or two full sentences that explain the group: "People outside Northwind Studio can't open these links."

Apple reference: none (no equivalent)
