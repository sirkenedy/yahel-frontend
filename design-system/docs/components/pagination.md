# Pagination and load more

Status: Specified

## Purpose
Brings more of a long list or table into view. Three forms, chosen by the task: continuous loading for feeds people read through (mail, chat, files), a "Load more" button where people need to reach what follows the list, and numbered pages where position and total matter (Admin tables, audit logs). Use a page indicator for a small, ordered set of full-screen pages (onboarding tips, a photo carousel).

## Anatomy
- **Continuous**: the list, a loading row at the end, and an end-of-list line.
- **Load more**: a button after the last row, with the shown and total counts.
- **Numbered pages**: range and total ("1 to 50 of 1,240"), previous and next buttons, optional page numbers, optional rows-per-page pop-up button.
- **Page indicator**: a row of dots, one per page, the current one marked.

## Variants and sizes

| Variant | Use | Notes |
|---|---|---|
| Continuous | Mail, chat, Drive lists and grids | Loads before the person reaches the end |
| Load more | Search result groups, comments, lists with content after them | Grey button, full width in compact |
| Numbered pages | Tables in Admin; anything people cite by page | In the table footer, trailing side |
| Page indicator | Up to about 10 peer pages | Centred under the pages |

Buttons follow `button.md`: `target.touch` on touch, `target.pointer` on pointer. Page indicator dots are `space.8` across with `space.8` between them; the control around them is `target.touch` tall and responds to presses on either side of the current dot.

## States

| State | Appearance |
|---|---|
| Default | Buttons in the grey or plain style; current page number on `color.accent.soft` at its emphasised weight |
| Hover, pressed, keyboard focus | As `button.md` |
| Selected (current page or dot) | Page number: `color.accent.soft` with `color.accent.default` text and a `border.control` outline. Dot: `color.label.primary`, larger; other dots `color.label.tertiary` |
| Disabled | Previous on the first page and next on the last, at `opacity.disabled`; they stay in place |
| Loading | Continuous: skeleton rows at the end. Load more: the button shows a spinner and cannot be triggered twice. Pages: current rows stay visible, dimmed, until the new ones arrive |
| Error | "Unable to load more. Try again." in place of the loading row or button; loaded rows are kept |
| End | "No more messages" or the total, stated once; not an endless spinner |

## Tokens
- Colour: `color.fill.secondary`, `color.fill.tertiary`, `color.label.primary`, `color.label.secondary` (range text, end line), `color.label.tertiary` (dots), `color.accent.soft`, `color.accent.default`, `color.separator.default`.
- Type: `type.body` (buttons, page numbers), `type.footnote` (range, counts, end line).
- Space and shape: `space.4`, `space.8`, `space.12`, `space.16`, `space.24` (list to control), `radius.md`, `radius.sm`, `radius.full` (dots), `icon.sm`, `target.touch`, `target.pointer`, `border.control`, `border.focus`, `border.focus-offset`.
- Motion: `duration.instant`, `duration.quick`, `duration.standard`, `easing.standard`, `opacity.disabled`.

## Behaviour
- New rows are added below what is already there. Nothing the person is reading moves, and focus and scroll position are kept.
- Back from an item returns to the same position in the list, however much was loaded.
- Continuous loading never traps content beneath it: a view with a footer or further sections after the list uses "Load more" instead.
- Numbered pages: the page is part of the URL on web. Changing sort or filter returns to page 1 and says so. Rows-per-page is remembered per view.
- Selection across pages is explicit: "Select all" covers the loaded or current rows and offers "Select all 1,240" as a separate step.
- Counts are exact where known and marked as approximate where not ("about 1,200").
- Keyboard: buttons are ordinary Tab stops. In a page indicator, Left and Right change page.
- Page indicator: pages move with a slide on swipe or press; dragging along the dots moves through pages without animating each one. Dots are monochrome.
- Right to left: previous and next swap sides and their chevrons flip; dots order from the right.
- Reduced motion: page changes cross-fade.

## Accessibility
- Numbered pages: a `nav` labelled "Pagination"; the current page is marked as current; buttons are named "Next page" and "Previous page".
- Continuous and load more: newly loaded rows are announced politely with a count ("50 more loaded"), and focus moves to the first new row after "Load more".
- Continuous lists expose their total and position where known, and there is always a way past the list for keyboard users (a skip link or landmark).
- Page indicator: named "Page 2 of 5", adjustable by keyboard and by assistive swipe; swiping the pages is never the only way to move.
- Increased contrast: dots gain an outline so current and other pages differ by size and fill, not only tone.

## Content
- Range. Good: "1 to 50 of 1,240". Bad: "Page 1/25 (50 per page)".
- Button. Good: "Load more", "Show 12 more comments". Bad: "More…", "Next >>".
- End. Good: "No more messages". Bad: "You've reached the end of the internet!".
- Error. Good: "Unable to load more. Try again." Bad: "Fetch failed".

Apple reference: Page controls, read 2026-11-11 (covers the page indicator only; no Apple equivalent for load more or numbered pages)
