# Decisions and open questions

Append only. A reversed decision gets a new entry that names the one it replaces.

## Decided in 0.1 (all subject to this review)

| ID | Decision | Reason |
|---|---|---|
| A-1 | Base the system on Apple HIG principles; do not copy Apple's assets or exact palette. | Longevity comes from the principles. See `hig-research.md`. |
| A-2 | Three-tier tokens: primitive, semantic, generated CSS. Product code uses semantic only. | Restyling without touching screens. |
| A-3 | System font stack with Inter fallback; no SF font files. | SF is licensed for Apple platforms only. |
| A-4 | Text roles named after iOS text styles, with touch and pointer size classes. | One vocabulary across web and native. |
| A-5 | Single accent (blue `#0064E0` light, `#4C9AFF` dark) across all apps; per-app hue is identity only. | Clarity and continuity across the suite. |
| A-6 | Text contrast of 4.5:1 enforced by the token build. | Accessibility by construction. |
| A-7 | Glass only for floating chrome, with a solid fallback. | Deference without dated imitation of Liquid Glass. |
| A-8 | People are circles, organisations are rounded squares. | Personal versus organisation context readable at a glance. |
| A-9 | Token names are prefixed `--ws-` and treated as a public API. | Safe evolution. |

## Decided in 0.2 (after checking Apple's live guidelines, 2026-11-11)

| ID | Decision | Reason |
|---|---|---|
| B-1 | Adopt Apple's eight reintroduced principles as experience principles; keep clarity, deference, depth and continuity as visual principles. | Apple's stated principles changed in June 2026. UX decisions need their own test. |
| B-2 | Add increased-contrast overrides for light and dark, held to 7:1 for text. | Apple requires light, dark and increased-contrast variants for custom colours. |
| B-3 | Extend the palette to twelve hues (add mint, cyan, brown). | Parity with Apple's system palette. |
| B-4 | Add an emphasized weight to every text role. | Matches Apple's December 2025 type update. |
| B-5 | Raise glass opacity and add a clear variant with a 35% dim layer for media. | Apple's regular and clear variants; iOS 27 moved toward more legibility. |
| B-6 | Destructive buttons are never the default or the prominent choice in a dialog. | Apple's button role rules. Supersedes the filled red button shown in 0.1. |
| B-7 | Hold all text to 4.5:1 regardless of size; touch targets never below 44; pointer minimum 28. | Deliberately stricter than Apple's minimums. |
| B-8 | Add patterns, writing, inclusion and right-to-left, privacy, input, imagery, governance and a coverage map. | 0.1 covered visual foundations only; a system also needs behaviour and language rules. |
| B-9 | Add scale tokens for borders, focus ring, opacity, icon sizes and stacking order. | Remove the last reasons for raw values in components. |

## Decided in 0.3: the open questions, closed by test (2026-11-11)

Each decision lists the options tried, how they were tested, the result and the reason. Colour measurements are reproducible with `node design-system/scripts/decision-tests.mjs`. Where a decision rests on analysis or an assumption rather than a measurement, it says so.

### D-1 App colours: replace the whole set, not just Mail

- **Options tested:** Mail as blue (same as the accent), cyan, sky, deep cyan, mint, brown, yellow; then the full nine-app set, every pair, since the apps always appear together in the launcher.
- **Test:** colour difference (OKLab ΔE × 100) for normal vision and under simulated red-green colour blindness (Machado 2009), plus white-glyph contrast. Targets: 15 normal, 8 colour-blind (6 is the floor when a second cue exists; app icons have a glyph).
- **Result:** changing Mail alone fixes nothing. The 0.2 set's worst pairs were 7.9 normal (Mail and Docs) and 2.2 colour-blind; with Mail moved to cyan they were still 8.0 (Calendar and Chat) and 2.3 (Docs and Meet). A constrained search over each app's hue family found a set scoring 14.9 normal and 6.9 colour-blind across all 36 pairs, with every white glyph above 3:1 and Mail 10.1 from the accent.
- **Decision:** Mail `#2389E2`, Calendar `#AC040C`, Drive `#0C7B60`, Docs `#5335CF`, Sheets `#38A017`, Slides `#EF6505`, Chat `#D040B9`, Meet `#92009C`, Admin `#4A4B55`. Each app keeps its familiar colour family. The build now fails if any app hue drops below 3:1 against a white glyph.
- **Why not higher scores:** sets reaching 8 colour-blind needed a maroon Calendar and a brown Drive, which lose the familiar associations. 14.9 against a target of 15 is accepted as within rounding.

### D-2 Icon family: Phosphor

- **Options tested:** Phosphor 2.1.1, Lucide 1.72, Tabler 3.51 (packages downloaded and inspected); Material Symbols considered and ruled out without download.
- **Test:** coverage of 80 icons the suite needs; filled variants for the 12 tab-bar icons; weights available to match text weight; licence.
- **Result:**

| | Needed icons found | Filled, of 12 tab icons | Weights | Licence |
|---|---|---|---|---|
| Phosphor | 80 of 80 | 12 | thin, light, regular, bold, fill, duotone | MIT |
| Lucide | 80 of 80 | 0 | one outline, stroke adjustable | ISC |
| Tabler | 80 of 80 | 11 | outline, filled | MIT |

- **Decision:** Phosphor. It is the only one with both a full filled set (our tab bars mark selection with a filled icon) and drawn weights to pair with text weight, which is the behaviour of Apple's SF Symbols we most wanted to keep. Material Symbols has the same capabilities but would make a Google alternative look like Google.
- **Applied:** 83 icons in three weights vendored under `assets/icons/`, renamed to our own names so the family can be replaced later.

### D-3 Font hosting: system font first, self-hosted Inter Variable behind it

- **Options:** (a) system fonts only; (b) Inter on every platform; (c) San Francisco where the OS has it, self-hosted Inter elsewhere.
- **Test:** measured download cost from the Inter Variable package. Latin subset 48 KB, Latin Extended 85 KB, loaded by unicode range.
- **Decision:** (c). Apple devices download nothing and keep the native face. Other platforms get one 48 KB file and a consistent look in place of Segoe UI on Windows and Roboto on Android. (a) costs nothing but gives three different-looking products; (b) makes Apple users download a font to replace a better one.
- **Not measured:** metric differences between San Francisco and Inter in a browser. Line heights are fixed by token, so small width differences do not move layouts.

### D-4 Name and mark: keep "WorkSync Space"; orbit mark

- **Name:** kept. It is already the name in the repository's documentation, plans and architecture files. No alternative was tested, and no trademark search was done; one is needed before public launch.
- **Mark options** (drawn on the Decisions page of the canvas): A, a ring with a centre point (orbit); B, two interlocking arcs (sync); C, a two-by-two grid of tiles.
- **Test:** by construction rules, not with people. At 16 px, does it stay two shapes or fewer with strokes of at least 1.5 px; does it work in one colour; can it be mistaken for a control or another company's mark.
- **Decision:** A. B reads as the refresh control that appears throughout the product. C is too close to Microsoft's four-square mark. A is two shapes, works in one colour, and reads as both an orbit and a person in a space. Files: `assets/logo/`.

### D-5 Free storage and plans: 15 GB free; 100 GB and 2 TB paid

- **Options for free storage:** 5, 10, 15, 20 GB.
- **Evidence:** published free tiers in November 2026: Google 15 GB, Apple iCloud 5 GB, Microsoft OneDrive 5 GB, Proton up to 5 GB, Dropbox 2 GB, MEGA 20 GB. Paid reference points: Google 100 GB at 1.99 USD a month; Microsoft 100 GB at 1.99 USD; Apple from 0.99 USD. Figures come from comparison articles, not the providers' own pricing pages.
- **Decision:** **Free 15 GB**, shared across Mail, Drive and the editors. **Plus: 100 GB at 1.99 USD a month. Max: 2 TB at 9.99 USD a month.** Annual billing at ten months' price.
- **Why:** the product is positioned against Google, so anything under 15 GB loses the comparison on the first line. 20 GB costs a third more per free account for an advantage few people would notice. Paid tiers match the market's best-known price points because a newcomer cannot charge more than Google for the same storage.
- **Condition, not tested:** margin. At an object-storage list price of 0.023 USD per GB a month, a full Plus plan costs 2.30 to store against 1.99 revenue, and a Max plan breaks even at about 22% full. These prices work only if storage costs about 0.010 USD per GB or less, or average use stays low. **Check against real infrastructure cost before launch**; the sizes can stand even if prices move.

### D-8 Storage warnings: by space left, capped by percentage

- **Options:** fixed percentages (80 / 95 / 100) for all plans; or space-left rules.
- **Test:** applied each rule to the three plans. Fixed percentages warn a 2 TB customer with 400 GB still free, which is noise.
- **Decision:** **Getting full** when space left is at most 20% of the plan or 20 GB, whichever is smaller. **Almost full** when space left is at most 5% or 5 GB, whichever is smaller. **Full** at the limit.

| Plan | Getting full at | Almost full at |
|---|---|---|
| Free, 15 GB | 3 GB left | 750 MB left |
| Plus, 100 GB | 20 GB left | 5 GB left |
| Max, 2 TB | 20 GB left | 5 GB left |

### D-6 Coded library: three layers; React with React Aria on the web

- **Options:** React, Vue, Svelte, or framework-neutral Web Components for the web library.
- **How decided:** analysis against requirements, not a benchmark. What was actually built and checked is the framework-neutral layer.
- **Decision:** (1) tokens as CSS and JSON, (2) a framework-neutral CSS component layer on native HTML, (3) React 19 with TypeScript and React Aria Components for behaviour.
- **Why:** the hard part of a component library is accessible behaviour (focus traps, keyboard patterns, overlays, screen-reader announcements), and React Aria is the most complete maintained implementation of it, including right-to-left and touch. TypeScript matches the existing NestJS codebase. Keeping all visuals in layer 2 means the choice of React can be revisited without redrawing anything, and server-rendered pages and emails share the same styles. Web Components were rejected for weaker form and accessibility integration; Vue and Svelte for the lack of an equivalent to React Aria.
- **Built now:** `packages/css/components.css` with 22 parts and a demo page; `scripts/check-css-tokens.mjs` fails on any raw colour or unknown token. The React layer is not started.
- **Left open on purpose:** native app technology. Tokens are emitted as `dist/tokens.json` so either native or cross-platform apps can consume them.

### D-7 Dark base: near-black

- **Options tested:** true black `#000000`; near-black `#0E0E11` with grouped areas at `#050506`; dark grey `#1C1C1E`.
- **Result:**

| | Primary text | Tertiary on top layer | Card against grouped |
|---|---|---|---|
| True black | 19.3 | 4.8 | 1.22 |
| Near-black | 17.7 | 4.8 | 1.18 |
| Dark grey | 15.6 | 3.9 (fails 4.5) | 1.27 |

- **Decision:** near-black. Dark grey fails text contrast on the top layer. True black passes but collapses the difference between the content pane and the grouped background, which layouts rely on, and pure black behind moving text smears on OLED screens. Near-black keeps both surfaces and grouped areas are already almost black for OLED power saving.

### D-9 Languages: English at launch; right-to-left tested from the first component

- **Decision:** launch in English. Every component is tested in Arabic and with 50% longer pseudo-text before it is marked Stable, whether or not Arabic ships at launch. Next languages, in order: French, Arabic, Portuguese, Spanish.
- **Why:** mirroring is cheap when built in and expensive to retrofit, so it is a design-system requirement regardless of market timing. The order of later languages is an assumption about reach, not tested against market data; reorder freely.

### Chart colours

- **Test:** the eight-colour order was searched for the best separation between neighbours, then validated for lightness band, chroma, colour-blind separation, normal-vision separation and contrast, in light and dark.
- **Result:** light: all five checks pass (worst neighbour 21.8 colour-blind, 30.6 normal). Dark: all five pass after re-stepping (18.3 and 28.2). For charts where any two series can touch (scatter, maps), only blue, amber and red pass every pair, so those charts are capped at three series.
- **Applied:** `tokens/chart.json`; rules in `foundations/data-visualisation.md`.

### Smaller defaults accepted in 0.3

Set while writing the specs and patterns, where no rule existed. Each is a reasonable default, not a tested result, and can be changed in its spec.

- Toggle "on" and unread badges use the accent. Badges cap at "99+".
- Toast: bottom centre in compact width, bottom leading otherwise; stays at least 5 seconds; recalled with the Undo shortcut.
- Storage meter: "getting full" and "almost full" both use the warning colour, and the per-app segments merge into one fill from "getting full" onward.
- Time picker steps by 15 minutes. Notifications have three urgency levels; lock-screen text is generic when previews are hidden.
- Chat: Enter sends on pointer devices; messages can be edited and deleted after sending, with a marker. Undo send period is set by the person.
- Calendar invitations: "Accept", "Maybe", "Decline".
- Irreversible bulk admin actions require typing a confirmation. Security emails cannot be turned off and carry no tracking.
- Illustration sizes: 64, 120 and 200.
- Sizes: dialogs and popovers up to 320, sheets 480 or 720, sidebar 264, reading width 68 characters.
- Where Apple's guidance differs and ours was kept, the list is in `hig-research.md`.

### Name changed to Yahel (2026-11-12)

The owner decided the product name is **Yahel**. This replaces the name kept under D-4. The orbit mark is unchanged. Earlier entries in this log still say "WorkSync Space" because they record what was true when written. A trademark search for "Yahel" is still needed before launch.

### Password field: show control (2026-11-12)

- The secure text field is `PasswordField` in `@yahel/ui`. The show control is an icon-only toggle button inside the trailing edge of the field, with an accessible name that changes between "Show password" and "Hide password" and `aria-pressed` for its state.
- The owner of the form may control the revealed state, so sign-in hides the password again on every submit.
- The eye icon is a small inline SVG, because `design-system/assets/icons` is not in the repository yet. Replace it with the vendored icon when the set is added.
- The toggle has a tooltip with the same text as its name, using the new `Tooltip` in `@yahel/ui` built from `components/tooltip.md`.
- The control wrapper is left to right, so in right-to-left layouts the label mirrors while the password and its toggle keep their order. A read-only field keeps a working toggle, because revealing a value does not edit it; a disabled field disables it.
- The icon stroke uses `border.control` until an icon stroke token exists.
- Rejected: a text button ("Show") beside the field, which wraps and overflows at 200% text on narrow screens; revealing only while pressed, which cannot be used with a keyboard or assistive technology.

### Public website: tokens, top bar, phone menu and page change (2026-11-12)

Built in `apps/website` with its components in `@yahel/ui` (`Reveal`, `SiteBar`, `SiteMenu`, `LinkButton`) and their styles in `@yahel/ui/site.css`. `patterns/website.md` is updated to match. The canvas (`canvas/project/website/`) is not yet: it still draws the bar changing height, no phone menu and no page change, and is to be brought in line.

- **Tokens added** to `tokens/scale.json`, because the pattern's numbers had no token and a raw value in product CSS is never the fix: `duration.reveal-move` (620 ms), `duration.stagger` (70 ms), `size.reveal-rise` (28), `space.72`, `space.88`, `space.112`, `radius.3xl` (32), `size.site-content` (1200), `size.site-bar` (68), `size.site-bar-compact` (56), `size.site-cta` (52), `breakpoint.site-nav` (860), and a `display` type group: `xl`, `l`, `title`, `lead`, `eyebrow` from the pattern's table, plus `heading` (20/600), `body` (17) and `label` (15/500), which the canvas uses but the table did not name. Display styles do not shrink on pointer devices, unlike the app type roles; that is why the website could not reuse them. The line heights of `label` (1.34) and `eyebrow` (1.4) were chosen here; the canvas gives none.
- **The top bar compacts by transform, not height.** The pattern said both "height 68 to 56" and "only opacity and transform are animated". The bar's layout height stays 68; the glass layer draws up to 56 and the content rises 6. Rejected: animating height, which moves the page under a sticky element.
- **Phone menu.** Under 860 the canvas hid the links and offered nothing in their place. A "Menu" button now opens a bottom sheet per `components/sheet.md`, listing the same links and Sign in. It closes on Escape, Close, a scrim press, choosing a link, Back, or widening past 860. It is a bottom sheet at every width below 860; the centred-panel form `sheet.md` asks for from 600 up is not built yet.
- **Page change.** The motion table had no row for moving between pages. The old page fades out over 180 ms and the new page arrives by its own reveal, using view transitions where the browser has them. With reduced motion the fade stays, since it is not movement.
- **Bar per page.** The home bar shows Sign in beside "Create account"; other pages show only "Create account", as their canvases do. The About canvas draws a 60 high, always-glass bar; the build follows the pattern (68, clear at the top, glass once scrolled) so every page has one bar.
- **Card headings** on About use `display.title` (34) as the pattern's table says, where the canvas draws 28.
- **Accessibility additions** not on the canvas: the current page in the bar is semibold as well as accent-coloured; the focus ring on an inverse band is `color.label.on-inverse`, because the accent ring measures under 3:1 there in three of four themes; links in the bar, menu and footer are underlined with increased contrast; scroll padding keeps focus and in-page targets clear of the bar; the footer gains an About link so About stays reachable on a phone without the menu.
- **Dark and increased contrast** are derived from the semantic tokens; the canvas is light only and these looks have not had a design review.

## What is still open

| ID | Item | Why it cannot be closed here |
|---|---|---|
| O-1 | Testing with real people | No guideline or decision above has been tested with users. Plan in `research-plan.md`. |
| O-2 | Plan prices against real costs | See the condition under D-5. |
| O-3 | Trademark search for the name | Legal work. |
| O-4 | Native app technology | Depends on team and timeline, not design. |
| O-5 | React component layer | Stack decided; code not written. |
| O-6 | Illustrations | Style rules exist in `foundations/illustration.md`; no artwork drawn. |
