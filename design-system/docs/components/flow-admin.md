# Flow parts for an administrator's first sign-in

Status: Specified

Built in `@yahel/ui` as additions to `FlowCallout` (`tag`) and `FlowFacts.Item` (`icon`), the `shield` icon, and the touch target of a link inside a list of facts. Styles: `daylight.css`. Design source: `canvas/project/accounts/screens/admin/`. The rules of `flow-field.md`, `flow-step.md`, `flow-actions.md`, `flow-feedback.md`, `flow-sign-up.md` and `flow-business.md` apply unless changed here.

## Purpose

An administrator's first sign-in says, once, what being an administrator means, and asks for the passkey Admin requires. Both are drawn as cards the sign-up flows already have; these additions let them carry what the admin boards draw.

## Anatomy

- **Callout with a tag.** A callout whose title is followed by a short tag in a pill ("Passkey on this device · Required for admins"). The tag is read as part of the title.
- **Facts with drawn icons.** A list of facts in a card, each led by a few bold words, where each fact can carry its own decorative icon in place of the tick: a building for whose the address is, people for who is managed, an eye for who will see it, a shield for the agreement that applies.
- **Link inside a fact.** An agreement named inside a fact links to it, opens in a new tab and says so, as a link in small print does.

## Behaviour

- Icons are decorative and hidden from assistive technology: the words carry the meaning.
- A link inside a fact has the same enlarged target as a link in small print: block padding that does not move the lines of the sentence.

## Accessibility

- The tag is inside the title's element, separated by a space, so the title and the tag are read as one phrase.
- A link that opens a new tab says so in visually hidden text after its name.

## Content

- Facts lead with who or what: "amara@northwind.example belongs to Northwind Studio.", "Admins manage every account on northwind.example."
- A tag says what is required or recommended in three words or fewer: "Required for admins".

## Do and don't

| Do | Don't |
|---|---|
| Use a drawn icon only where the fact is better recognised by it than by a tick | Mix ticks and drawn icons in one list |
| Say "Required" only for what the server will require | Use a tag for anything the interface cannot stand behind |
