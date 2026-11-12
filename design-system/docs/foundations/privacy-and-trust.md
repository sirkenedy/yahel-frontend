# Privacy and trust

People put their mail, files and calendars here. The interface must make it obvious who can see what, and never surprise anyone. For this product, trust is a design foundation on the same level as colour.

## Always show the context

- The account control names the current context on every screen: Personal, or the organisation's name.
- Personal and organisation content are never mixed in one list without a marker on each item.
- When an action crosses a boundary (sharing a personal file with an organisation, moving organisation content out), say so before it happens.
- In a managed account, tell the person plainly that an administrator manages it and what that means, once at sign-in and always in account settings.

## Visibility of access

- Every shareable item shows who has access, in words: "Only you", "3 people", "Anyone at Northwind Studio".
- Public or link-based access gets a distinct, persistent marker.
- External people (outside the organisation) are labelled wherever they appear.
- Changing access shows the result before it is applied.

## Asking for data and permissions

- Ask only when the feature needs it, at the moment it is first used, with the reason in one sentence.
- Never ask at launch, unless the product cannot work at all without the answer.
- The reason is an active, specific sentence that says what is used and why: "Meet uses the microphone so other people in the call can hear you." Not "Microphone access is needed for a better experience".
- Ask for the narrowest access that does the job: the chosen photos or one file, not the whole library.
- If a screen of ours explains a request before the system's own permission prompt, it has one button that opens the prompt, labelled "Continue" and never "Allow", and no other way out. It never imitates the system prompt, shows a picture of it, or offers a reward for agreeing.
- Declining never breaks unrelated features.
- Camera and microphone in Meet show a live indicator while in use; recording requires visible notice to everyone.
- Never pre-select consent.

## Security moments

- Security prompts (new device, password change, recovery) are exact, calm and never use marketing tone.
- Destructive or sensitive actions re-confirm identity, and say why.
- Session and device lists use plain names ("Chrome on Windows, Lagos") and a single clear "Sign out" per item.
- Never display a full secret after creation; show it once with a copy action.
- A password alone is not enough for an account: passkeys first, otherwise a second factor. See `patterns/onboarding-and-accounts.md`.

## Data ownership

- People can export their data and delete their account from inside the product, with clear timing and a confirmation when it completes.
- Deletion explains what happens to shared items and any paid plan first.
- Trash and retention periods are stated wherever content is deleted.
- Where work can be done on the device with the same result, it is done there and the data is not sent elsewhere.
- Respect the platform's own privacy features (private relay addresses, mail privacy protection, tracking controls). Never work around them.

## Honest business

- Free means free: no feature that worked yesterday is silently removed.
- Reaching a storage limit never blocks reading or exporting existing data. See `patterns/plans-and-upgrades.md`.
- Prices, billing dates and how to cancel are visible before purchase and in settings.

Checked against Apple HIG: Privacy, 2026-11-11.
