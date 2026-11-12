# Imagery and branding

Status: rules only. The brand identity (name, logo, illustration style) is open question D-4; nothing here depends on its outcome.

## Branding inside the product

- The brand lives in the quality of the experience, not in logos on every screen.
- The logo appears at sign-in, in the app launcher and on the marketing site. Not in toolbars.
- Brand colour is the accent. It marks interactive elements and is not used as decoration or large backgrounds.
- An organisation's own logo and name may appear in the account control and sign-in page of a managed account. Organisation theming never changes semantic colours, type or component shapes.
- No launch splash beyond the platform's required launch screen. That screen carries no logo, text or advertising; see `patterns/navigation.md`.
- Brand is expressed through the standard components. Styling a component for brand never changes its size, placement or behaviour.
- No other company's trademarks, product names or hardware appear in our names, icons, images or illustrations, apart from platform badges used under their owner's rules.

## Illustration

Full rules: `illustration.md`.

- Used for empty states, onboarding and errors only, where it helps explain. Never as filler.
- Simple, flat, drawn with the system's hues and neutral greys; legible in light and dark.
- Decorative illustrations are hidden from assistive technology; meaningful ones have a text alternative.

## Photos and user content

- People's content (avatars, attachments, document thumbnails) is shown faithfully: never tinted, cropped off-centre or overlaid with text without a scrim.
- Avatars fall back to initials on a hue chosen from the person's ID, so the colour is stable.
- Thumbnails keep their aspect ratio inside a fixed frame.
- Supply images at 1x, 2x and 3x or as vectors. No text baked into images.
- Vectors first. Bitmaps are drawn at 1x on whole pixels, exported at 2x and 3x, and each carries an embedded colour profile.
- Our own full-colour images are checked in both themes. If one asset does not work in both, supply a light and a dark version. None has a white background that glows in dark mode. People's own content is not altered.
- Check images on real devices at each density before release.

## Media over glass

Controls that float over photos or video use the clear material with the 35% dim layer when the content is bright. See `depth-and-motion.md`.

Checked against Apple HIG: Branding, Images, Dark Mode (images only), 2026-11-11.
