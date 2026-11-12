# Navigation

## Structure

Three levels, the same in every app:

1. **Suite**: which app. The app launcher (grid button on web, Home on mobile).
2. **App**: which section. A tab bar in compact width, a sidebar in regular and wide.
3. **Content**: which item. List to detail; side by side when wide, pushed when compact.

The account control sits in the same corner in every app and names the current context.

## Rules

- **Tab bar** (compact): navigation only, never actions. Three to five tabs, single-word labels, filled icon for the selected tab. Always visible except behind a modal. Never disable or hide a tab. Search may be the trailing tab. The bar floats on the thin material and may shrink while content scrolls.
- **Sidebar** (regular, wide): at most two levels; group labels are short. The person can hide it; it is not hidden by default. The same destinations as the tab bar, in the same order.
- **One primary action per screen** (compose, new, upload) in a consistent place: a prominent button at the top of the sidebar when wide, a floating button above the tab bar when compact.
- **Back** always returns to where the person was, with scroll position and selection restored.
- **Titles** name the place. A large title at the top of a root view collapses into the bar on scroll.
- **Deep links** open the exact item in the right account context; if the person lacks access, say which account has it and offer to switch.
- **Switching apps** keeps each app's state. Opening a Drive file from Mail returns to the same message.

Platform differences (Android uses its own navigation bar on a solid surface; iPad places tabs at the top) are in `../platforms.md`.

## Launching

- Show real content or its skeleton immediately; no splash beyond the platform launch screen.
- The platform launch screen looks like the first screen without its content: same background and bars, matching the current theme and orientation. No text, logo or advertising.
- Restore the last place and state. Never greet a returning person with onboarding.
- Do not ask for sign-in, permissions, ratings or upgrades at launch unless the task needs them.

## Windows and multitasking

- Web: every item has its own URL; opening in a new tab or window always works.
- Tablet and desktop: layouts respond to any window size by size class, not device type.
- Drafts and edits survive being backgrounded, a lost connection or a closed tab.
- Tasks the person started (upload, send, export, save) finish in the background after they switch away.
- Media that needs attention (a video or audio preview, a slideshow) pauses when the person switches away and resumes where it stopped. A Meet call does not pause.
- Never interfere with the platform's own window, split view or app switching controls.
- Meet keeps a call visible (picture-in-picture or a persistent bar) when the person navigates elsewhere.

## Full screen

Used for focused work: presenting Slides, a Meet call, reading a document. Controls fade when idle and return on any input. Escape or an always-visible control exits.

- The person chooses when to enter and when to leave. Full screen never starts on its own, and does not end on its own when a video or presentation finishes.
- Everything needed to finish the task stays reachable. Nobody has to leave full screen to mute, advance a slide or reply.
- System gestures and the system's Dock or taskbar stay available.
- Leaving and coming back resumes at the same place.

Checked against Apple HIG: Launching, Multitasking, Going full screen, 2026-11-11.
