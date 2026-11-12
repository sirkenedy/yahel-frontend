# App launcher

Status: Specified

## Purpose
Suite-level navigation: it shows every app in Yahel and opens one. On web it is a grid button in the top bar; on mobile it is Home. It does not switch accounts (the account switcher does) and it does not hold actions or settings.

## Anatomy
- **Launcher button** (web): a grid icon in the top bar, next to the account control.
- **Panel**: a grid of app cells.
- **App cell**: the app icon tile in the app's hue, with the app name beneath.
- **Search field** (Home on mobile, optional on web): searches across everything the person can access.
- **Unavailable note** (optional): where an organisation has turned an app off.

## Variants and sizes

| Variant | Where | Form |
|---|---|---|
| Popover | Web, regular and wide | Three cells per row, anchored to the button |
| Sheet | Web, compact | Four cells per row, from the bottom |
| Home | Mobile | A full view: search, the grid, then recent items |

App icon tiles are `space.48` in the popover and `space.64` on Home, with radius at 25% of their size on web and Android; iOS applies its own mask. Each cell is at least `target.touch` on touch, with `space.8` or more between cells. The launcher button follows `button.md` icon-only sizes.

## States

| State | Appearance |
|---|---|
| Default | Icon tile and name in `color.label.primary` |
| Hover | `color.fill.tertiary` behind the cell |
| Pressed | `color.fill.secondary`; the tile at `opacity.pressed` |
| Keyboard focus | Focus ring around the cell |
| Selected (current app) | `color.fill.secondary` behind the cell and the name at its emphasised weight; "current" in its accessible name |
| Disabled (app turned off by the organisation) | Tile at `opacity.disabled`, still listed, with "Turned off by Northwind Studio" on selection and in its description |
| Loading | The grid of apps is fixed and shows at once; only recent items on Home use skeletons |
| Error | Recent items show "Unable to load recent items" with "Try again"; the grid still works |
| Badged | A count on the tile for things that need attention; never promotion |

## Tokens
- Colour: `app.mail`, `app.calendar`, `app.drive`, `app.docs`, `app.sheets`, `app.slides`, `app.chat`, `app.meet`, `app.admin` (tiles); `color.label.on-accent` (glyph); `color.bg.elevated` (panel), `color.bg.base` (Home), `color.scrim` (sheet form), `color.label.primary`, `color.label.secondary`, `color.fill.tertiary`, `color.fill.secondary`, `color.accent.default` (focus), `color.danger.solid` (badge).
- Type: `type.footnote` (app name in the popover), `type.subhead` (app name on Home), `type.large-title` (Home title), `type.caption-2` (badge).
- Space and shape: `space.8`, `space.12`, `space.16`, `space.24`, `space.48`, `space.64`, `radius.lg` (popover and cell highlight), `radius.2xl` (sheet), `icon.lg`, `target.touch`, `margin.compact`, `border.focus`, `border.focus-offset`.
- Depth and motion: `elevation.2`, `elevation.3` (sheet), `z.popover`, `z.sheet`, `duration.quick`, `duration.emphasized`, `easing.standard`, `easing.spring`, `easing.exit`, `opacity.pressed`, `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `border.hairline`, `border.control`.

## Behaviour
- The app order is fixed and the same for everyone, on every platform, so position can be learned. It does not reorder by use.
- Opening an app goes to where the person last was in it; each app keeps its state. On web, apps open in the same tab, and Command or Control with click opens a new one.
- The launcher shows the apps for the current account context. Switching context may change which apps are available.
- App hue appears only on the tiles. The panel itself is neutral.
- The panel closes on choice, outside press or Escape; focus returns to the launcher button.
- Keyboard: arrow keys move in two dimensions; Enter opens; typing a letter moves to the app whose name starts with it.
- Home's search follows `search.md`: it states its scope and covers everything the person can access in the current context.
- Right to left: cells fill from the right. App icons do not mirror.
- Reduced motion: the panel cross-fades.

## Accessibility
- Launcher button: a `button` named "Apps" that opens a dialog. The grid is a list of links, each named by the app.
- App names are always visible; a tile is never shown alone.
- Hue is not the only identifier: every app has a distinct glyph and a name.
- At 200% text, names wrap to two lines and the grid drops to fewer cells per row.
- Increased contrast: tiles keep their hue and gain a `border.hairline` outline in `color.label.primary`; the current app gains a `border.control` outline.

The white glyph on each app hue must reach 3:1; see the note in `file-tile.md`.

## Content
- App names are the product names, one word each: "Mail", "Calendar", "Drive", "Docs", "Sheets", "Slides", "Chat", "Meet", "Admin". Bad: "Yahel Mail", "E-mail".
- Launcher button name. Good: "Apps". Bad: "Waffle menu", "Grid".
- Turned-off app. Good: "Turned off by Northwind Studio". Bad: "Access denied".
- Home search placeholder names the scope: "Search Northwind Studio".

Apple reference: none (no equivalent)
