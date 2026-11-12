# Rich text view

Status: Specified

## Purpose
Displays formatted, multi-line content that the system did not write: a mail body, a document's content, a chat message, a comment. Use plain text roles for interface labels. For editing, the same view is paired with the editor toolbar; text entry rules are in the text field spec.

## Anatomy
- **Text block**: paragraphs, headings, lists, quotes, code, tables.
- **Inline items**: links, mentions, inline images, attachments.
- **Quoted or collapsed section** (optional): earlier mail in a thread, behind a disclosure control.
- **Selection** and, where shared, **other people's cursors** with their name.

## Variants and sizes

| Variant | Body role | Use |
|---|---|---|
| Message | `type.body` | Chat messages, comments |
| Reading | `type.body`; may use the long-form content style in `typography.md` on pointer | Mail body, document content |
| Compact | `type.callout` | Previews, notification bodies |

Content headings map to `type.title-1`, `type.title-2`, `type.title-3` and `type.headline`. Nothing renders below the smallest role. Links and mentions inside text meet the target size through line height and padding; on touch, adjacent links keep `space.8` apart.

Token: `size.measure` — a maximum line length for reading layouts; without it each app sets its own content width.

## States

| State | Appearance |
|---|---|
| Default | Text in `color.label.primary` on a solid surface |
| Hover (link, mention) | Underline thickens; the cursor changes to the link cursor |
| Pressed (link, mention) | `opacity.pressed` |
| Keyboard focus | Focus ring around the link, mention or attachment |
| Selected text | `color.accent.soft` behind the text |
| Disabled | Not applicable; read-only content is still selectable |
| Loading | Skeleton lines shaped like paragraphs |
| Error | "Unable to load message" in place, with "Try again" |
| Blocked content | Remote images and unsafe markup are removed and a notice above the body says so |

## Tokens
- Colour: `color.label.primary`, `color.label.secondary` (quotes, metadata), `color.accent.default` (links, mentions), `color.accent.soft` (selection, mention background), `color.bg.base`, `color.bg.sunken` (code blocks), `color.separator.default` (quote bar, table rules), `color.fill.secondary` (skeleton), `color.hue.*` (other people's cursors).
- Type: `type.body`, `type.callout`, `type.title-1`, `type.title-2`, `type.title-3`, `type.headline`, `type.footnote` (captions), `font.mono` (code).
- Space and shape: `space.4`, `space.8`, `space.12` (between paragraphs), `space.16`, `space.24` (before headings), `radius.xs` (mention), `radius.sm` (code block), `border.hairline`, `border.focus`, `border.focus-offset`.
- Other: `opacity.pressed`, `duration.quick`, `easing.standard`.
- Also used (sizes, selection, increased contrast): `color.separator.opaque`.

## Behaviour
- Content sits on a solid surface, never on glass.
- Sender styling is kept where it is safe, but colours are adjusted so text meets 4.5:1 in the current theme. Dark mode does not invert images.
- All text can be selected and copied. Links show their destination on hover and focus; a link whose text is a different address from its destination is marked.
- Wide tables and code scroll sideways inside their own block; the page does not.
- Changes by other people appear without moving the reader's scroll position or selection.
- Text direction is set per paragraph from its content, so a right-to-left message reads correctly inside a left-to-right interface, and the reverse. Lists, quotes and indentation follow the paragraph direction.
- Reduced motion: collapsed sections open with a cross-fade.

## Accessibility
- Real semantics: headings, lists, tables with header cells, `blockquote`, `code`. The view is one region labelled by its title ("Message body").
- Links are underlined in body text; colour is not the only signal. Mentions carry the person's name and, where relevant, "external".
- Holds at 200% text; lines re-wrap and nothing is clipped.
- Other people's cursors show a name as well as a hue.
- Increased contrast: links use the increased-contrast accent, quote bars and rules use `color.separator.opaque`, and selection gains an outline.

## Content
- The system does not rewrite people's content. Its own text inside the view follows `writing.md`.
- Good: "Show quoted text", "Images are hidden. Show images", "Unable to load message. Try again".
- Bad: "…", "Click here to expand", "Content sanitised (policy 4.2)".

Apple reference: Text views; Web views, read 2026-11-11
