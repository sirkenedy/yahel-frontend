# Principles

Two sets. **Experience principles** decide what a feature does and how it treats people. **Visual principles** decide how it looks and moves. When they conflict, experience wins.

## Experience principles

Aligned with the eight principles Apple reintroduced in June 2026, stated for a workspace people use all day for both private life and work.

| Principle | What it means here | Test |
|---|---|---|
| **Purpose** | Every screen helps someone finish real work: send, find, decide, share. | Can you name the task this screen completes? If not, cut it. |
| **Agency** | People choose how they work: keyboard or touch, list or grid, dense or roomy. Nothing is forced, everything can be undone. | Is there an undo? Is there a keyboard path? Can the choice be changed later? |
| **Responsibility** | We act in the person's interest. Private data stays private, organisation data stays with the organisation, and we never trick anyone into an upgrade or a share. | Would the person be surprised by who can see this, or what it costs? |
| **Familiarity** | Standard parts behave in standard ways on each platform. The same action has the same name and place in every app. | Would someone who knows Mail already know how this works in Drive? |
| **Flexibility** | Works at any text size, window size, input method, language, connection quality and ability. | Does it hold at 200% text, in Arabic, offline, with a screen reader? |
| **Simplicity** | Clear and direct. One primary action per view. Plain words. | Can a new person say what to do next within five seconds? |
| **Craft** | Details are finished: alignment, states, empty screens, error text, motion timing. | Are loading, empty, error, disabled and focus states all designed? |
| **Delight** | Human, warm and quick. Delight comes from speed and care, never from decoration that slows work. | Does this moment respect the person's time? |

## Visual principles

### Clarity

Content is legible and every control says what it does.

- Text passes 4.5:1 contrast; 7:1 when the reader asks for more contrast. Meaning never rests on colour alone.
- One accent colour marks what is interactive. A colour means one thing everywhere.
- One or two prominent buttons per view. Emphasis comes from the button's background, not coloured text on several controls.
- Use the text role that matches the job; do not invent sizes.

### Deference

The interface recedes so mail, files, documents and people lead.

- Surfaces are neutral. Colour belongs to content, status and the single accent.
- Chrome is thin and translucent where it floats over content, and monochrome over colourful content.
- App identity hue appears on the app icon and small markers, not as large coloured areas.

### Depth

Layers and motion explain where things are and where they came from.

- Four elevation levels, each with a fixed job. Higher means more temporary.
- Glass is for the navigation and control layer that floats; content sits on solid surfaces.
- Motion starts from the thing the person touched and can be interrupted.
- In dark mode, raised surfaces get lighter instead of casting stronger shadows.

### Continuity

One identity, one set of parts, every app and platform.

- The same component looks and behaves the same in Mail, Drive and Admin.
- Personal and organisation contexts share all components and differ only by clear markers: people are circles, organisations are rounded squares, and the account control always names the current context.
- Touch and pointer are two size classes of one system, not two designs.
- Native platforms keep their own conventions for navigation and system gestures; our tokens style them.
