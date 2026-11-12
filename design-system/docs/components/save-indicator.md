# Save and sync indicator

Status: Specified

## Purpose

The save indicator tells people their work is safe. It is always visible wherever content saves automatically: documents, sheets, slides, drafts, settings pages. It replaces a Save button. For the progress of an upload use a progress bar; for a view-wide offline condition the banner also applies.

## Anatomy

- **Icon.** Changes with the state.
- **Text.** The state in words.
- **Detail.** On press or hover: when it was last saved, where, and what is pending.
- **Action.** Only in the error and conflict states ("Try again", "Review").

## Variants and sizes

| Variant | Where | Form |
|---|---|---|
| Full | Next to the document title on regular and wide layouts | Icon and text |
| Compact | Compact width, and dense toolbars | Icon only; text in the accessible name and in the detail popover |
| Row | Mail drafts, chat messages, queued items in lists | Icon and a short word on the item |

- The indicator is a button that opens the detail. Target: `target.touch` on touch, `target.pointer-min` on pointer.
- Same position in every editor.

## States

| State | Icon | Text |
|---|---|---|
| Saving | Spinner | "Saving" |
| Saved | Check | "Saved" |
| Offline | Offline glyph | "Offline, changes saved on this device" |
| Syncing | Spinner | "Syncing 3 changes" |
| Error | Warning glyph | "Couldn't save. Try again." |
| Conflict | Warning glyph | "2 versions of this document. Review." |
| View only | Lock glyph | "View only" (nothing to save) |

| Interaction state | Treatment |
|---|---|
| Hover (pointer) | `color.fill.tertiary` behind the indicator |
| Pressed | `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Disabled, selected | Do not apply |

## Tokens

- Colour: saving, saved, syncing and view only in `color.label.secondary`; offline in `color.label.primary`; error and conflict in `color.danger.text` with the icon in `color.danger.solid`.
- Text: `type.footnote`; error at the emphasized weight. Icon `icon.sm`; spinner as `progress.md`.
- Shape: hover background `radius.sm`.
- Space: `space.4` icon to text; `space.12` from the title; `space.8` horizontal padding.
- Detail surface: popover tokens from `popover.md`.
- Motion: state change is a cross-fade over `duration.quick` with `easing.standard`.

## Behaviour

- "Saving" appears only if a save takes longer than a moment, so quick saves do not flicker. "Saved" then stays; it does not fade away. On compact layouts the check icon stays.
- "Saved" is shown only once the server has the change. Until then the state is "Saving" or "Offline".
- Offline: editing continues. Changes are kept on the device, marked as pending, and sent on reconnection, when the state passes through "Syncing" to "Saved".
- Error: the content stays on screen and on the device. The indicator keeps retrying and offers "Try again". Closing the document while unsaved asks first.
- Conflict: both versions are kept and shown; nothing is overwritten silently.
- The detail states the last saved time in the viewer's time zone and links to version history.
- Never a toast for routine saving.
- Right-to-left: icon at the inline start.
- Reduced motion: the spinner follows `progress.md`; state changes without a fade.

## Accessibility

- A polite live region (`role="status"`). Announce changes into offline, error, conflict, and back to saved after one of those. Do not announce every routine "Saving" and "Saved".
- The button's accessible name is the full state: "Saved 2 minutes ago. Show details."
- Each state has a different icon and different words; colour is never the only difference.
- Error is announced once assertively, then stays readable.
- Increased contrast: all states use `color.label.primary` except error and conflict, which keep `color.danger.text`.
- At 200% text the full variant drops to compact before it truncates the document title.

## Content

Use the three shared strings exactly: "Saving", "Saved", "Offline, changes saved on this device".

| Good | Bad |
|---|---|
| "Saved" | "All changes saved to the cloud" |
| "Offline, changes saved on this device" | "No connection! Changes may be lost." |
| "Couldn't save. Try again." | "Error: write failed (409)" |
| "Syncing 3 changes" | "Please wait" |

Apple reference: File management, read 2026-11-11
