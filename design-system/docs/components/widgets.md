# Home-screen widgets and live activities

Status: Specified

Native only. Nothing here is built until the iOS and Android apps exist; the spec fixes the rules in advance.

## Purpose

A widget shows a small amount of timely content from one app on the home screen or lock screen, and opens the app at that content. A live activity follows one event that has a clear start and end while it happens. Neither replaces the app or a notification. Planned: Calendar next event (widget) and Meet in progress (live activity). Any other needs a proposal.

## Anatomy

**Widget:** context marker (personal, or the organisation's name), main content, optional one or two actions, app identity supplied by the system.

**Live activity:** leading element (app glyph or avatar), status text, timer or progress, optional one or two actions. Shown in the system's compact, expanded and lock-screen presentations.

## Variants and sizes

| Item | Sizes | Content |
|---|---|---|
| Calendar next event | Small, medium, lock-screen | Small: next event and time. Medium: next two or three, and "Join" when the next has a call |
| Meet in progress | Compact, expanded, lock-screen | Call name, elapsed time, mute and leave |

- Sizes, margins and corner radii are the platform's. Content inside follows concentric nesting from `../foundations/layout-and-shape.md`.
- Every action is at least `target.touch`. A small widget is one target: the whole widget.
- Android uses the platform's app widgets and ongoing notifications with the same content rules.

## States

| State | Treatment |
|---|---|
| Default | Current content |
| Placeholder | Skeleton shapes in the final layout, shown by the system while content loads |
| Empty | "No more events today" |
| Signed out | "Sign in to see events"; opens sign-in |
| Stale | The last known content with its time; never a blank widget |
| Device locked, previews hidden | Titles are replaced by a generic line ("Event at 10:00") |
| Pressed | The platform's own press feedback |
| Ended (live activity) | Final state shown briefly ("Call ended"), then removed |

Hover, keyboard focus, disabled and selected follow the platform; widgets add nothing of their own.

## Tokens

- Colour: `color.bg.elevated` background where the platform allows one; `color.label.primary`, `color.label.secondary`; action `color.accent.default` on `color.accent.soft`; leave call `color.danger.text` on `color.danger.soft`.
- Identity: `app.calendar`, `app.meet` for the small app marker only, not as a background.
- Text: main line `type.headline`; supporting `type.subhead`; time `type.footnote` with tabular figures. Nothing below `type.caption-2`.
- Space: `space.16` padding; `space.8` between lines; `space.12` between actions.
- Shape: inner elements `radius.md`; outer shape from the platform.
- Motion: content changes use the platform's transitions; our durations do not apply.

## Behaviour

- Glanceable. Only what relates to the widget's one purpose. If it needs scrolling or more than two actions, it belongs in the app.
- Pressing opens the app at the exact event or call, in the right account context.
- Times and countdowns use the system's self-updating date and timer text, so they stay right between refreshes.
- The widget shows one account context, chosen when it is added, and always names it.
- Live activity: starts when the person joins a call, ends the moment they leave. It never runs for anything without a defined end, and never beyond the platform's limit of about eight hours.
- Alerts from a live activity only for something that needs action now. No promotion, no upgrade prompts, ever.
- People can turn live activities off in the app's settings as well as the system's.
- The app does not contain anything that imitates the widget.
- Right-to-left: layout mirrors; timers and clock times do not.
- Reduced motion and reduced transparency follow the system setting.

## Accessibility

- Each widget has one accessible summary ("Calendar, Northwind Studio. Design review at 10:00."), and each action is a named button.
- Works in the platform's rendering modes: full colour, tinted and monochrome lock-screen. Meaning never depends on a specific colour; the leave action has a word or glyph as well.
- Text scales with the system text size; lines are dropped before text is shrunk.
- Sensitive detail is hidden on a locked device unless the person has chosen to show previews.
- Increased contrast: uses the increased-contrast values of the same tokens.

## Content

| Good | Bad |
|---|---|
| "Design review, 10:00" | "You have an upcoming event" |
| "No more events today" | An empty widget |
| "Sign in to see events" | "Error" |
| "Join" | "Open Yahel" |
| "Call ended" | A live activity left on screen after the call |

Apple reference: Widgets, Live Activities, read 2026-11-11
