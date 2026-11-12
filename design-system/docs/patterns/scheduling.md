# Scheduling

An event is a promise about other people's time. Scheduling must be quick for one person and exact for many, across time zones.

## When this applies

Calendar on every platform, and anywhere a time is proposed or shown: Meet links, mail invitations, reminders, room booking, suggested times.

## Creating an event

- Two routes, always both. **Quick**: select a time in the grid and type a title; that is a complete event. **Full**: a sheet with every field.
- The quick route opens a small popover at the selected time with the title, time and "Create event". "More options" opens the full sheet with everything already typed kept.
- Defaults do the work: the calendar last used, the default duration, the person's time zone, their default reminder. Only the title is required.
- Field order in the full sheet: title, date and time, repeat, guests, location or room, call link, reminder, calendar, visibility, description.
- Dates and times can be typed or picked. Typed input is accepted flexibly ("3pm", "15:00"). See `entering-data.md`.
- End time cannot be before start time; changing the start moves the end to keep the duration.
- The button names the result: "Create event", or "Send invites" when there are guests.
- The calendar's account context is shown on the sheet. An event on an organisation calendar says so. See `onboarding-and-accounts.md`.

## Editing

- Opening an event shows it read-first; "Edit" switches to the same sheet used for creating.
- Small changes happen in place: drag to move, drag an edge to resize, with Undo in a toast.
- Changing an event with guests asks one question before saving: "Send an update to guests?" with "Send" and "Don't send". Changing only a private note or reminder never asks.
- Deleting an event with guests says who will be told. The organiser cancels; a guest removes it from their own calendar and declines.
- Unsaved changes are protected when the sheet closes. See `modality.md`.

## Recurring events

- Repeat offers plain choices first (daily, weekly on this weekday, monthly on this date, yearly), then "Custom". The rule is always written out in words: "Every 2 weeks on Tuesday, until 30 June".
- Editing or deleting a repeating event asks which events are meant. Always these three, in this order, with the same wording everywhere:

| Choice | Effect |
|---|---|
| This event | Only the selected occurrence changes and becomes an exception |
| This and following events | The series splits at this occurrence; earlier ones are untouched |
| All events | The whole series changes, including past occurrences; existing exceptions are kept and listed |

- "This event" is the default choice. The dialog is skipped only when the change cannot apply to a series.
- Changing the repeat rule itself offers only "This and following events" and "All events", and says why.
- An exception is marked in the event detail: "Changed from the series".

## Availability

- Adding guests shows whether each is free or busy at the chosen time, as a word and a shape, not colour alone.
- Only free or busy is shown for other people, never titles or details, unless they have shared them. External guests show "Availability not shared".
- "Find a time" lays guests' busy time side by side and suggests times when everyone required is free. A suggestion is applied only when the person selects it.
- Working hours and time off are respected in suggestions, and stated when a chosen time falls outside them: "Outside Amara's working hours".
- A conflict never blocks creating an event. It is stated, and the person decides.

## Time zones

- Every time is shown in the viewer's own time zone. When the organiser or a guest is in a different one, the event states both: "10:00 to 10:30 (Lagos) · 09:00 to 09:30 for Lena (London)".
- An event keeps the time zone it was created in. Travelling changes how it is displayed, not when it happens.
- The time zone field is hidden behind "Time zone" until needed, and shown automatically when guests differ.
- All-day events belong to a date, not a moment, and do not shift across time zones.
- A second time zone can be shown beside the grid. Changes to daylight saving time are marked on the day they happen.
- Zones are named by city and offset from the locale data, never by ambiguous abbreviations. See `../foundations/inclusion-and-localization.md`.

## Invitations and responses

- An invitation shows the organiser, the time in the viewer's time zone, the place or call link, the other guests if the organiser allows, and what responding will share. See `sharing-and-collaboration.md`.
- Three responses, always the same words: "Accept", "Maybe", "Decline". A note and a proposed new time are optional additions.
- For a repeating event, a response asks "This event" or "All events".
- The current response is always visible on the event and can be changed in one action.
- Unanswered invitations appear in the grid with a distinct outline style, never as accepted.
- The organiser sees responses as counts and names. Guests see them only if the organiser allows.
- External guests are labelled. Adding one shows the notice from `sharing-and-collaboration.md`.

## Reminders

- A reminder says what, when and where, and opens the event: "Design review in 10 minutes · Room Kivu".
- Defaults are set once per calendar; each event can override. "None" is always a choice.
- Only a reminder for an event starting within the hour may use the platform's time-sensitive level. See `feedback-and-status.md`.
- A reminder for a call includes "Join".

## Rooms and resources

- Rooms are picked from a list filtered to those free at the chosen time, with capacity, location and equipment in words.
- A room that becomes unavailable is stated on the event with one action to choose another. The booking is never dropped silently.
- A room that needs approval says so before saving, and shows "Awaiting approval" afterwards.
- Booking rules set by the organisation are explained where they apply, not just enforced.

## Drag, and its alternatives

- Drag in empty space to create, drag an event to move it, drag its edge to resize. Times snap to the grid step and the time is shown while dragging.
- A drag can be cancelled with Escape and undone after dropping.
- Every drag has a non-drag path: the full sheet for any change, and keyboard commands to move the selected event by one step or one day and to lengthen or shorten it.
- On touch, moving an event needs a long press first, so scrolling never moves anything.
- Arrow keys move through days and events; Enter opens; the shortcut list is under `?`. See `../foundations/input.md`.

## Views

- Day, week, month and schedule (a list). The choice is remembered. Today is one action away and always marked.
- First day of week, 12 or 24 hour time and date order come from the locale.
- Each calendar has a hue from the system set, plus its name in the event detail. Hue alone never identifies a calendar.
- The schedule view is the fully accessible equivalent of the grid: every event as a row, in order, with all the same actions.

## Components used

Date and time pickers, people picker, sheet, popover, dialog, segmented control, toast, banner, tag, avatar, menu, select and combo box, colour picker.

## States to design

Empty day, first-run calendar, overlapping events, all-day and multi-day events, pending invitation, declined, cancelled by organiser, exception in a series, conflict, guest in another time zone, room unavailable, awaiting approval, offline with a queued change, read-only shared calendar.

Not checked against an Apple page: the HIG has no scheduling topic. Drag rules follow Drag and drop, checked 2026-11-11.
