# Empty state

Status: Specified

## Purpose

An empty state fills a view or region that has no content yet, saying what belongs there and offering the one action that adds it. Use a skeleton while content is still loading, a banner for a condition affecting a view that does have content, and an inline error next to a single failed item.

## Anatomy

- **Icon.** Optional. An interface icon for the kind of content; no large illustration in work views.
- **Sentence.** Required. One line on what belongs here or what happened.
- **Action.** At most one button. None in the cleared kind.
- **Secondary link.** Optional, for "no results" only ("Search all of Drive").

## Variants and sizes

| Kind | Purpose | Action |
|---|---|---|
| First use | Teach what the place is for | Adds the first item |
| No results | A search or filter found nothing | Suggests a fix: clear filters, check spelling |
| Cleared | Everything is done (an empty inbox) | None; it simply confirms |
| Unavailable | Offline, no permission, or failed to load | "Try again", or how to request access |

- Full view: centred in the content pane, in the upper half.
- In a region (a card, a sidebar section, a picker list): leading-aligned, no icon, sentence and a plain button.
- Button: `target.touch` on touch, `target.pointer` on pointer.

## States

The empty state is a static region. Only its button has interaction states, as Button: default, hover, pressed, keyboard focus, disabled, loading.

| Situation | Treatment |
|---|---|
| Loading | Never shown while loading. The skeleton comes first; the empty state only once the answer is known |
| Error | The unavailable kind replaces it, with the reason |
| Content arrives | The empty state is replaced in place; no layout jump |
| Drag over (file views) | The whole region becomes a drop zone, as `file-picker.md` |

## Tokens

- Colour: icon `color.label.tertiary`; sentence `color.label.secondary`; link `color.accent.default`. Background is the view's own (`color.bg.base` or `color.bg.grouped`).
- Button: tinted, `color.accent.default` on `color.accent.soft`. Not filled, unless adding the first item is the primary action of the whole view.
- Text: sentence `type.body`; in a region `type.subhead`. Icon `icon.lg`.
- Space: `space.12` icon to sentence; `space.16` sentence to button; `space.24` padding in a region; `space.48` from the top of a full view.
- Motion: cross-fade with content over `duration.quick` with `easing.standard`.

## Behaviour

- The view's toolbar and navigation stay in place and usable. Actions that need content are disabled with a reason.
- The action does exactly what the view's normal "add" control does, and starts it directly (opens the compose sheet, the file picker).
- No results: keep the query and filters visible, and say which filter is narrowing the result when that is known.
- Permission: say which account has access and how to request it; show the current account context.
- Offline: say what can still be done. Do not offer an action that needs a connection.
- First-use text is shown until the first item exists, then never again. It does not promote paid features.
- Right-to-left: region layout mirrors; centred layout is unchanged.
- Reduced motion: content replaces the empty state without a fade.

## Accessibility

- Text in the normal reading order of the region. A full-view empty state's sentence is a paragraph, not a heading; the view keeps its own heading.
- For no results, the result count ("No results") is announced politely when the search completes.
- The icon is decorative.
- Focus stays where it was (the search field, the filter). It is not moved to the empty state's button.
- Increased contrast: icon and sentence use `color.label.primary`.
- At 200% text the sentence wraps; the button never truncates its verb.

## Content

- One sentence, then one verb phrase. No apology, no exclamation mark.

| Good | Bad |
|---|---|
| "Files shared with you appear here." | "Nothing to see here!" |
| "No results for 'budget' in Starred." + "Clear filters" | "No data" |
| "All caught up." | "Inbox zero! Great job!" |
| "Lena's account has access to this file." + "Request access" | "403 Forbidden" |

Apple reference: none (no equivalent)
