# Admin and bulk actions

An administrator's action can change what hundreds of people can open. The Admin console must make the effect of every action visible before it happens, and make it easy to see afterwards who did what.

## When this applies

The Admin console (users, groups, devices, policies, audit, billing), and any bulk action on a selection elsewhere in the suite. The Admin console uses the same components, tokens and accent as every other app. It has no separate visual language.

## Tables

- Users, devices and audit entries are tables: sortable columns, a sticky header, a first column that names the row and never scrolls away.
- Each row opens a detail view with its own URL. Row actions are in a menu at the trailing end, in the same order on every table.
- Columns can be shown, hidden and reordered, and the choice is remembered. Density follows the pointer and touch size classes; there is no third, tighter size.
- Status is a tag with a word and an icon: "Active", "Invited", "Suspended". Never a coloured dot alone.
- Numbers use tabular figures. Dates show the viewer's time zone, and say so once in the column header.
- In compact width a table becomes a list of rows showing the name and the two most useful values; the rest is in the detail view.
- Long tables load more on demand and state the total: "Showing 100 of 1,240 users".

## Filtering

- Filters sit in a row above the table and appear as removable tokens. The same control as search filters; see `search.md`.
- The result count updates as filters change. "Clear all" is always present when any filter is on.
- Filter and sort state is part of the URL, so a view can be shared or bookmarked.
- No results says which filters are on and offers to remove them.

## Selection

- A checkbox column selects rows. The header checkbox selects the rows on screen and shows a mixed state when only some are selected.
- Selecting everything is a second, explicit step: "All 100 on this page are selected. Select all 1,240 that match." The count is always exact.
- A selection bar replaces the toolbar while anything is selected. It states the count, the available actions and a "Clear selection" control. See `../foundations/input.md`.
- Selection survives sorting and loading more, and is cleared by changing filters, with a message.
- Actions that do not apply to every selected row stay available and say how many they will apply to.

## Bulk actions

Every bulk action follows the same four steps.

| Step | What it shows |
|---|---|
| 1. Choose | The action, from the selection bar |
| 2. Preview | Exactly what will change: how many, which ones (a list that can be reviewed), and what each will lose or gain. Rows that will be skipped are listed with the reason |
| 3. Confirm | One button that repeats the verb and the number: "Suspend 12 users" |
| 4. Result | Progress while it runs, then a summary: how many succeeded, how many failed and why, with "Try again" for the failures only |

- The work runs in the background and the administrator can keep working. See `feedback-and-status.md`.
- Where the action can be reversed, the result offers Undo. Where it cannot, the preview says so before confirming.
- A bulk action never silently applies to rows that were not visible when it was chosen.

## Inviting people

- One invitation: email, role, and optionally groups. The button is "Send invite".
- Bulk invite accepts pasted addresses or an uploaded file. Every row is checked before anything is sent, and the preview lists valid rows, duplicates, people already in the organisation, and rows with errors, each with the fix.
- Nothing is sent until the administrator confirms the count: "Send 48 invites".
- The invitation states who invited, which organisation, and what the organisation will be able to manage. See `onboarding-and-accounts.md` and `email-and-documents.md`.
- Pending invitations are listed with their age, and can be sent again or withdrawn.
- If the plan's seat limit would be exceeded, say so before sending, with how many fit. See `plans-and-upgrades.md`.

## Suspending and removing

| Action | Reversible | The preview must state |
|---|---|---|
| Suspend | Yes | The person cannot sign in to the organisation. Their mail, files and shares stay as they are. Their personal account is not affected |
| Remove from organisation | Within a stated period, if policy allows | What happens to content they own, who it can be transferred to, which shares will stop, and when data is deleted |
| Delete data | No | Exactly what is deleted and that it cannot be recovered |

- Removing a person always offers to transfer what they own first. Transfer is the default choice.
- An administrator cannot remove or demote themselves if they are the last one with that role. The control is disabled with the reason.
- The affected person is told what happened and by which organisation. See `email-and-documents.md`.

## Roles

- Roles are named in plain words with a one-line description of what each can do. A "What can this role do?" view lists the permissions in full.
- Assigning a role shows the change before it is applied: what the person can do now, and what they will be able to do.
- Give the least access that does the job. No role is pre-selected above member.
- Granting an administrator role re-confirms the acting administrator's identity and says why. See `../foundations/privacy-and-trust.md`.

## Policy settings

- A policy states, next to its control, who it applies to and what members will see. Example: "Members cannot share files outside Northwind Studio. The option appears locked."
- A policy that removes something members have today is previewed with the number of people and items affected, and confirmed.
- Members see a locked setting with "Managed by <organisation>", never a hidden one. See `settings-and-help.md`.
- Policies apply to the organisation context only. Nothing in the Admin console changes a member's personal account, and the interface never suggests it can.
- Where a policy is inherited from a parent group, say where it comes from and link to it.

## Audit

- Every administrative action is recorded: who, what, on whom or what, when, and from where. Entries are written in plain sentences: "Lena Okafor suspended 12 users".
- The audit view is read-only. It filters by person, action, target and date, and exports what is shown.
- An entry links to the person or item it concerns, and for a bulk action lists every row it touched.
- Times show the viewer's time zone with the offset. Exports state the time zone they use.
- Administrators can see that an item was opened or shared where policy records it. Members are told what the organisation can see; see `../foundations/privacy-and-trust.md`.

## Destructive actions

- Follow `modality.md`: the title is a question, the body states the consequence, the destructive button is never the default.
- For an irreversible action on many people or much data, the dialog adds one deliberate step: typing the organisation's name or the count. This is the only place the system uses typed confirmation.
- Never combine a destructive action with another action in one button.

## Components used

Table, search field, token and chip field, checkbox, tag, menu, sheet, dialog, banner, toast, progress bar, people picker, avatar, empty state.

## States to design

Empty table, loading, no results, partial selection, all matching selected, preview with skipped rows, running, partly failed, undone, locked by policy, last administrator, seat limit reached, audit with no entries for a filter.

Not checked against an Apple page: the HIG has no admin or bulk-action topic. Written from this system's own rules.
