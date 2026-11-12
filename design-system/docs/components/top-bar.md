# Top bar and navigation bar

Status: Specified

## Purpose
The bar at the top of every view. It names the place, carries Back, and hosts search, the app launcher and the account control. Actions on the content are toolbar items placed in this bar or below it; see `toolbar.md`.

## Anatomy
- **Leading**: Back (pushed views), or the sidebar hide control and the app mark (root views in regular and wide).
- **Title**: the name of the place. On a root view in compact, a large title below the bar that collapses into it.
- **Centre** (regular and wide): the search field.
- **Trailing**: up to two toolbar items or a More menu, then the app launcher and the account control. The account control is always the last item.
- **Scroll edge**: the fade and blur where content passes under the bar.

## Variants and sizes

| Variant | Where | Title |
|---|---|---|
| Suite bar | Root of each app, regular and wide | App name beside the app mark; search centred |
| Large title | Root views, compact | `type.large-title` below the bar; collapses to `type.headline` in the bar on scroll |
| Standard | Pushed views, compact; detail panes | `type.headline`, centred on touch, leading on pointer |
| Layer | Sheets and full-screen tasks | Title plus Cancel and the confirming action, placed as `modality.md` says |

Items are `target.touch` on touch and `target.pointer` on pointer. The bar is as tall as its items plus `space.8` above and below, and its content respects the size class margin.

## States

| State | Appearance |
|---|---|
| Default (at top) | No background of its own; the view's surface shows through; no rule |
| Scrolled | `material.regular` with its edge, and the scroll edge effect under it |
| Large title collapsed | Large title fades out as the bar title fades in |
| Hover, pressed, keyboard focus, disabled | Per item, as `button.md` and `toolbar.md` |
| Selected | Not applicable to the bar; toggle items as `toolbar.md` |
| Loading | The bar and title render at once; a title that depends on content shows a skeleton of its width |
| Error | Shown in the content, or as a banner directly under the bar |
| Offline | A quiet indicator beside the title, per `feedback-and-status.md` |

## Tokens
- Colour: `material.regular`, `material.edge`, `color.bg.base`, `color.bg.elevated` (solid fallback), `color.label.primary` (title, icons), `color.label.secondary` (supporting text), `color.fill.tertiary`, `color.fill.secondary`, `color.separator.default`.
- Type: `type.large-title`, `type.headline`, `type.body` at its emphasised weight (text buttons), `type.footnote` (subtitle, such as a message count).
- Space and layout: `space.4`, `space.8`, `space.12`, `space.16`, `margin.compact`, `margin.regular`, `margin.wide`, `icon.md`, `icon.lg` (Back on touch), `target.touch`, `target.pointer`, `border.hairline`, `border.focus`, `border.focus-offset`.
- Depth and motion: `blur.regular`, `z.bar`, `duration.quick`, `duration.standard`, `easing.standard` (title collapse, background appearing), `duration.emphasized` (push and pop).
- Also used (sizes, selection, increased contrast): `color.separator.opaque`.

## Behaviour
- The large title collapses into the bar as the content scrolls and returns when the content is back at the top. The change follows the scroll position, not a timer.
- Back shows the standard chevron with no "Back" text, and returns to where the person was, with scroll position and selection restored. On pointer and web it mirrors the browser's Back.
- Close (on layers) uses the standard close icon or the word "Cancel", as `modality.md` says, never both.
- Titles are short: a word or brief phrase. A long title (a file name) truncates at the end, and the full name is available on hover and to assistive technology. The app name is the title only at the app's root.
- The bar keeps to few items. In compact, anything beyond two actions moves into a More menu or a bottom toolbar.
- One scroll edge per view. The bar is monochrome; at most one tinted or filled control marks the primary action.
- The account control and app launcher keep the same corner in every app and at every size.
- Keyboard: the bar is the first landmark; a skip link jumps past it to the content.
- Right to left: Back sits at the right and points right; the account control sits at the left corner.
- Reduced motion: titles cross-fade without moving. Reduced transparency: `color.bg.elevated` with a `color.separator.default` rule.

## Accessibility
- Element: `header` containing the page's level-one heading (the title). The large and collapsed titles are one heading, not two.
- Back's accessible name says where it goes: "Back to Inbox".
- Icon-only items have names and tooltips with shortcuts.
- At 200% text the large title wraps to two lines; the bar title stays on one line and truncates, with the full title still exposed.
- Increased contrast: the bar is solid with a `color.separator.opaque` rule in every scroll position.

## Content
- Titles name the place or task, sentence case. Good: "Inbox", "Shared with me", "New event". Bad: "Yahel Mail – Inbox (4)", "Welcome back!".
- Back's name. Good: "Back to Inbox". Bad: "Back", "Return".
- Subtitle is one fact. Good: "4 unread". Bad: "You have four unread messages in your inbox".

Apple reference: Toolbars, read 2026-11-11 (navigation bars are covered by that page)
