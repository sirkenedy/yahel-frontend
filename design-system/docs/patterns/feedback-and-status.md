# Feedback and status

Every action gets a response, every wait gets an explanation, every mistake has a way back.

## Choosing the channel

| Situation | Use | Not |
|---|---|---|
| Result of an action the person just took | Inline change, or a toast with Undo | A dialog |
| Problem with a specific field or item | Message next to it | A toast or banner |
| Condition affecting the whole view (offline, read-only, over storage) | Banner at the top of the view | Repeated toasts |
| Must decide before continuing; risk of unexpected, permanent loss | Dialog | A toast |
| Something happened elsewhere (new mail, a mention) | Badge and notification | An interruption |

Feedback is never colour alone: pair it with an icon and words, and on mobile a haptic where appropriate.

## Response times

- Under 100 ms: show the pressed state.
- Up to 1 second: no indicator; the result appears.
- 1 to 10 seconds: a spinner or skeleton in place, and the control that started it shows progress and cannot be triggered twice.
- Over 10 seconds: determinate progress with what is happening, running in the background so the person can continue, with a notification on completion if the person has moved away. Routine or secondary tasks finish quietly.

## Loading

- Show the layout at once with skeletons shaped like the content. Never a blank screen or a full-screen spinner.
- Keep already-loaded content visible while refreshing.
- Optimistic updates for common actions (star, archive, rename): apply immediately, roll back with a message if the server refuses.

## Empty states

One sentence on what belongs here and one action to add it. First-use empty states teach; "no results" states suggest a fix (clear filters, check spelling); cleared states (inbox zero) simply confirm.

## Errors

- Prevent first: disable impossible actions with the reason, validate early, offer sensible defaults.
- Say what happened and what to do, next to where it happened. Keep what the person typed.
- Offer "Try again" when a retry can work. Give a reference code only as secondary detail for support.
- Permission errors say which account has access and how to request it.

## Offline and sync

- A persistent, quiet indicator when offline. Reading and drafting continue.
- Changes made offline are queued, marked as pending and sent on reconnection.
- Document save state is always visible: "Saving", "Saved", "Offline, changes saved on this device".
- Conflicts are shown with both versions; nothing is overwritten silently.

## Undo and redo

- Prefer undo to confirmation. Delete, archive, move and send offer Undo in a toast for at least 5 seconds; the toast stays while focused or hovered.
- Editors keep a full undo history with the standard shortcuts.
- Undo says what it will undo: "Undo move", "Undo delete", in the toast, the menu item and the tooltip.
- The result of an undo or redo is shown. If the restored item is out of view, scroll to it or highlight it, so nobody repeats the undo thinking it failed.
- Undo is not limited to one step. People can step back through everything since they opened the item; version history covers larger reversions.
- Undo and redo are reached the platform's way (shortcuts, the Edit menu, system gestures). Dedicated buttons appear only in editors, in the toolbar.
- Confirm only when an action cannot be undone and the loss would be unexpected. The confirm button repeats the verb and the safe choice is the default.

## Notifications

- Each notification says who, what and where, names its account context, and opens the exact item.
- People control notifications per app and per type, with a single place to pause everything.
- Badges are for things that need the person's attention, not for promotion.
- Group related notifications. Never send one for something the person just did themselves.
- Urgency is stated honestly. Only events happening now or within the hour (a meeting starting, an incoming call, a security alert on the account) may use the platform's time-sensitive level and break through Focus or Do Not Disturb.
- No promotional notifications unless the person has explicitly opted in, through a setting that is off by default and can be changed in the product. A promotional notification never uses an urgent level.

## Haptics and sound (mobile)

- Light haptic for a successful toggle or selection, a distinct pattern for success, warning and error. Follow the platform's standard patterns.
- Never the only signal, never for decoration, always subject to the system settings.
- Use each system pattern only for its documented meaning (success, warning, error, selection, impact). If none fits, play nothing rather than borrow one.
- The same event gives the same haptic in every app. Keep haptics short and occasional; one on every tap stops meaning anything.
- Haptics can be turned off, and nothing depends on them.
- No haptics while the microphone or camera is in use (a Meet call, recording a voice message), where the vibration would be picked up.

## Time limits

Avoid anything that disappears on a timer if it holds information or an action. Toasts with an action can be recalled; sessions warn before expiring and can be extended.

Checked against Apple HIG: Managing notifications, Undo and redo, Playing haptics, Multitasking (notifications), 2026-11-11.
