# Sign-in, single sign-on and consent screens

Status: Specified

## Purpose

These screens identify the person, hand off to an organisation's single sign-on, and ask for consent before an app or organisation gets access to data. They are the first thing people see and the place trust is set, so they are exact and calm. Rules come from `../patterns/onboarding-and-accounts.md` and `../foundations/privacy-and-trust.md`.

## Anatomy

- **Product mark.** Small, at the top.
- **Title.** Names the step.
- **Context line.** Which account or organisation this step is for, by name, with avatar (circle for a person, rounded square for an organisation).
- **Body.** One field, or one list of choices, or the consent list.
- **Primary button.** One per screen.
- **Secondary actions.** Plain buttons: "Use another account", "Try another way", "Cancel".
- **Footer.** Help, privacy, language.

## Variants and sizes

| Screen | Content |
|---|---|
| Identifier | One email field and "Continue". The domain decides the context; the next screen names it |
| Method | "Sign in with a passkey" first, then password and second factor. Only methods available on this device |
| Single sign-on handoff | The organisation's name and logo, where the person is being sent, and "Continue to <organisation>" before any redirect |
| Second factor | One code field; paste allowed; "Try another way" |
| Account chooser | Signed-in accounts as rows, plus "Use another account" |
| Consent | Who is asking, what they will be able to see or do as a plain list, and "Allow" and "Cancel" at equal size |
| Managed account notice | Shown once: "Managed by Northwind Studio", and what the administrator can manage |

- One column. Compact: full screen with `margin.compact` gutters. Regular and wide: a centred card. Token: `size.layer-sm` — maximum width of the card, shared with dialogs.
- Controls: `target.touch` on touch, `target.pointer` on pointer; fields and buttons full width of the column.

## States

| State | Treatment |
|---|---|
| Default | Focus in the first field |
| Hover, pressed, keyboard focus, disabled | As Button and `text-field.md` |
| Loading | The primary button shows a spinner and "Signing in"; fields are read-only; no second submit |
| Error | Under the field, with an icon; the typed value is kept. Never reveals whether an account exists |
| Locked or rate-limited | Says when to try again |
| Session expired | Says so, keeps the destination, and returns there after sign-in |
| Redirecting | Names the destination; a "Cancel" path remains |
| Selected (account chooser) | The current account carries a check and "Signed in" |

## Tokens

- Surface: page `color.bg.grouped`; card `color.bg.elevated`, `radius.xl`, `elevation.1`. No glass.
- Colour: primary button `color.label.on-accent` on `color.accent.solid`; secondary `color.accent.default`; context line `color.label.secondary`; error `color.danger.text`; managed notice `color.label.primary` on `color.bg.sunken`.
- Text: title `type.title-2`; body `type.body`; context and help `type.subhead`; footer `type.footnote`.
- Space: `space.32` card padding (`space.24` in compact); `space.24` between title block and body; `space.16` between fields; `space.12` between buttons.
- Motion: step change `duration.standard` with `easing.standard`; error `duration.quick`.

## Behaviour

- One question per screen. Email first; nothing else is asked until the context is known.
- Password rules are shown before typing and checked as the person types. Paste and password managers always work; autofill attributes are set on every field.
- Enter activates the primary button. Back returns to the previous step with its value kept.
- Single sign-on never redirects without first naming the organisation. Returning from it lands on the destination, not a generic home.
- Consent: nothing is pre-selected. Each permission is one plain line. "Cancel" is as easy to reach as "Allow" and declining never breaks unrelated features. Consent can be reviewed and withdrawn later in account settings, and the screen says so.
- Sensitive changes ask for identity again and say why.
- No marketing, ratings or upgrade prompts on any of these screens.
- Right-to-left: layout mirrors; email, codes and passwords stay left-to-right.
- Reduced motion: steps cross-fade.

## Accessibility

- Each screen has one `h1`, the title. Fields have visible labels and the correct `autocomplete` values (`username`, `current-password`, `one-time-code`, `webauthn`).
- Errors are linked to their field, announced on appearance, and focus moves to the field.
- No time limit on entering a code without a way to request another. No puzzle that depends on sight or hearing alone.
- The page title names the step and the product.
- Increased contrast: card gains a `border.hairline` outline in `color.separator.opaque`.
- Reduced transparency: no change. At 200% text the card becomes full width and scrolls.

## Content

| Good | Bad |
|---|---|
| "Sign in with a passkey" | "Continue" on a screen with three methods |
| "Continue to Northwind Studio" | "Redirecting..." with no name |
| "That email or password isn't right. Try again, or reset the password." | "No account found for lena@northwind.example" |
| "Planner will be able to: view calendars, create events" | "Planner wants full access" |
| "Managed by Northwind Studio. An administrator can reset the password and manage devices." | "This is a corporate account" |

Apple reference: Managing accounts, read 2026-11-11
