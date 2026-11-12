# Audio and video

A call puts a person's face, voice and surroundings in front of other people. Nothing about what is being captured, sent or recorded may be unclear.

## When this applies

Meet calls on every platform, voice messages in Chat, and audio or video previewed in Drive, Mail attachments and Chat.

## Before joining

- A pre-join check comes before every call: the person's own camera preview, a live microphone level, the chosen devices, and who is already in the call.
- Camera and microphone start in the state the person last chose, and the join button says it: "Join with camera off". Nothing is sent until the person joins.
- Recording, live captions or transcription already running are stated before joining. See `sharing-and-collaboration.md`.
- Device permissions are asked for here, when first needed, with the reason. Declining still lets the person join to listen and watch. See `../foundations/privacy-and-trust.md`.
- A missing or blocked device is named with the fix: "Microphone blocked. Allow it in browser settings."

## In-call controls

- One control bar, in the same order on every platform: microphone, camera, captions, share screen, more, then Leave at the trailing end, set apart from the rest.
- The bar floats on the clear material over video, with the dim layer when the video is bright, and uses label colours, not the accent. See `../foundations/depth-and-motion.md`.
- Controls fade when idle and return on any input. They never fade while a menu is open, while focus is inside the bar, or when the person has turned fading off.
- Space plays and pauses in previews and is push-to-talk while muted in a call. Mute and camera each have one shortcut, the same on every platform and listed under `?`.

## Mute and camera state

| State | Shown as |
|---|---|
| Microphone on | Plain icon, label "Mute", a live level so the person can see they are heard |
| Microphone off | Struck-through icon on a filled background, label "Unmute", and the same mark on the person's own tile |
| Speaking while muted | A brief message next to the control: "You're muted". Never unmute automatically |
| Camera off | Struck-through icon; the tile shows the avatar and name |
| Muted by a host | Says who did it. A host can mute someone; nobody can unmute or start the camera of another person |

State is always icon, shape and words together, never colour alone. The label names what pressing will do; the icon shows the current state. The system's own camera and microphone indicators are never hidden or imitated.

## Captions

- Captions are available in every call and for every video with speech, and one control turns them on. The choice is remembered.
- Captions name the speaker, sit on a solid scrim, follow the person's text size, and never cover the control bar or the active speaker's face.
- Turning on captions for oneself does not record anything and is not announced to others. A saved transcript counts as recording and follows the rules below.

## Recording

- Starting a recording tells everyone before capture begins, in words and sound, and names who started it.
- A persistent indicator stays visible to every participant for the whole recording: a danger-coloured dot with the word "Recording". It is not dismissible and never fades with the controls.
- Anyone joining during a recording is told before they enter, and can choose not to join.
- Stopping is announced too. Afterwards, everyone is told where the recording is kept and who can open it.
- Organisation policy may limit who can record. A locked control says "Managed by <organisation>".

## Sharing a screen

- Choosing what to share (a window, a tab, the whole screen) always shows a preview first. Sharing a single window is offered before the whole screen.
- While sharing, a persistent bar says "You are sharing <name>" with a Stop button, visible even when Meet is behind other windows.
- Notifications are held back while the whole screen is shared, or the person is told that they will be visible.
- Shared content keeps its aspect ratio and is never cropped. Viewers can zoom and can pin either the content or the speaker.

## Picture-in-picture and leaving the view

- Navigating away from the call keeps it visible: picture-in-picture where the platform has it, otherwise a persistent call bar with mute and Leave. See `navigation.md`.
- Returning to the call takes one action. Full screen is entered and left by the person, never automatically.
- A call does not pause when the person switches away. A media preview does, and resumes where it stopped.
- Audio from two sources never mixes: starting a preview during a call is blocked with the reason, and a preview stops when a call is joined.

## Poor connection

| Condition | Treatment |
|---|---|
| Own connection weak | Quiet indicator on the person's own tile; video quality lowers before audio does |
| Someone else's weak | Indicator on their tile only |
| Video cannot be sustained | Camera turned off with a message and one action to turn it back on |
| Connection lost | "Reconnecting" over the call, which stays open; reconnection is automatic and rejoins with the same mute and camera state |
| Cannot reconnect | Says so plainly and offers "Rejoin" and audio-only or dial-in where available |

## Leaving

- "Leave" leaves at once, with no confirmation. A host also sees "End call for everyone", which is a separate, confirmed action.
- After leaving, a short screen offers "Rejoin" and nothing else that interrupts. No rating request on every call; see `settings-and-help.md`.
- Camera and microphone are released the moment the person leaves, and the system indicators go out.

## Voice messages in Chat

- Recording starts on an explicit action and shows elapsed time and a live level. It can be cancelled, and reviewed before sending.
- Press-and-hold to record always has a tap-to-start, tap-to-stop alternative.
- Playback shows length and progress, can be scrubbed, and offers speed control. A transcript is offered where available, labelled as generated; see `ai-assistance.md`.
- Playback follows the device: silent mode and system volume are respected, audio moves to headphones when connected and pauses when they are removed, and a call or another app's audio interrupts it.

## Media preview in Drive

- Native builds use the platform's own video and audio player. On web, the player follows the browser's standard behaviour and keyboard controls.
- Nothing plays automatically with sound. Video keeps its original aspect ratio and is never stretched or cropped to fill.
- Captions and subtitle tracks in the file are offered. Controls are play or pause, scrub, volume, captions, speed, picture-in-picture and full screen, in that order.
- Never change the system volume. Reopening a file resumes at the last position without asking.

## Components used

Toolbar, button (icon-only with state), banner, toast, tag, avatar, presence indicator, sheet, menu, tooltip, progress bar.

## States to design

Pre-join with no devices, permission denied, joining, alone in the call, active speaker, muted by host, recording (as starter and as participant), sharing, being shared to, captions on, picture-in-picture, weak connection, reconnecting, call ended, voice message recording and failed to send, preview loading and unsupported.

Checked against Apple HIG: Playing video, Playing audio, Going full screen, SharePlay (picture-in-picture and joining only), 2026-11-11.
