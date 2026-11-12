# Skeleton

Status: Specified

## Purpose

A skeleton holds the place of content that is loading, in the shape of that content, so the layout appears at once and nothing jumps when the real content arrives. Use a spinner for an action in progress, a progress bar when the amount is known, and nothing for waits under a second.

## Anatomy

- **Blocks.** Plain shapes standing in for text lines, avatars, tiles, thumbnails and buttons.
- **Container.** The real container (card, row, list), drawn normally. Only the content is replaced.

Titles, navigation and anything already known are shown as real content, not as blocks.

## Variants and sizes

| Block | Stands for | Shape |
|---|---|---|
| Text line | A line in a given text role | Height of that role's text, width varied between lines, last line shorter |
| Circle | A person's avatar | `radius.full` |
| Rounded square | An organisation avatar, a file tile | 25% of its size, as icon tiles |
| Rectangle | An image, a preview, a chart | The real aspect ratio |
| Row | A list row | The real row height for the size class |

- Blocks take their size from the component they replace, at touch and pointer sizes. A skeleton has no size of its own.
- Show the number of rows that fit the view, not the expected number of results.

## States

| State | Treatment |
|---|---|
| Loading | Blocks pulse gently |
| Loaded | Blocks cross-fade to content in place |
| Slow | After 10 seconds, a line of text under the first block says what is happening |
| Failed | Blocks are replaced by an error message with "Try again" |
| Empty | Blocks are replaced by the empty state |

A skeleton is not interactive. Hover, pressed, keyboard focus, disabled and selected do not apply.

## Tokens

- Colour: blocks `color.fill.secondary`; pulse to `color.fill.tertiary`. On `color.bg.sunken`, blocks use `color.fill.primary`.
- Shape: text lines `radius.xs`; circles `radius.full`; rectangles take the radius of what they replace (`radius.sm` to `radius.lg`).
- Space: the spacing of the real component. Between stacked text lines, `space.8`.
- Motion: cross-fade to content over `duration.quick` with `easing.standard`.
- Token: `duration.loop` — the period of the pulse; shared with the spinner in `progress.md`.

## Behaviour

- Appears immediately with the layout. Never a blank view and never a full-screen spinner.
- Content replaces blocks in place, a section at a time as each arrives. Nothing shifts position.
- When refreshing a view that already has content, keep the content and show a small spinner instead. Skeletons are for first load.
- The pulse runs in step across all blocks in a view.
- Blocks do not imitate specific text. No fake words, no grey logo.
- Right-to-left: blocks mirror with the layout they stand for; short last lines align to the inline start.
- Reduced motion: no pulse. Blocks are static until content arrives, and the cross-fade remains.

## Accessibility

- The loading region sets `aria-busy="true"` and has one text alternative, "Loading messages". Individual blocks are hidden from assistive technology.
- One polite announcement when loading starts if it lasts over a second, and none when it ends; the content speaks for itself. Focus is never moved to a skeleton.
- Controls that are not ready are absent or disabled, not drawn as blocks that look pressable.
- Increased contrast: blocks use `color.fill.primary` so the shapes stay visible.
- Reduced transparency: no change.
- At 200% text, blocks follow the enlarged layout.

## Content

A skeleton has no visible words until it is slow or has failed.

| Good | Bad |
|---|---|
| "Loading messages" (text alternative) | "Loading, please wait..." repeated per row |
| "Still loading. Check your connection." (slow) | A skeleton that pulses indefinitely |
| "Unable to load files" + "Try again" (failed) | "Something went wrong" |

Apple reference: Loading, read 2026-11-11
