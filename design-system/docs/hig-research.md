# Apple's design system: research and position

Checked against Apple's live Human Interface Guidelines (HIG) on **2026-11-11**. Pages read are listed under Sources. Reports about iOS 27 that come from press coverage rather than Apple's own pages are marked *(reported)*. Re-run this check after each WWDC (June) and each autumn OS release; the HIG change log is at developer.apple.com/design/whats-new.

## What the HIG is today

Four sections: **Foundations** (18 topics), **Patterns** (25), **Components** (8 categories), **Inputs** (13), plus platform and technology pages. The full topic list, and where each one lives in our system, is in [`coverage.md`](./coverage.md).

### Design principles (reintroduced 8 June 2026)

| Principle | Apple's summary |
|---|---|
| Purpose | Make something meaningful. |
| Agency | Let people do things their own way. |
| Responsibility | Act in people's best interest. |
| Familiarity | Build on what people know. |
| Flexibility | Adapt to diverse contexts and needs. |
| Simplicity | Be clear and direct. |
| Craft | Care about every detail. |
| Delight | Make it human. |

These replace the older "clarity, deference, depth" trio as Apple's stated principles. The trio still describes the visual approach well, so we keep it as our visual principles and adopt the eight as experience principles. See [`principles.md`](./principles.md).

### Foundations, verified values

**Typography.** iOS default (Large) Dynamic Type: Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline 17/22, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16, Caption 2 11/13. Every style now has an **emphasized weight** (Bold for the three largest titles, Semibold for the rest; added December 2025). Default and minimum sizes: iOS 17/11 pt, macOS 13/10 pt. macOS body is 13/16 and macOS has no Dynamic Type. Avoid light weights. Do not embed system fonts.

**Colour.** System colours were revalued in June 2025 and each now has four values: light, dark, increased-contrast light, increased-contrast dark. Blue is 0,136,255 light and 0,145,255 dark, with 30,110,244 and 92,184,255 for increased contrast. The palette has twelve hues: red, orange, yellow, green, mint, teal, cyan, blue, indigo, purple, pink, brown. Rules: supply light, dark and increased-contrast variants for every custom colour; do not use one colour to mean different things; never rely on colour alone; emphasise primary actions by colouring the background, and do not colour the background of several controls at once.

**Accessibility.** Contrast: 4.5:1 for text up to 17 pt, 3:1 for 18 pt and above or any bold text. Text should enlarge by at least 200%. Control sizes: iOS 44 by 44 pt default and 28 minimum; macOS 28 default and 20 minimum. About 12 pt of padding around bezelled controls, about 24 pt around controls without a bezel. Under Reduce Motion: tighten springs, replace movement with fades, avoid depth and blur animations. Minimise time-boxed interface elements.

**Materials.** Liquid Glass is a functional layer for controls and navigation that floats above content. Do not use it in the content layer; use it sparingly on custom controls. Two variants: *regular* (blurs and adjusts luminosity; for anything with significant text such as sidebars, alerts, popovers) and *clear* (only over visually rich media, with a 35% dark dimming layer when the content is bright). Standard materials (ultra-thin, thin, regular, thick) are for structure in the content layer. Scroll edge effects blur and fade content under pinned bars; one per view.

**iOS 27** *(reported)*. Liquid Glass was refined rather than replaced: lower default transparency, better diffusion of busy content, a darker edge and brighter highlights, and a user-adjustable intensity setting. The direction is toward more legibility, which matches the choice we already made.

### Components and patterns, key rules

- **Buttons.** Hit region at least 44 by 44 pt. Roles: normal, primary, cancel, destructive. One or two prominent buttons per view. Never give the primary role to a destructive action. Custom buttons always have a press state. Labels are verbs.
- **Tab bars.** Navigation only, never actions. Always visible except behind a modal. Single-word labels, filled icons, badges only for critical information, never disabled or hidden. On iPhone the bar floats, may minimise on scroll, and a search tab can sit at the trailing end. On iPad it sits at the top and can convert to a sidebar; keep to five or fewer default tabs.
- **Sidebars.** Hideable but not hidden by default; no more than two levels; customisable by the person.
- **Modality.** Only with clear benefit; short tasks; an obvious way to dismiss; confirm before closing when data could be lost; one modal at a time; a title that names the task.
- **Feedback.** Combine colour, text, sound and haptics. Put status next to the thing it describes. Alerts only for critical, actionable information. Warn before unexpected, irreversible loss, and not when the loss is the expected result.
- **Loading.** Show something immediately; let people keep working; determinate progress when the duration is known.
- **Onboarding.** Teach by doing; prefer tips in context; keep any required flow short; postpone non-essential setup; ask for a permission when the feature is first used.
- **Accounts.** Delay sign-in; prefer passkeys; name the method ("Sign in with Face ID"); anyone who can create an account can delete it in-app, with clear timing.
- **Searching.** One place to search everything; show the scope; offer recent and suggested searches with a way to clear history.
- **Sharing.** Share in the toolbar; plain permission summaries ("Only invited people can edit"); collaboration status next to Share.
- **Writing.** Clear, action-oriented, consistent; no blame in errors and no "oops"; avoid "we"; say how to fix a problem, next to the problem.

## Our position

| Area | Decision | Why |
|---|---|---|
| Eight design principles | **Adopt** as experience principles | They are the test for UX decisions, not just visuals. |
| Semantic tokens with light, dark and increased-contrast values | **Adopt** | We now ship all four, as Apple requires of custom colours. |
| Text style names, touch sizes, emphasized weights | **Adopt** | Matches iOS 1:1. Our titles default to their emphasized weight, a deliberate choice for scanning dense workspace screens. |
| Pointer (desktop) sizes | **Go further** | Body 14 and nothing under 11, against Apple's 13 and 10 on macOS. |
| Control sizes | **Go further** on pointer | 32 preferred and 28 minimum, against Apple's 28 and 20 on macOS. Touch matches at 44. |
| Contrast | **Go further** | Apple applies 4.5:1 up to 17 pt and 3:1 above. We hold all text roles to 4.5:1 regardless of size, 7:1 in increased contrast, checked by the build. Apple's default blue (0,136,255) is about 3.5:1 on white; ours is 5.4:1. |
| Twelve-hue palette | **Adopt** the set, our own values | Mint, cyan and brown added in this revision. |
| Typeface | **Adapt** | SF may not be embedded or used off Apple platforms. System stack first, Inter elsewhere. |
| Glass: regular and clear variants, content-layer rule, dimming | **Adopt** | Encoded in `material.*` tokens and `foundations/depth-and-motion.md`. |
| Liquid Glass refraction and lensing | **Leave** on web and Android | Not reproducible faithfully. Native iOS builds get it from standard components. |
| SF Symbols | **Leave** off Apple platforms | Licence. Own icon family needed (open question D-2). |
| Button roles, tab bar, sidebar, modality, feedback, loading, onboarding, account, search, sharing and writing rules | **Adopt** | Written into `patterns/`, `foundations/writing.md` and the component specs. |
| Apple-only topics (Digital Crown, visionOS, CarPlay, workouts and similar) | **Not applicable** | Listed with reasons in `coverage.md`. |

## Where this system must beat Google Workspace

- One language across every app, where Google's apps evolved separately.
- Personal and organisation contexts that are unmistakable at a glance and share every component.
- Accessibility enforced by the build in four themes, not left to review.
- A desktop density designed for work, not scaled-up mobile.
- Honest upgrade and storage messaging: early, specific, never blocking access to existing data. See `patterns/plans-and-upgrades.md`.

## Sources

Read on 2026-11-11, all under developer.apple.com/design:

- whats-new
- human-interface-guidelines/ pages: design-principles, foundations, patterns, components, inputs, typography, color, accessibility, materials, layout, writing, feedback, loading, onboarding, searching, modality, collaboration-and-sharing, managing-accounts, tab-bars, sidebars, buttons

iOS 27 Liquid Glass changes *(reported)*: MacRumors, "Here's How Liquid Glass Is Changing in iOS 27" (10 June 2026); TechTimes, "Apple Liquid Glass iOS 27" (8 June 2026).

Second round, same day, read while writing the component specs and patterns: motion, privacy, inclusion, right-to-left, generative-ai, managing-notifications, settings, drag-and-drop, file-management, entering-data, undo-and-redo, launching, offering-help, multitasking, playing-haptics, playing-audio, playing-video, going-full-screen, charting-data, dark-mode, branding, images, icons, app-icons, sf-symbols, the typography tracking table, and the component pages for alerts, sheets, popovers, scroll-views, text-fields, toggles, segmented-controls, pickers, combo-boxes, sliders, steppers, color-wells, token-fields, progress-indicators, notifications, widgets, live-activities, menus, context-menus, pull-down-buttons, pop-up-buttons, toolbars, lists-and-tables, outline-views, split-views, collections, disclosure-controls, tab-views, path-controls, page-controls, activity-views, image-views, text-views, web-views and boxes. Each file that was checked carries a line saying which pages it was checked against.

Still not read: Charts (component), Quick Look, Printing, and the dimension tables for widgets and live activities.

## Where we knowingly differ from Apple

Recorded so nobody "fixes" them by accident. Reasons are in `decisions.md`.

| Topic | Apple | Ours |
|---|---|---|
| Capitalisation of buttons, menus, tabs | Title case | Sentence case |
| Alert buttons | Up to three; Cancel should not be the default | Two at most; the safe choice is the default |
| Destructive actions | May be prominent, and confirmed | Never the prominent choice; Undo first, confirm only permanent and unexpected loss |
| Field labels | Placeholder may serve as the hint | A visible label always |
| Continue button | Held back until required fields are filled | Stays enabled and names what is missing |
| File extensions | Hidden by default | Shown for uploaded files, as a safety matter |
| Share button | Opens the system share sheet | Opens the access view; "Send a copy" opens the system sheet on native |
| Search placement, wide | Trailing side of the toolbar | Centre of the top bar |
| Storage meter | Nothing critical at the foot of a sidebar | Meter at the sidebar foot, and also in account settings |
| Toggle "on" colour, unread badges | Green; red | Accent, because green and red are reserved for success and danger |
| Title tracking | The system font tracks itself, positive from 24 pt | A small extra tightening on titles, which also suits Inter |
