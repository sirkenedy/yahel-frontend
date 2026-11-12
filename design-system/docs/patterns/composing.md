# Composing

Sending is the one action in a workspace that cannot be taken back once it has left. Composing must protect the draft, make the audience obvious, and leave a way back for as long as one exists.

## When this applies

New messages, replies and forwards in Mail; messages and threads in Chat; any comment or note field that sends to other people.

## The compose surface

- Mail: compose opens as a sheet in compact width and as a panel beside the list in regular and wide, so the person can still read other mail. It can be opened in its own window or tab. See `modality.md`.
- Chat: the field is always present at the foot of the conversation and grows with its content up to a limit, then scrolls.
- The account context the message will be sent from is shown on the surface. With more than one address, the From field is visible, not hidden.
- One prominent button: "Send". Everything else is secondary.

## Recipients

- Recipients are tokens in a people picker: search by name or address, with avatar, context and external marker. See `entering-data.md`.
- Several addresses can be pasted at once. An address that is not valid stays as a token marked with an icon and a message, and blocks sending until fixed or removed.
- To is shown first. Cc and Bcc appear on request, and stay shown once used.
- A group or list token states how many people it reaches, and can be expanded to review them.
- Suggestions come from the current account context first. A suggestion is never added without being selected.

## Drafts

- Drafts save automatically, on the device first and then to the account, with the state shown: "Saving", "Saved", "Offline, saved on this device". See `feedback-and-status.md`.
- There is no Save button. Closing the surface keeps the draft; nothing asks "Save changes?".
- "Discard draft" is explicit, sits away from Send, and offers Undo in a toast.
- A draft opened on another device continues where it stopped. If it was changed in two places, both versions are kept and shown.
- An unsent Chat message stays in its conversation's field when the person navigates away, with a draft marker on the conversation.

## Attachments

- Add by button, by drag and drop, and by paste. All three always work. See `files-and-storage.md`.
- Each attachment shows as a file tile with name, size and upload progress, and can be removed or retried on its own.
- A file too large to attach is offered as a link from Drive, with the reason. The person chooses; nothing is converted silently.
- Attaching from Drive asks whether to send a copy or a link. A link shows who will have access, and offers to share with recipients who lack it. See `sharing-and-collaboration.md`.
- Sending is held while an attachment is still uploading, and the button says why: "Uploading 1 file".
- If the message says something is attached and nothing is, ask once before sending.

### At the storage limit

Follow `plans-and-upgrades.md`; this pattern adds nothing to those rules, only where they show.

| Storage state | In compose |
|---|---|
| Getting full, almost full | Nothing in compose. The banner lives in Mail and Drive |
| An attachment would not fit | Said before upload starts, next to the attachment, with what would fit and the two standard actions: "Free up space", "Get more storage" |
| Full | The banner states exactly what is paused. Drafts already written stay readable, editable as text, and can be copied out. Compose never destroys or hides a draft because of storage |

The upgrade action is never the prominent button in compose.

## Sending and undoing

- Send takes effect at once in the interface, and a toast offers "Undo" for a period the person can set. Undo reopens the message exactly as it was, attachments included.
- The toast stays while focused or hovered and can be recalled. See `feedback-and-status.md`.
- Once the period ends the message has left. Say so honestly: there is no "recall" that pretends to delete delivered mail.
- If sending fails, the message stays in Outbox with the reason and "Try again". It is never lost and never sent twice.
- Offline, Send queues the message, marks it "Will send when online", and it can still be edited or cancelled.
- Chat messages can be edited and deleted after sending. Both leave a visible marker ("Edited", "Message deleted").
- In Chat, Enter sends and Shift Enter adds a line by default on pointer devices; a setting swaps them. On touch keyboards, Return adds a line and Send is a button.

## Scheduled send

- "Send later" sits in a menu next to Send. It offers a few sensible times and a date and time picker.
- The scheduled time is stated in the person's time zone, and in the recipient's when it is known and differs. See `scheduling.md`.
- Scheduled messages live in one place, show their send time, and can be edited, rescheduled or cancelled until they go.
- A scheduled message that cannot be sent (access removed, storage full, account suspended) notifies the person and stays as a draft.

## Reply safety

- Reply answers the sender. Reply all is a separate, equally reachable control, never the silent default.
- A reply states its audience next to the recipients: "Replying to 14 people".
- Replying to a message received by Bcc warns that reply all would reveal it.
- Reply to a list or a large group asks once, with the number, before sending.
- Forward does not carry attachments or earlier recipients silently: both are shown and can be removed.
- Quoted text is collapsed but can be opened and edited. What is sent is always what can be seen.

## External recipients

- A recipient outside the organisation is marked on their token as it is added, with an icon and the word "External".
- When any recipient is external, one notice appears above the recipients: "2 people outside Northwind Studio". It is not a dialog and does not block.
- If organisation policy forbids it, the token says so with the reason. See `admin-and-bulk-actions.md`.
- In Chat, a conversation that includes external people is labelled at the top for as long as it does.

## Formatting

- Formatting controls sit in one toolbar, hidden by default in compact width and opened by one control. Standard shortcuts always work.
- The set is small and the same in Mail and Chat: bold, italic, underline, strikethrough, link, lists, quote, code. Mail adds headings, alignment and text colour.
- Pasted text takes the message's style by default. "Paste with formatting" is offered, not imposed.
- Links show their real destination before sending and on hover after.
- A plain-text mode exists in Mail. Every message is sent with a plain-text alternative. See `email-and-documents.md`.

## Mentions

- Typing `@` opens a list of people who can be given access, filtered as the person types. Arrow keys move, Enter selects, Escape closes and leaves the text.
- A mention is a token with the person's name; it notifies them once, when the message is sent, not while it is being typed. A group mention states how many people will be notified.
- Mentioning someone who cannot see the conversation or file offers to add them, and says what they will be able to see. See `sharing-and-collaboration.md`.
- In Mail, a mention offers to add the person as a recipient.

## Components used

People picker, token and chip field, text area, rich text view, toolbar, file tile, file picker and drop zone, progress bar, toast, banner, menu, date and time pickers, save and sync indicator.

## States to design

Empty draft, saving, saved offline, conflict between two drafts, invalid recipient, external recipient, policy blocked, attachment uploading and failed, attachment too large, storage full, sending, undo available, failed in Outbox, queued offline, scheduled, edited, deleted.

Not checked against an Apple page: the HIG has no composing topic. Undo, drag and entering-data rules follow the pages checked 2026-11-11.
