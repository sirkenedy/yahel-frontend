# Components

Each component gets one spec file in this folder (`button.md`, `list.md`, ...) once its design is agreed. This file is the inventory, organised by the same eight categories Apple's HIG uses so coverage can be compared directly.

Status: **Specified** (spec written; file named after the component, for example `button.md`), **Stable** (built and meets the definition of done in `../governance.md`). Every component below is Specified as of 0.3. None is Stable: specs have not been reviewed by a second person, tested with users, or built beyond the CSS layer in `../../packages/css/`.

## Content

| Component | Notes | Status |
|---|---|---|
| Avatar | Person (circle), organisation (rounded square), group stack; initials fallback | Specified |
| File tile and thumbnail | Type tile in app hue; image and document previews | Specified |
| Chart | Bar, line, donut, meter; needs the data visualisation guideline | Specified |
| Image view | Aspect-preserving, zoomable | Specified |
| Rich text view | Mail body, document content, chat message | Specified |
| Web and file preview | In-place preview with next and previous | Specified |

## Layout and organization

| Component | Notes | Status |
|---|---|---|
| Grouped list and row | Icon tile, value, chevron, toggle, swipe actions | Specified |
| Card | Elevation 1 container | Specified |
| Sidebar | Two levels maximum, hideable | Specified |
| Split view | List and detail; collapses by size class | Specified |
| Table | Sortable, selectable, sticky header; Admin and file lists | Specified |
| Grid and collection | File grid, app launcher | Specified |
| Disclosure group | Expand and collapse | Specified |
| Tab view | In-page tabs, distinct from the tab bar | Specified |
| Divider and section header | | Specified |

## Menus and actions

| Component | Notes | Status |
|---|---|---|
| Button | Roles: normal, primary, cancel, destructive. Styles: filled, tinted, grey, plain. Touch and pointer sizes; icon-only; loading | Specified |
| Menu and context menu | Icons optional and consistent; destructive items last | Specified |
| Pull-down and pop-up button | | Specified |
| Toolbar | Grouped items; one prominent action | Specified |
| Floating action button | Compact width primary action | Specified |
| Swipe actions | Always mirrored in the row menu | Specified |
| Share control | Same icon and position everywhere | Specified |

## Navigation and search

| Component | Notes | Status |
|---|---|---|
| Tab bar | Glass, 3 to 5 single-word tabs, optional search tab | Specified |
| Top bar and navigation bar | Large title that collapses | Specified |
| Account switcher | Personal, organisations, add account | Specified |
| App launcher | Suite grid | Specified |
| Search field | With scope, tokens and suggestions | Specified |
| Breadcrumb and path | Drive locations | Specified |
| Pagination and load more | | Specified |

## Presentation

| Component | Notes | Status |
|---|---|---|
| Dialog | Two buttons at most; destructive is never the default | Specified |
| Sheet | Half and full height; becomes a centred panel when wide | Specified |
| Popover | | Specified |
| Tooltip | Icon-only controls; includes shortcut | Specified |
| Toast | With Undo; recallable | Specified |
| Banner | View-level status | Specified |
| Scroll view edge | Fade and blur under pinned bars | Specified |

## Selection and input

| Component | Notes | Status |
|---|---|---|
| Text field and text area | Label, help, error, counter | Specified |
| Toggle, checkbox, radio | Checkbox has a mixed state | Specified |
| Segmented control | 2 to 5 segments | Specified |
| Select and combo box | Searchable when long | Specified |
| Date and time pickers | Locale and time-zone aware | Specified |
| People picker | Tokens, external marker | Specified |
| Slider and stepper | | Specified |
| Colour picker | Labels, calendars | Specified |
| File picker and drop zone | Same in every app | Specified |
| Token and chip field | Recipients, filters | Specified |

## Status

| Component | Notes | Status |
|---|---|---|
| Progress bar and spinner | Determinate when duration is known | Specified |
| Skeleton | Shaped like the content it replaces | Specified |
| Storage meter | Segmented by app; normal, getting full, almost full, full | Specified |
| Badge and counter | Attention only | Specified |
| Tag | Neutral, accent, success, warning, danger | Specified |
| Empty state | Sentence plus one action | Specified |
| Presence indicator | Online, in a call, editing | Specified |
| Save and sync indicator | Saving, saved, offline | Specified |

## System experiences

| Component | Notes | Status |
|---|---|---|
| Notifications | Push, in-app list, email; who, what, where and context | Specified |
| Home-screen widgets and live activities | Calendar next event, Meet in progress. Build waits for native apps | Specified |
| Transactional email template | Styled from the same tokens | Specified |
| Sign-in and consent screens | Including organisation single sign-on | Specified |

## Spec template

```markdown
# <Component>

Status: Proposed | Specified | Stable

## Purpose
One or two sentences: what it is for, and what to use instead when it is not the right choice.

## Anatomy
Named parts and which are optional.

## Variants and sizes
Each variant, when to use it, touch and pointer dimensions.

## States
Default, hover, pressed, focused, disabled, loading, error, selected.

## Tokens
Every colour, type role, space, radius, elevation and motion token used. No raw values.

## Behaviour
Interaction, keyboard, motion, responsive changes across size classes, right to left.

## Accessibility
Element or role, accessible name, focus order, announcements, increased-contrast appearance.

## Content
Label guidance with good and bad examples.
```
