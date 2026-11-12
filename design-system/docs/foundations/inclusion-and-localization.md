# Inclusion and localisation

A workspace is used by everyone in an organisation and by people everywhere. Design for the widest range of people, languages and circumstances from the start.

## Inclusion

- **Plain language.** No jargon, idioms or culture-specific humour. Reading level a general audience can follow. A technical term that cannot be avoided is defined where it first appears.
- **People.** Gender-neutral wording ("they"). Never infer gender from a name. Names are a single free-text field wherever possible; do not assume given-name-then-family-name. Do not ask for gender; where a law requires it, offer more than two options, including a self-described one and "Prefer not to say". Generic person icons and default avatars are non-gendered.
- **Imagery and examples.** Sample names, avatars and illustrations reflect a range of regions, ages and abilities, and include people with disabilities. No stereotypes of role, family or occupation. Settings and objects are ordinary and familiar, not only affluent ones.
- **Circumstances.** Assume slow connections, older devices, shared devices and interrupted attention. Core tasks work on a low-bandwidth connection.
- **Disability.** Write about the person first, and mention a disability only when it is relevant. Never use a disability as a figure of speech for something bad.
- **Colour and culture.** Colours mean different things in different places. Status colours always come with an icon and a word, and any new use of colour as a signal is checked in each supported locale.
- **No dark patterns.** No pre-ticked consent, shaming decline buttons, hidden cancel paths or false urgency.

## Languages and regions

- **Text expansion.** Layouts tolerate strings 50% longer than English. Buttons grow or wrap; they never truncate the verb.
- **Formats.** Dates, times, numbers, currency, names, addresses and first day of week come from the locale, never hard-coded.
- **Time zones.** Calendar and Meet always show whose time zone a time is in when people differ.
- **Fonts.** The system stack falls through to the platform's fonts for scripts Inter does not cover. Line heights allow for tall scripts (Thai, Devanagari, Arabic).
- **Sorting and search** respect locale rules and ignore accents by default.

## Right to left

For Arabic, Hebrew, Persian and Urdu the layout mirrors.

| Mirrors | Does not mirror |
|---|---|
| Layout direction, sidebars, navigation order | Media playback controls, progress of time |
| Back and forward chevrons, disclosure arrows | Clocks, charts with a numeric axis |
| Text alignment, list icon position | Logos, app icons, photos |
| Sliders and progress bars that show completion | Phone numbers and numerals inside text |
| Icons that imply direction (reply, send, undo) | Icons without direction (search, trash, star) |
| Icons that depict lines of text (align, list, indent) | Checkmarks and other universal marks; icons of real objects |
| Position of items whose order has meaning (steps, a row of dated thumbnails) | Photographs, illustrations and artwork themselves |
| Position of numbers along a mirrored control (rating 1 to 5, slider ticks) | Order of digits inside any number |
| | Controls that name a real direction or point at something on screen (rotate right, align right) |

Build with logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`) so mirroring is automatic. Mixed-direction content, such as an English file name in an Arabic sentence, is isolated so punctuation does not jump.

- A paragraph of three or more lines aligns by its own language, not by the interface direction. One- and two-line text follows the interface.
- All items in one list share one alignment, including items written in another script.
- Arabic and Hebrew have no capitals and look small beside all-capitals Latin text. In buttons, labels and titles that mix them, raise the right-to-left text by about 2 px.
- An icon that contains a letter (text size, signature) gets a localised version, or is redrawn without the letter.

Checked against Apple HIG: Inclusion, Right to left, 2026-11-11.
