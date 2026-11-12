# Search field

Status: Specified

## Purpose
Lets people find content by typing: the one search for an app, or a filter for a single list. The rules for scope, results and privacy are in `patterns/search.md`; this spec covers the field and its suggestions panel. Use a select with search for choosing a value in a form.

## Anatomy
- **Field**: search icon at the leading edge, text, placeholder, Clear button at the trailing edge when there is text.
- **Tokens** (optional): removable filters inside the field, before the text.
- **Scope control** (optional): a row under the field for narrowing scope ("All mail", "This folder").
- **Filter row** (optional, with results): type, owner, date and similar.
- **Suggestions panel**: recent searches, suggestions and live results, grouped with headings.
- **Cancel** (compact): a text button beside the field while searching.

## Variants and sizes

| Variant | Where |
|---|---|
| App search | Centre of the top bar in regular and wide. In compact, the trailing tab of the tab bar or the top of the root view |
| Inline filter | Above the one list it filters (members, a sidebar, a picker). Pins under the top bar on scroll |
| Suite search | Home and the app launcher; searches everything the person can access |

Field height: `target.touch` on touch, `target.pointer` on pointer. Shape: `radius.full` in bars, `radius.md` inline. The Clear button is a full-size target even though its icon is small. One app search per view; an inline filter may sit beside it only because its position shows its narrower scope.

## States

| State | Appearance |
|---|---|
| Default | `color.fill.secondary` background, icon and placeholder in `color.label.tertiary` on surfaces where that pair passes, otherwise `color.label.secondary` |
| Hover | `color.fill.primary` |
| Pressed | As hover; the field focuses on release |
| Keyboard focus, and focus by any input | Focus ring; suggestions panel opens |
| With text | Text in `color.label.primary`; Clear button shown |
| Disabled | `opacity.disabled`, with the reason nearby. Rare; prefer leaving search available |
| Loading | A spinner replaces the search icon after 1 second; earlier results stay visible; partial results show as they arrive |
| Error | "Unable to search. Try again." in the panel; the typed text is kept |
| No results | A plain line and a fix, in the panel or results view |
| Selected (suggestion) | Highlight as a menu item |

## Tokens
- Colour: `color.fill.secondary`, `color.fill.primary`, `color.label.primary`, `color.label.secondary`, `color.label.tertiary`, `color.accent.default` (focus ring, text cursor), `color.accent.soft` (tokens), `color.bg.elevated`, `material.thick`, `material.edge` (suggestions panel), `color.separator.default`, `color.scrim` (compact, behind the full-screen search).
- Type: `type.body` (text, suggestions), `type.footnote` (group headings, counts), `type.subhead` (tokens, Cancel).
- Space and shape: `space.4`, `space.8` (icon to text), `space.12`, `space.16`, `radius.full`, `radius.md`, `radius.lg` (panel), `radius.xs` (tokens), `icon.sm`, `icon.md`, `target.touch`, `target.pointer`, `border.focus`, `border.focus-offset`, `border.hairline`.
- Depth and motion: `elevation.2`, `blur.thick`, `z.popover`, `duration.quick`, `duration.standard`, `easing.standard`, `easing.exit`, `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `border.control`, `color.border.control`.

## Behaviour
- One shortcut focuses app search from anywhere: `/`, and Command or Control K.
- Before typing, the panel shows recent searches and suggestions; each recent search can be removed, and all can be cleared.
- Results update as the person types. The match is emphasised by weight, not colour alone. Groups (people, files, messages) show a count.
- Scope starts broad within the current app and account context and is narrowed by the person. Filters chosen become tokens in the field; Backspace at the start of the text selects, then removes, the last token.
- Clear empties the text and keeps focus. Escape clears first, then closes. Cancel (compact) leaves search and returns to the previous place.
- Opening a result goes to the exact match; Back returns to the same results and scroll position.
- In compact, focusing app search opens a full-screen search view with the field at the top. The field is not focused automatically when that would raise the on-screen keyboard over a view the person has not asked to search.
- On pointer in a narrow bar, the field may collapse to a search icon button that expands in place.
- Arrow keys move through suggestions without moving the text cursor's content; Enter opens the highlighted item, or runs the search if none is highlighted.
- Right to left: icon, tokens and Clear mirror; typed text follows its own direction.
- Reduced transparency: the panel uses `color.bg.elevated`. Reduced motion: expand and collapse cross-fade.

## Accessibility
- Element: an `input` of type search inside a search landmark, with an accessible name equal to its scope ("Search mail"). The placeholder is not the only label.
- The field is a combo box tied to its suggestions list; the highlighted suggestion is announced, and result counts are announced politely after typing pauses.
- Tokens are reachable by arrow keys and each has a named remove button: "Remove filter: From Lena".
- Clear is named "Clear search".
- Increased contrast: the field gains a `border.control` outline in `color.border.control`, and the placeholder uses `color.label.secondary`.

## Content
- The placeholder names the scope. Good: "Search mail", "Search Northwind Studio", "Filter members". Bad: "Search…", "Type here", "What are you looking for?".
- No results. Good: "No results for 'budjet'. Check the spelling or remove a filter." Bad: "Nothing found :(".
- Group headings are nouns with a count: "Files, 12".
- Recent searches. Good: "Clear recent searches". Bad: "Purge history".

Apple reference: Search fields, read 2026-11-11
