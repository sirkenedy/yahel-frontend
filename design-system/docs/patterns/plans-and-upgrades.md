# Plans and upgrades

Personal accounts are free up to a storage limit; beyond that, people upgrade. Organisations pay per plan. How this is handled decides whether people trust the product. Amounts, prices and thresholds below were decided in D-5 and D-8 (`../decisions.md`); prices still need checking against real storage cost before launch.

## Plans

| Plan | Storage | Price |
|---|---|---|
| Free | 15 GB | Free |
| Plus | 100 GB | 1.99 USD a month |
| Max | 2 TB | 9.99 USD a month |

Storage is shared across Mail, Drive and the editors. Annual billing costs ten months. Organisation plans are priced separately and are not part of this table.

## Principles

1. **Free is complete.** A free personal account is a real product, not a trial. Nothing nags.
2. **No surprises.** People always know how much they have used, long before a limit matters.
3. **Their data is theirs.** Reaching a limit never blocks reading, downloading, exporting or deleting existing content.
4. **Honest offers.** An upgrade prompt states a fact and a price. No countdowns, shaming or pre-selected expensive options.

## Storage visibility

- A storage meter lives in account settings and at the foot of the Drive and Mail sidebars: used, total, and a breakdown by app.
- The meter is segmented by app hue with a text legend, so it does not rely on colour.
- "Get more storage" is one tinted button next to the meter. It is never the primary action of a screen the person came to for something else.

## Approaching the limit

| State | Trigger | Treatment |
|---|---|---|
| Normal | More than the amounts below | Meter only |
| Getting full | Space left is at most 20% of the plan or 20 GB, whichever is smaller (Free: 3 GB left) | Meter turns to the warning colour with a "Getting full" label; one dismissible banner in Drive, shown once |
| Almost full | Space left is at most 5% of the plan or 5 GB, whichever is smaller (Free: 750 MB left) | Persistent but quiet banner in Drive and Mail with what will stop working and two actions: "Free up space", "Get more storage" |
| Full | Limit reached | Banner in the danger colour. Uploads, new files and incoming mail are paused, and the banner says so exactly. Everything existing stays readable, downloadable and deletable |

Email notices mirror the in-product states, at most once per state.

## Free up space

Always offered beside the upgrade. It shows the largest files, items in Trash and large attachments, with sizes, so people can solve the problem without paying.

## Upgrade flow

- One short sheet: the plans side by side, what each adds in plain numbers, price per period with tax treatment stated, and the billing date.
- The current plan is marked. The recommended plan is the smallest one that solves the person's problem.
- One prominent button: "Upgrade to <plan>". Payment uses the platform's standard method.
- Confirmation states what changed and when the next charge is.
- Downgrading and cancelling are in the same place as upgrading, take the same number of steps, and explain what happens to data above the lower limit.

## Organisation plans

- Only administrators see organisation billing. Members who hit an organisation limit are told to contact their administrator, by name where policy allows.
- Personal upgrades never apply to organisation content and the interface never suggests they do.
- Features unavailable on the organisation's plan are shown to administrators with what they add; members see them only if they can request them.
