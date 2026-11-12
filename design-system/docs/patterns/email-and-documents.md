# Email and documents

Some of the product leaves the product: emails it sends, PDFs it exports, pages it prints. These follow the same tokens, words and trust rules as the screens. A message from the product must be recognisable as genuine and say exactly one thing.

## When this applies

Transactional emails (verification, invitation, security alert, share notification, storage notice and similar), exported PDFs, and anything printed from any app. It does not cover mail that people write to each other, or marketing email, which is outside this system.

## Email structure

Every transactional email has the same parts, in this order.

| Part | Rule |
|---|---|
| From name | The product name. For organisation mail, "<Organisation> via <product>" |
| Subject | Who, what, where, in sentence case, with no prefix in brackets and no exclamation mark: "Lena shared 'Brand refresh' with you" |
| Preview line | Completes the subject; never repeats it |
| Context header | Which account this is about: avatar (circle for personal, rounded square for an organisation) and its name |
| Message | One or two short sentences: what happened, and what to do |
| Action | One filled button, labelled with a verb. The same link in full, as text, under it |
| Detail | Only what helps the person decide: time, device, place, role, expiry |
| Footer | Why this was sent, to which address, a link to notification settings where the type can be turned off, and the sender's legal details |

- One column, readable at phone width without zooming. One primary action per email.
- No logo larger than the context header. No hero image. Illustration only where `../foundations/illustration.md` allows it, and never in a security email.

## The five core emails

| Email | Says | Action | Must also include |
|---|---|---|---|
| Verification | Confirm this address to finish setting up the account | "Verify email" | Expiry; what to do if the person did not ask for it |
| Invitation | Who invited, to which organisation, and what the organisation will be able to manage | "Join <organisation>" | The inviter's name and address; expiry. See `onboarding-and-accounts.md` |
| Security alert | What happened, when, from which device and approximate place | "Review activity" | "If this was you, nothing more is needed." What to do if not |
| Share notification | Who shared what, at which role | "Open" | The sharer's own message, visibly set apart as theirs; an external marker when the sharer is outside the organisation |
| Storage notice | The storage state, in the same words as the product | "Free up space" | "Get more storage" as the second, plain link. See `plans-and-upgrades.md` |

## Naming the account context

- Every email names the account it concerns in the context header and again in the footer: "Personal account" with the address, or the organisation's name.
- A managed account says "Managed by <organisation>".
- Never mix contexts in one email. A person with a personal account and an organisation membership gets separate emails, each named.
- Links open in the named context, and offer to switch if the person is signed in to another. See `navigation.md`.

## Tone

- The voice in `../foundations/writing.md`: clear, calm, exact. No "we", no blame, no drama, no urgency that is not real.
- Storage notices state facts and a path. At most one email per storage state, never a countdown.

## Security emails

- **No marketing, ever.** No upgrade offer, feature news, tip, illustration, survey or social link. Nothing but the event and the response.
- Exact and calm: what, when (with time zone), which device and browser in plain names, and approximate place.
- One action, which opens the product's own security page. The link's domain is the product's and is shown in full as text.
- Never ask for a password, code or payment detail by email, and say so in the footer.
- Sent for every sensitive change (password, recovery method, new device, deletion request) to every contact method on the account. They cannot be turned off.
- No tracking pixels and no redirected links in security emails.

## Tokens in email

- Email cannot read CSS variables. Values are taken from the semantic tokens when the template is built, never typed by hand. A token change rebuilds the templates.
- Colours: `bg.base` for the page, `bg.elevated` for the card, `label.primary` and `label.secondary` for text, `accent.solid` behind the button label in `label.on-accent`, `separator.opaque` for lines, status `text` and `soft` pairs for notices.
- Type: Body for text, Headline for the title, Footnote for the footer, at the touch sizes. The system font stack only; no web fonts.
- Shape and space: `radius.md` for the button, `radius.xl` for the card, spacing from the scale. The button is at least 44 tall.
- Contrast rules are the same as on screen: 4.5:1 for all text, in both themes.

## Dark-mode email

- Templates declare support for light and dark and supply both sets of token values.
- Mail clients differ: some honour the declaration, some invert colours themselves, some ignore dark mode. The design must survive all three.
- No text in images; every image has a text alternative and the email reads correctly with images off. Marks and avatars use transparent backgrounds and keep a visible edge on both light and dark.
- No background images, and no meaning that depends on a background colour being kept.
- The button keeps its filled shape in dark mode; if a client strips the fill, the text link under it still works.
- Each template is tested in light, dark and forced-inversion rendering before release.

## Plain-text fallback

- Every email is sent with a plain-text part that is written, not generated by stripping the HTML.
- Same content, same order: context, message, the action as a full URL on its own line, detail, footer.
- The plain-text part alone must be enough to understand and act.

## Email accessibility

- Real text, link text that says where it goes ("Review activity", not "Click here"), a logical heading, a language attribute, and reading order that matches the visual order.
- Layout mirrors for right-to-left languages. Dates, times and numbers follow the recipient's locale and time zone.

## Exported PDFs and print

Extends "Printing and export" in `files-and-storage.md`.

- **Content only.** No toolbars, sidebars, buttons or cursors. Light theme always, whatever the screen shows.
- **Page.** Size follows the locale. Margins are generous and equal. Nothing is cut at a page edge.
- **Header and footer**, small and quiet: document title, page number as "Page 3 of 12", and the date of export with time zone. Organisation documents name the organisation.
- **Type.** Text roles at the pointer sizes; long text at the reading size. Fonts in an exported file must be ones that may be embedded: Inter or the document's own fonts, never San Francisco.
- **Colour.** Text in the light value of `label.primary`. Meaning never rests on colour, so a greyscale print loses nothing. Large coloured backgrounds are off by default.
- **Links** stay live in a PDF. In print, the destination of an important link is written out.
- **Tables** repeat their header row on each page and never split a row across pages. Headings stay with the text that follows; images and charts are not split. Sheets offer fit-to-width and a preview before printing.
- **Accessible PDF.** Tagged headings, lists and tables, reading order, text alternatives, document language and title.
- **Comments and suggestions** are left out unless the person chooses to include them, and the export says which.
- **Audit and admin exports** state on the first page who exported, when, the time zone, and the filters applied. See `admin-and-bulk-actions.md`.

## Components used

Transactional email template, avatar, button, tag, banner (as a notice block), file tile, table.

## States to design

Each core email in light, dark and plain text; personal and organisation context; right-to-left; expired link landing; images off; long names and long file names; PDF with a table across pages; greyscale print.

Not checked against an Apple page: the HIG has no email topic, and its Printing page was not fetched in this round. Written from this system's own rules and general email practice.
