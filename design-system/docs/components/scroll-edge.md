# Scroll view edge

Status: Specified

## Purpose

The scroll edge fades and blurs content as it passes under a pinned glass bar, so text in the content never collides with labels on the bar. It is functional, not decorative. Do not use it where nothing floats over the scroll view, and do not use it as a scrim or overlay.

## Anatomy

- **Bar.** The pinned glass top bar, toolbar or tab bar. Specified separately.
- **Edge band.** A strip of the scroll view next to the bar where content fades toward the surface colour and blurs.
- **Separator.** A hairline that replaces the band in the hard variant.

## Variants and sizes

| Variant | Treatment | Use |
|---|---|---|
| Soft | Fade and blur, no line | Default. Bars with a few controls over ordinary content |
| Hard | Near-opaque bar with a hairline separator | Bars with many controls, text outside controls, pinned table or list headers under the bar |

- The band extends `space.16` beyond the bar on touch and `space.12` on pointer.
- Top edge under the top bar; bottom edge above a floating tab bar. Never on a side.
- Touch and pointer use the same treatment.

## States

| State | Treatment |
|---|---|
| At rest | Content is at its start. No band, no separator; the bar is fully transparent to the surface behind |
| Scrolled | Content is under the bar. The band appears |
| Scrolled to end (bottom edge) | The bottom band is removed |
| Keyboard focus | An element receiving focus is scrolled clear of the band before its ring is drawn |

The edge is not interactive. Hover, pressed, disabled, loading, error and selected do not apply.

## Tokens

- Bar material: `material.regular` with `blur.regular` for toolbars and sidebars; `material.thin` with `blur.thin` for tab bars; edge `material.edge`.
- Band: fades to the surface under the scroll view, `color.bg.base` or `color.bg.grouped`; blur `blur.thin`.
- Hard variant: `border.hairline` in `color.separator.default`.
- Fallback surface: `color.bg.elevated`.
- Layer: `z.bar` for the bar; the band sits at `z.sticky`, above content and below the bar.
- Motion: band appears and leaves over `duration.quick` with `easing.standard`.

## Behaviour

- **One per view.** In a split view each pane may have its own; all are the same height so the panes align.
- Follows scroll position directly: the band's strength tracks the first few points of scroll, then holds.
- Pointer and touch events pass through the band to the content.
- Content inset: the scroll view's start padding equals the bar height, so the first item is fully visible at rest.
- A banner or pinned header between the bar and the content takes the hard variant.
- Over photos, video or a coloured document, the bar follows the `material.clear` rules in `../foundations/depth-and-motion.md` and the band still applies.
- Native iOS: standard bars supply the system effect. Do not draw a custom one over it.
- Right-to-left: no change; the edge is horizontal.
- Reduced motion: the band appears without a transition and nothing animates into or out of blur.

## Accessibility

- Purely visual. Hidden from assistive technology; adds nothing to the tab order.
- Text under the band is partly obscured by design. Focused elements, find-in-page matches and the text cursor are always scrolled out from under it.
- Reduced transparency: no blur and no fade. The bar becomes `color.bg.elevated` with a `border.hairline` separator in `color.separator.opaque` whenever content is scrolled.
- Increased contrast: always the hard variant, with the separator in `color.separator.opaque`.
- Where `backdrop-filter` is unsupported, treat as reduced transparency.

## Content

The edge carries no words. Two content rules follow from it:

| Good | Bad |
|---|---|
| A list's first row sits fully below the bar at rest | The first row starts half under the bar |
| A sticky section header under the bar uses the hard variant | Header text fading into the bar's title |

Apple reference: Scroll views, Status bars, read 2026-11-11
