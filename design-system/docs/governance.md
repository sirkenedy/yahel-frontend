# Governance

How the system changes without drifting.

## Versioning

Semantic versioning on the system as a whole, recorded in `README.md` and `decisions.md`.

- **Patch**: a value tuned within a token; a doc clarified.
- **Minor**: new token, component, variant or pattern. Nothing existing breaks.
- **Major**: a token renamed or removed, a component's behaviour changed.

Until 1.0 the system is a proposal and minor versions may break. After 1.0, a removed token stays for one minor version marked deprecated.

## Proposing a change

1. State the problem with a real screen where the system fell short.
2. Check `decisions.md`; if it reverses a decision, say so.
3. Change tokens, docs and canvas together.
4. Run `node design-system/scripts/build-tokens.mjs`.
5. Add an entry to `decisions.md`.

A one-off value in product code is never the fix. Either the system has the answer, or the system changes.

## Definition of done for a component

A component is **Stable** only when all of these hold:

- [ ] Spec file written from the template in `components/README.md`.
- [ ] Uses semantic tokens only; no raw colours, sizes or durations.
- [ ] All states designed: default, hover, pressed, focused, disabled, loading, error, selected.
- [ ] Touch and pointer sizes; compact, regular and wide layouts.
- [ ] Light, dark, and increased contrast in both.
- [ ] Keyboard operable with visible focus; correct role and accessible name; screen-reader tested.
- [ ] Holds at 200% text and in a right-to-left language.
- [ ] Reduced motion and reduced transparency behaviour defined.
- [ ] Content guidance with examples.
- [ ] Shown on the review canvas.

## Definition of done for a screen

Before a product screen ships, check it against the experience principles in `principles.md` and:

- [ ] One primary action; no more than two prominent buttons.
- [ ] Loading, empty, error, offline and permission-denied states exist.
- [ ] Destructive actions are undoable or confirmed, never both silent and permanent.
- [ ] The current account context (personal or which organisation) is visible.
- [ ] Every string follows `foundations/writing.md`.
- [ ] Only system components and tokens are used.

## Staying current with Apple

Re-run the check in `hig-research.md` after WWDC each June and after the autumn OS releases. Record the date, what changed, and any resulting decision.
