# Platforms

One system, three platforms. The rules, tokens, words and structure are the same everywhere. How people move around and what the system itself draws belong to the platform. The principle is Familiarity: standard parts behave in standard ways on each platform (`principles.md`).

## What never changes

- Semantic tokens: colour roles, text roles, spacing, radius, elevation.
- The three levels of navigation (suite, app, content) and the order of destinations. See `patterns/navigation.md`.
- Words, action names and their order in menus. See `foundations/writing.md`.
- The account context marker: people are circles, organisations are rounded squares.
- Accessibility requirements, including 4.5:1 text contrast and 44 touch targets. See `foundations/accessibility.md`.
- Privacy and upgrade rules.

## Web

- **Responsive by size class**, not by device. Compact, regular and wide from `foundations/layout-and-shape.md`. A narrow desktop window gets the compact layout.
- **Everything has a URL.** Every item, view, filter state and settings pane. Reloading returns to the same place. Links are real links: they open in a new tab, can be copied and show their destination.
- **The browser's controls work.** Back and forward move through the person's own history of views. Opening a sheet or preview adds a history entry only when it has a URL.
- **Browser conventions are kept.** Text can be selected and copied. Zoom works to 200% without loss. Autofill and password managers are not blocked. The browser's shortcuts are never overridden.
- **Preferences come from the browser first**: `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-motion`, `prefers-reduced-transparency`. Web is the only platform where Appearance settings repeat them. See `patterns/settings-and-help.md`.
- **Pointer and touch are detected by capability**, not by width: pointer sizes apply under `(hover: hover) and (pointer: fine)`. A touch laptop gets touch targets when touched.
- **Glass** uses `backdrop-filter` with the solid fallback. Continuous corners are progressive enhancement.
- **Scrolling is the browser's.** No custom scroll physics, no scroll hijacking.
- **Context menus.** Right-click on an item opens our menu; on plain text, links and fields the browser's own menu stays.
- **Print** uses the print rules in `patterns/email-and-documents.md`.

## iOS and iPadOS

- **Native components first.** Bars, sheets, menus, pickers, alerts, the share sheet and the keyboard are the system's, styled with our tokens. Nothing native is redrawn to match the web build.
- **Liquid Glass comes from the system.** Standard bars and controls take it automatically. Never imitate it with custom drawing, and never add our own glass on top. See `foundations/depth-and-motion.md`.
- **Dynamic Type.** Each text role maps to the system text style of the same name, so all sizes including the accessibility sizes work. Layouts reflow at large sizes; nothing truncates to meaninglessness.
- **Back swipe.** The edge swipe always goes back. No control or gesture of ours sits on that edge or blocks it. Swipe actions on rows start away from the edge.
- **Tab bar** follows the system: floating on iPhone, at the top on iPad where it can become the sidebar. Ours supplies the tabs, labels and order.
- **System settings are followed, not repeated**: appearance, contrast, motion, transparency, text size, notifications, permissions.
- **Icons** may map to the nearest SF Symbol in native builds only. See `foundations/iconography.md`.
- **Haptics** use the system patterns for their documented meanings. See `patterns/feedback-and-status.md`.
- **Safe areas** are respected. Content goes under bars; controls do not go under the home indicator.
- **iPad** windows resize freely. Layout follows size class, supports several windows, and gains keyboard and pointer behaviour when those are attached.

## Android

Our system is modelled on Apple's guidelines. On Android, Android's own conventions come first wherever the system or its standard components are involved.

### System bars, edge-to-edge and layout

Checked against Android's design pages "System bars" and "Layout basics", 2026-11-11.

- **Edge-to-edge.** Content draws behind the status bar and the navigation bar. Both system bars are transparent or translucent, never opaque. Android enforces this from Android 15.
- **Gesture navigation bar stays transparent.** No background behind the gesture handle. With three-button navigation, use a translucent bar where content scrolls beneath it.
- **No targets under the gesture areas.** Nothing interactive sits in the bottom gesture inset or along the left and right edges where the back swipe starts.
- **Design for both navigation modes**: gesture and three-button. Either may be in use.
- **Insets, not fixed padding.** Layouts read the system's insets for bars, display cutouts and the keyboard, so nothing is covered on any device.
- **Keyboard.** The focused field always stays visible above the keyboard; an input is never hidden behind it.
- **Navigation changes with window size**: a bottom navigation bar in compact windows, a navigation rail in wider ones. This maps to our tab bar and sidebar, with the same destinations in the same order.
- **Reach.** Primary navigation and the primary action stay in the easily reached part of the screen. Our floating action button in compact width matches Android's convention.

### Back, components, text and haptics

Not verified against Android's docs. Written from general knowledge of Android and Material conventions; check before the Android build is specified.

- **System back always works.** The back gesture or button closes the top layer first (keyboard, menu, sheet, dialog, selection mode, search), then goes back one view, then leaves the app. Our own back arrow in the top bar goes up one level and never does anything the system back would not.
- **Predictive back.** The system's back preview animation is supported and not replaced. Back never asks "Are you sure?" unless input would be lost, and then the draft is kept instead where possible.
- **Navigation bar, not our floating tab bar.** In compact width Android uses the platform's bottom navigation bar on a solid surface, with our icons, single-word labels and order. It does not float on glass.
- **System sheets and pickers.** Sharing out, choosing a file or photo, date and time, permissions and sign-in with a saved credential use the system's own surfaces. Ours are used only inside the product (sharing with people in the suite).
- **Font scaling.** Text roles are set in scalable units and follow the system font size, to at least 200%. Layouts reflow.
- **Haptics** use the platform's predefined effects and respect the system's touch feedback setting. Devices vary a great deal; nothing depends on a haptic.
- **Typeface** is the platform default or Inter (open question D-3), never San Francisco.
- **Material components** are used for system-level behaviour (snackbar placement above the navigation bar, bottom sheets, menus) and styled with our tokens. Glass is not used on Android; floating chrome uses `bg.elevated`.
- **App icon** is supplied as an adaptive icon: our tile as the background, the glyph as the foreground, plus a monochrome layer for themed icons.

## Desktop-class behaviour

Applies to web on a desktop, iPad with keyboard and pointer, and any large-screen Android device with them.

- Pointer text sizes and 32 controls (28 minimum). See `foundations/typography.md`.
- Every action has a keyboard path, shared shortcuts are the same in every app, and `?` lists them. See `foundations/input.md`.
- Hover states, tooltips with shortcuts, and context menus on right-click.
- Multiple windows or tabs of the same app, each with its own state. Drag and drop works between them.
- Sidebar, list and detail side by side when wide. Panels resize by dragging, with a keyboard alternative.
- Multiple selection with Shift and Command or Control.

## Ours versus the platform convention: which wins

| Topic | Web | iOS and iPadOS | Android |
|---|---|---|---|
| Colour, type roles, spacing, radius | Ours | Ours | Ours |
| Words, action names, menu order | Ours | Ours | Ours |
| Account context marker and switcher | Ours | Ours | Ours |
| Contrast and target minimums | Ours (stricter) | Ours (stricter) | Ours (stricter) |
| Typeface | System stack, then Inter | System (San Francisco) | Platform default or Inter |
| Back | Browser history | System edge swipe | System back and predictive back |
| App-level navigation in compact width | Our tab bar | System tab bar | Platform navigation bar |
| App-level navigation when wider | Our sidebar | System sidebar | Navigation rail, then our sidebar when wide |
| Glass and translucency | Ours, with solid fallback | System Liquid Glass | Not used; solid surfaces |
| Sheets, alerts, menus inside the product | Ours | System components, our tokens | Material components, our tokens |
| Share out, file and photo pickers, permissions | Browser | System | System |
| Date and time pickers | Ours | System | System |
| Appearance and accessibility settings | Browser first, then ours | System only | System only |
| Text scaling | Browser zoom and our text size setting | Dynamic Type | System font size |
| Motion curves | Our tokens | System springs | System motion |
| Haptics | None | System patterns | System effects |
| Icons | Ours | Ours, or mapped SF Symbols | Ours |
| App icon shape | Our tile | System mask and appearances | Adaptive and themed icon |
| System bars and safe areas | Browser | System | System, edge-to-edge |
| Toast position | Ours | Ours, above the tab bar | Above the navigation bar |

Where a row says the platform wins, a design that follows ours instead is a defect, not a preference.

Checked against Apple HIG: Motion, Dark Mode, Settings, Playing haptics, Multitasking, Going full screen, App icons, 2026-11-11. Checked against Android: System bars, Layout basics, 2026-11-11.
