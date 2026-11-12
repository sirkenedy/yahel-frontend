# Coverage against Apple's HIG

Every topic in Apple's Human Interface Guidelines (list read 2026-11-11), and where our system answers it. This is the completeness check: a topic is either covered, planned, or explicitly not applicable with a reason.

Status: **Guideline** = rules written. **N/A** = does not apply to this product. Written is not the same as proven: see `research-plan.md`.

## Foundations (18)

| HIG topic | Ours | Status |
|---|---|---|
| Accessibility | `foundations/accessibility.md` | Guideline |
| App icons | `foundations/iconography.md`, `assets/app-icons/` | Guideline; icons drawn |
| Branding | `foundations/imagery-and-branding.md`, `assets/logo/` | Guideline; name and mark decided (D-4) |
| Color | `foundations/color.md`, `tokens/` | Guideline |
| Dark Mode | `foundations/color.md`, `tokens/semantic.dark.json` | Guideline |
| Icons | `foundations/iconography.md`, `assets/icons/` | Guideline; family chosen (D-2) |
| Images | `foundations/imagery-and-branding.md`, `foundations/illustration.md` | Guideline; no illustrations drawn |
| Immersive experiences | | N/A: no spatial or VR product |
| Inclusion | `foundations/inclusion-and-localization.md` | Guideline |
| Layout | `foundations/layout-and-shape.md` | Guideline |
| Materials | `foundations/depth-and-motion.md` | Guideline |
| Motion | `foundations/depth-and-motion.md` | Guideline |
| Privacy | `foundations/privacy-and-trust.md` | Guideline |
| Right to left | `foundations/inclusion-and-localization.md` | Guideline |
| SF Symbols | `foundations/iconography.md` | Not used off Apple platforms (licence) |
| Spatial layout | | N/A: visionOS only |
| Typography | `foundations/typography.md` | Guideline |
| Writing | `foundations/writing.md` | Guideline |

## Patterns (25)

| HIG topic | Ours | Status |
|---|---|---|
| Charting data | `foundations/data-visualisation.md`, `components/chart.md` | Guideline |
| Collaboration and sharing | `patterns/sharing-and-collaboration.md` | Guideline |
| Drag and drop | `patterns/files-and-storage.md` | Guideline |
| Entering data | `patterns/entering-data.md` | Guideline |
| Feedback | `patterns/feedback-and-status.md` | Guideline |
| File management | `patterns/files-and-storage.md` | Guideline |
| Going full screen | `patterns/navigation.md` | Guideline |
| Launching | `patterns/navigation.md` | Guideline |
| Live-viewing apps | | N/A: Apple TV broadcast apps |
| Loading | `patterns/feedback-and-status.md` | Guideline |
| Managing accounts | `patterns/onboarding-and-accounts.md` | Guideline |
| Managing notifications | `patterns/feedback-and-status.md` | Guideline |
| Modality | `patterns/modality.md` | Guideline |
| Multitasking | `patterns/navigation.md` | Guideline |
| Offering help | `patterns/settings-and-help.md` | Guideline |
| Onboarding | `patterns/onboarding-and-accounts.md` | Guideline |
| Playing audio | `patterns/audio-and-video.md` | Guideline |
| Playing haptics | `patterns/feedback-and-status.md` | Guideline |
| Playing video | `patterns/audio-and-video.md` | Guideline |
| Printing | `patterns/files-and-storage.md`, `patterns/email-and-documents.md` | Guideline |
| Ratings and reviews | `patterns/settings-and-help.md` | Guideline |
| Searching | `patterns/search.md` | Guideline |
| Settings | `patterns/settings-and-help.md` | Guideline |
| Undo and redo | `patterns/feedback-and-status.md` | Guideline |
| Workouts | | N/A |

Patterns we need that the HIG does not have as a topic: **plans and upgrades** (`patterns/plans-and-upgrades.md`), **personal versus organisation context** (`patterns/onboarding-and-accounts.md`), **AI assistance** (`patterns/ai-assistance.md`; Apple covers this under Technologies, Generative AI), **offline and sync** (`patterns/feedback-and-status.md`), **admin and bulk actions** (`patterns/admin-and-bulk-actions.md`), **composing** (`patterns/composing.md`), **scheduling** (`patterns/scheduling.md`), **email and documents** (`patterns/email-and-documents.md`). Platform differences, including where Android conventions override ours, are in `platforms.md`.

## Components (8 categories)

Per-component status is in [`components/README.md`](./components/README.md), organised by the same eight categories: Content; Layout and organization; Menus and actions; Navigation and search; Presentation; Selection and input; Status; System experiences.

## Inputs (13)

| HIG topic | Ours | Status |
|---|---|---|
| Focus and selection | `foundations/input.md` | Guideline |
| Gestures | `foundations/input.md` | Guideline |
| Keyboards | `foundations/input.md` | Guideline |
| Pointing devices | `foundations/input.md` | Guideline |
| Apple Pencil and Scribble | `foundations/input.md` | Planned with Docs and Slides annotation |
| Action button, Camera Control, Digital Crown, Eyes, Game controls, Gyroscope and accelerometer, Nearby interactions, Remotes | | N/A: device features this product does not use |

## What is still missing

As of 0.3 every topic above has written guidance and every component has a spec. What remains is work that documents cannot do:

1. **Testing with people.** Nothing has been tested with users, including the decisions in `decisions.md`. Plan: `research-plan.md`.
2. **Review of the specs.** The 60 component specs were written in one pass and have not been reviewed by a second person or reconciled line by line with each other.
3. **The React component layer.** Stack decided, tokens and CSS layer built, components not coded.
4. **Illustrations.** Rules exist; no artwork.
5. **Prices against real cost, and a trademark search for the name.** See `decisions.md`, O-2 and O-3.
6. **Android verification.** Parts of `platforms.md` are marked as not verified against Android's own documentation.
7. **Apple pages not read:** Charts (component), Quick Look, Printing, and the per-platform dimension tables for widgets and live activities.
