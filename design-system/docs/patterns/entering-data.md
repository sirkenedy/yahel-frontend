# Entering data

Typing is slow and error-prone. Ask for less, help more.

## Rules

- **Ask only for what is needed now.** Optional fields are marked "optional"; required is the default and unmarked.
- **Choose over type.** Offer pickers, suggestions and recent values. Pre-fill what is known and use sensible defaults.
- **Do not ask for what the system knows.** Language, region, time zone and theme are read from the device. Contacts, calendar and location are offered through a permission, not retyped.
- **Accept paste and drop.** Addresses, files, images and dates can be pasted or dropped into the field that takes them.
- **Secrets.** Passwords and codes use an obscured field with a show control. The product never fills a password field itself; the platform's password manager may.
- **One column.** Fields stack top to bottom in the order people think of them. Related short fields may share a row on wide layouts only.
- **Labels are always visible** above the field. Placeholder text is an example and never replaces the label. Help text sits under the field.
- **Right input for the job.** Correct keyboard and input type, autofill attributes, no blocked paste, formats accepted flexibly (spaces in phone numbers, any case in emails).

## Validation

- Validate when the person leaves a field, not on every keystroke; clear the error as soon as it is fixed. Rules shown in advance (password strength, a name already taken) are checked while typing, so the person sees progress rather than errors.
- Numeric fields accept only numbers and format them by locale.
- Show requirements before typing where they are strict (password rules).
- The error sits under its field, says what is wrong and how to fix it, has an icon as well as colour, and is announced to assistive technology.
- On submit with errors: keep everything entered, move focus to the first error, and summarise if the form is long.
- The primary button stays enabled; pressing it reveals what is missing. Disable only while submitting, with a progress label ("Saving"). Apple's guidance is to hold the button back until required fields are filled; we keep it enabled because a disabled button cannot say what is missing, and meet the same aim by naming and announcing the missing fields.

## Saving

- Settings and document content save automatically, with visible state.
- Forms that create something use an explicit primary button named for the result: "Create event", "Send invite".
- Leaving with unsaved input asks before discarding. Long inputs (mail, documents, chat messages) are kept as drafts automatically.

## Pickers

- Dates and times: type or pick; show the time zone when it matters; respect locale formats and first day of week.
- People: search by name or email, show avatar, context and external status, allow pasting several addresses.
- Files: the same picker in every app, opening in the current context, with recent items first.

## Multi-step

Use steps only when the task is long or later questions depend on earlier answers. Show progress, allow going back without losing input, and use "Continue" then "Done".

Checked against Apple HIG: Entering data, 2026-11-11.
