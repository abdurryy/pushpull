# Design guidelines

**Status: decided (2026-11-25).** The team picked every value below. The values live in [`src/styles/tokens.css`](../src/styles/tokens.css). Views use `var(--token)` and never hard-code a colour, font, size, radius or duration.

## Direction

Push/Pull is a party game for four friends with one TV and their own phones. It should feel **warm, playful and chunky, like a board game on the living-room table** ("Toy box"), but calm enough that the snakes and the score are always the loudest thing on screen.

- **Light everywhere:** the same light theme on the TV and the phones.
- **Flat fills:** surfaces are separated by colour, not by borders or shadows.
- **Two screens, two jobs.** The TV is read from the sofa, 2–3 m away. The phone is a controller that players use **without looking at it**.

## Layout and navigation

**TV (`#/tv`)**, designed for 1920×1080 (16:9):
- Keep everything 5% in from each edge (TV safe area): `--tv-safe`.
- The score bar sits on top: Team A's chip and score on the left, mode, round and timer in the middle, Team B's score and chip on the right. The game board fills the rest.
- Flow: Lobby → Game board → Round results → next round.

**Phone (`#/play`)**:
- Log in, Join a room and Profile are **portrait**, one column, at most `--phone-max-width` wide and centred.
- The Controller is **landscape and full-screen**. In portrait it shows only "Turn your phone sideways".
- Flow: Log in → Join a room → Controller. Profile and stats open from the menu.

Breakpoints: phone below 600px wide, TV at 1280px wide and above in landscape. The TV views don't need a phone layout, and the controller doesn't need a desktop layout.

## Typography

| Role | Font | Use |
|---|---|---|
| Display | **Unbounded** 500 and 800 | Logo, headings, scores, big numbers |
| Text | **Atkinson Hyperlegible Next** 400 and 700 | Everything else: buttons, labels, sentences |
| Numbers and codes | Atkinson Hyperlegible Next with `font-variant-numeric: tabular-nums` (`--font-numbers`) | Room codes, scores, timers. Equal-width digits stop numbers from jumping as they change. |

Atkinson Hyperlegible was designed by the Braille Institute for readers with low vision, so letters like `I`, `l` and `1` are easy to tell apart. That matters for room codes.

**Type scale.** On the phone, sizes are in px: 14 (small), 16 (body), 20, 24, 32. On the TV, sizes scale with the screen width so they're the same on any TV: `--tv-text` (24px at 1080p, the minimum for body text on a TV), `--tv-title`, `--tv-score`. No text on the TV is smaller than `--tv-text`.

Load the fonts and icons once, in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&family=Unbounded:wght@500;800&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,1,0&display=block">
```

## Colour

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FFF6EA` | Page background (warm paper) |
| `--color-surface` | `#FFFFFF` | Cards, panels, the controller |
| `--color-sunken` | `#F7E8D5` | Inputs, secondary buttons, grouped areas |
| `--color-ink` | `#2A2134` | Text, primary buttons, icons |
| `--color-muted` | `#6D6377` | Secondary text |
| `--color-line` | `#EBDCC8` | Dividers only (never the only way to see an edge) |
| `--color-team-a` | `#FF5A1F` | Team A (orange) |
| `--color-team-b` | `#2D5BFF` | Team B (blue) |
| `--color-team-a-soft` / `-b-soft` | `#FFE3D6` / `#DFE6FF` | Team areas in the lobby |
| `--color-board` / `--color-board-dot` | `#FFFCF6` / `#E3CFB3` | Game board and its dots |
| `--color-success` / `--color-warning` / `--color-error` | `#17703D` / `#8F5400` / `#C62828` | Status messages |

**Contrast** (WCAG AA: 4.5:1 for text, 3:1 for large text and UI parts), checked for every pair we use:

| Pair | Ratio |
|---|---|
| Ink on bg / surface / sunken | 14.4 / 15.4 / 12.8 |
| Muted on bg / surface / sunken | 5.3 / 5.7 / 4.7 |
| Ink on Team A orange | 4.9 |
| White on Team B blue | 5.2 |
| Team B blue as text on bg | 4.8 |
| Orange snake on the board (graphic, needs 3:1) | 3.05 |
| Success / warning / error on bg | 5.7 / 5.7 / 5.3 |

Rules:
- **Orange is never a text colour.** It is too light (2.9:1 on the background). Put ink text on orange, and white text on blue.
- **Never use team colour alone.** A team is always named too ("Team A", a letter or the player names), so colour-blind players can follow. Orange and blue is the safest pair for the common types of colour blindness.

## Spacing, shape and depth

- **Spacing:** 4px steps. `--space-1` to `--space-8` = 4, 8, 12, 16, 24, 32, 48, 64. Use `gap` on flex and grid layouts, not margins between siblings.
- **Corners:** `--radius` = 10px for cards, buttons, inputs and chips. `--radius-small` = 6px inside small parts like the room code boxes. `--radius-round` only for circular things (controller buttons, avatars).
- **Depth: flat.** No shadows and no borders around cards. A card is `--color-surface` on `--color-bg`. Inside a card, use `--color-sunken`.
- **Focus:** every focusable element shows `--focus-ring` (3px ink outline, 2px offset). Never remove it.

## Motion

**Snappy:** short and quick. `--duration-fast` (120ms) for presses and toggles, `--duration` (180ms) for panels and score changes, easing `--ease-out`. Nothing loops except loading indicators. When the device asks for reduced motion, every duration becomes 0, and the tokens file already handles this.

## Components

**Buttons.** One primary button per screen: ink fill, white text. Secondary: `--color-sunken` fill, ink text. Minimum height `--hit-min` (48px) on phones. A button says what it does ("Join room", "Start round").

**Inputs.** A visible label above every input. Height 48px, `--color-sunken` fill, `--radius`. The room code is 4 separate boxes in `--font-numbers` that jump to the next box as you type and accept a pasted code.

**Team chips.** Team colour fill, `--radius`, text in the team's ink (`--color-team-a-ink` / `--color-team-b-ink`), always with the team name or a player name.

**Game board.** `--color-board` with a dot on every cell (`--color-board-dot`). Snakes are rounded blocks in the team colour: each block is inset 8% in its cell with a 24% corner radius. The head has two white eyes facing the direction of travel. Apples are ink.

**Score bar (TV).** A full-width bar on top, in `--font-display` 800 for scores and `--font-numbers` for the timer.

**Loading, empty and error.** Every View that shows data has all three, plus content:
- **Loading:** a small spinner plus a sentence saying what is loading ("Checking the weather in Stockholm…"). The rest of the screen stays usable (a course requirement).
- **Empty:** what's missing and what to do ("No games yet. Join a room to play your first one.").
- **Error:** what went wrong and a button to try again. Use `--color-error` for the message, never for the whole screen.

### Controller (phone, landscape)

Players watch the TV, not their phone. In remote-control party games, on-screen buttons often feel dead: nothing moves, nothing buzzes, and you can't tell whether a press counted. These rules make every press feel like it landed:

1. **Act on press, not on release.** Start the action on `pointerdown`. A `click` only fires when the finger lifts, which feels slow.
2. **Show the press instantly.** The pressed state appears with no transition: the button shrinks to `--press-scale` (0.92) and darkens. Only the release animates back (`--duration-fast`).
3. **Buzz where the phone allows it.** Call `navigator.vibrate(20)` on each press. It works in Chrome on Android, but **Safari on iPhone has no web vibration at all**. A known workaround toggles a hidden `<input type="checkbox" switch>` to trigger the iPhone's haptic engine, but it is undocumented, only works on some iOS versions and may stop working, so we treat it as a bonus, never something we depend on.
4. **Confirm from the TV.** When the TV has handled the action, the phone flashes a ring around the button, and the TV plays the action's sound. This is the "it counted" signal on iPhones that can't vibrate.
5. **Show cooldowns.** If an action can't be used again yet, the button shows a ring that fills up and is dimmed until it's ready. A press during cooldown gives a short "no" buzz and a shake, not silence.
6. **Big zones, not small buttons.** The visible buttons are at least `--controller-button` (72px) with `--controller-gap` (16px) between them. The **whole right half** of the screen is split into four zones, one per button, so a slightly missed press still counts. Each button has its Material Symbols icon and a short label under it: Dash `bolt`, Ping `radar`, Shed `content_cut`, Hold up `front_hand`.
7. **Stick: drag anywhere on the left half.** Where the thumb lands becomes the centre, and a ring appears there. The drag direction is the input. A dead zone (12% of the ring) in the middle means "idle", which lets the teammate steer. Releasing the thumb sends idle at once.
8. **Stick and buttons at the same time.** Track each finger by its `pointerId` and use `setPointerCapture`, so a thumb sliding off a zone keeps steering, and a `pointercancel` resets the stick to idle.
9. **Stop the browser from interfering:** `touch-action: none` (no scrolling, zoom or tap delay), `user-select: none`, `-webkit-touch-callout: none`, and block the long-press menu (`contextmenu`).
10. **Keep the screen on and sideways.** Request a screen wake lock during a round. iPhones can't lock the orientation from a web page, so in portrait the controller shows "Turn your phone sideways" instead.

**Test it on two real phones, one iPhone and one Android,** during the first user test. Ask testers whether they could tell their press counted without looking.

## Icons and images

- **One icon set: Material Symbols Rounded** (filled, weight 500), from Google Fonts. Write `<span class="icon" aria-hidden="true">bolt</span>` and put the meaning in the button's text or `aria-label`. It's listed under Third-party components in the README.
- **Logo:** the push mark (two arrows meeting, orange and blue) next to "PUSH/PULL" in Unbounded 800.
- **No photos.** Game graphics are drawn with CSS or inline SVG from the tokens.

## Tokens

All values are in [`src/styles/tokens.css`](../src/styles/tokens.css). Import it once in the app's root stylesheet. **Rule:** Views use `var(--token)` and never hard-code a colour, font, size, radius, shadow or duration. If a value is missing, add a token there first (and to this file), in its own small PR.

## PR checklist for UI changes

- [ ] Only `var(--token)` values: no hex colours, font names, px font sizes or durations in the View
- [ ] Loading, empty and error states exist and read well
- [ ] Every input has a visible label, every image or icon-only button has a text alternative, and the focus ring shows
- [ ] Text contrast is from the table above (no orange text)
- [ ] Team colour always comes with a name or letter
- [ ] TV view: no text smaller than `--tv-text`, nothing inside the 5% edge
- [ ] Controller: actions fire on `pointerdown`, the pressed state shows instantly, and it works with the stick and a button pressed together
- [ ] Checked on a phone-sized screen (and on a real phone for controller changes)

## Sources

- MDN, [Mobile touch controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Mobile_touch) and [Multi-touch interaction with pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Multi-touch_interaction)
- W3C, [Understanding WCAG: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- The iPhone haptics workaround and its limits: [ios-haptics README](https://unpkg.com/ios-haptics@3.1.1/README.md) and [WebKit bug 285120](https://bugs.webkit.org/show_bug.cgi?id=285120)
- Touch target minimums: Apple's Human Interface Guidelines (44×44 pt) and Material Design (48×48 dp)
