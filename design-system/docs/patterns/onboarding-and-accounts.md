# Onboarding and accounts

## Signing up and signing in

- Ask for the minimum: an email first. The email's domain decides the context (personal or an organisation), and the next step says which, by name.
- Prefer passkeys; then password with a second factor. Name the method on the button: "Sign in with a passkey". Offer only methods available on this device.
- Organisation sign-in through single sign-on shows the organisation's name and logo before redirecting.
- Errors are specific without leaking whether an account exists.
- Password rules are shown before typing, and checked as the person types.

## Creating an account

Canvas: `canvas/project/accounts/`.

- "Create account" asks one thing first: **For myself** or **For work or my business**. The other kind can be added later under the same sign-in.
- One question per screen. Back is always available and nothing typed is lost. A progress bar shows position; a review screen comes before anything is created.
- **For myself:** name, date of birth (one field, with the reason), address (a new Yahel address, or a current email), password, recovery phone (optional, skippable), review, ready.
- **For work:** business name, size and country; the person's name and current email; the business domain; administrator username on that domain and password; review; ready. Proving ownership of the domain comes after setup, not before.
- The ready screen lists what to do next and opens the product. No tour.
- A step moves 32 px in the direction of travel: out 180 ms, in 420 ms. With reduced motion it cross-fades.

## One sign-in for every address

- Each product has its own address (`mail.`, `drive.` and so on). A password is typed in one place only: the accounts address.
- A product opened without a session sends the person to the accounts address with where to return, and they land back where they started.
- Once signed in, every other product opens without asking again. Signing out says which account and applies everywhere.

## First run

- Land in the product with useful defaults; no tour before first use.
- Teach in context: one tip at the moment a feature is first relevant, dismissible, never repeated once dismissed, findable later in Help.
- Postpone optional setup (profile photo, import, notification preferences). A quiet checklist may offer it.
- Ask for a permission when the feature that needs it is first used, with the reason.
- Never ask for a rating or an upgrade during onboarding.

## Personal and organisation context

- One identity can hold a personal account and memberships in organisations. The account switcher lists them; people are circles, organisations rounded squares.
- The current context is visible on every screen and changes nothing else about the layout.
- Switching context is instant, keeps the current app, and never signs the person out of the other.
- A managed account says so: "Managed by Northwind Studio". Settings an administrator controls are shown as locked with that explanation, not hidden.
- Content never moves between contexts silently. Copying or moving across says where it is going and who will then have access.
- Notifications name the context they belong to.

## Invitations and joining an organisation

- An invitation states who invited, which organisation, and what the organisation will be able to manage.
- Accepting shows the result: the new context appears in the switcher.
- Leaving or being removed explains what happens to content the person created there.

## Account management

- Profile, security, devices and sessions, data export and deletion are in one place, reachable from the account control.
- Sign out is always available and says which account.
- Deleting an account is possible in the product, explains what is lost and when, covers any paid plan, offers immediate or scheduled deletion, and confirms when complete.
- Sensitive changes (password, recovery, deletion) re-confirm identity and send a notice to the account's contact methods.
