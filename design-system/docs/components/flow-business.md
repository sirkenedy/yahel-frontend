# Flow parts for creating a workspace

Status: Specified

Built in `@yahel/ui` as `FlowChips` and `FlowChip`, `PlanCard`, `OrderSummary` (`Item`, with an `amount` or a green `badge` such as "Free for 14 days", `Schedule`, `Charge`, `Note`, `Total`), `PaymentCardChip`, `FlowPreview`, and as additions to `Choice` (`tag`, `meta`), `Receipt.Row` (`detail`) and `FlowStep` (`Subheading`, `Group`, `Split`, `Row layout="halves"`). Styles: `daylight.css`. Design source: `canvas/project/accounts/screens/business/`. The rules of `flow-field.md`, `flow-step.md`, `flow-actions.md`, `flow-feedback.md` and `flow-sign-up.md` apply unless changed here.

## Purpose

Creating a workspace adds three things the account flows did not have: a few short answers to pick from, something for sale, and an order to check before paying. These parts cover them. Use them only in account flows.

## Anatomy

- **Chips.** A visible label and a row of pills, exactly one chosen ("Just me", "2–9", "10–99"): the chosen one has the accent outline and tint of a chosen choice. A pill can carry a badge ("Save 16%"). Laid out as separate pills that wrap, `compact` for a run of numbers, or `segmented`: two or three in one track, for a switch such as monthly or yearly. The label can be hidden when the control's purpose is plain from where it sits; it is still read out.
- **Choice with a tag and an amount.** A choice card with a short tag after its words ("Best match") and an amount at the far side ("₦18,500 a year"), before the radio mark. Used for a list of things with a price each.
- **Plan card.** The plan's name (with an optional badge), its price in the display face with what the price is for under it, a struck-through earlier price when discounted, and a two-column ticked list of what is included (one column when narrow). Controls that belong to the plan sit at the foot.
- **Order summary.** A card with a heading and, beside it, the way to change the order. Then lines: a thing bought with a line of explanation and, when it has one, its price; a schedule of what is charged and when ("Today · Free trial starts · ₦0"); a note in small print; and a total on a tinted band ("Due today ₦18,500 + VAT").
- **Receipt detail.** A second, quieter line under an answer on the review ("10–99 people · Nigeria").
- **Subheading and split.** A step that asks for several things names each group with a second-level heading ("Card details"). When something must stay in view while the step is filled in (the order summary), the step is split: on a screen 1024 px wide or more it widens to two columns and the aside stays in view; narrower, it is one column in the order lead, aside, rest. Two short fields that belong together (expiry and security code) stay side by side on any screen (`halves`). Fields that appear only on a choice, such as the card's billing address when it is not the business address, sit in a `Group`: a card of their own with a title and a line saying what they are for, named as a group for assistive technology.
- **Preview.** A card that shows what something will look like once it exists: a small label, an optional tag at the far side ("Your domain"), and the value in the display face with its important part in the link colour ("you@**northwind.example**"). Not translated.
- **Card chip.** A small pill that names the card being paid with: its network and last four digits ("Visa •• 4081").

## Behaviour

- Chips are native radios drawn as pills: one tab stop for the group, arrow keys move the choice, Space chooses. The whole pill is the target.
- The plan card is not a control. Choosing how to pay is done with chips beside it.
- Every amount reaches these parts already formatted. They never do sums, and never format money: the app formats with `Intl.NumberFormat` from an amount and a currency the server supplies.
- The total is announced, whole, whenever it changes, because a choice elsewhere on the screen (how many people) changes it.
- The card chip never shows more of a card number than its last four digits.

## Accessibility

- Chips: `role="radiogroup"` named by the label; each pill's name includes its badge. Touch target 44 px.
- A choice's name is its words, then its tag, then its amount.
- Plan card and order summary are groups named by their heading; the schedule is a named ordered list. A struck-through price is preceded by hidden words ("Was").
- The total has `aria-live="polite"` and `aria-atomic`, and no status role, so it does not compete with a step's own status.
- The card chip's dots are hidden from assistive technology, which is told "Visa card ending in 4081".

## Do and do not

- Do keep a chip's words to one or two.
- Do not use chips for more than about a dozen answers, or for answers that need explaining: use choices.
- Do not put a price in a component's code. Prices and plan names come from the server.
- Do not show a card number, an expiry date or a security code anywhere outside the field that takes it.
