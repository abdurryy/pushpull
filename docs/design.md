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

**Snappy:** short and quick. `--duration-fast` (120ms) for presses and toggles, `--duration` (180ms) for panels and score changes, easing `--ease-out`. Loading indicators use `--duration-loading` (900ms). Nothing loops except loading indicators and the game board (see Game board below). Game events (eating, crashing, scoring) use the effect tokens in [Game feel](#game-feel). When the device asks for reduced motion, every duration becomes 0 (including `--duration-loading`), and the tokens file already handles this.

The image skeleton uses `--color-sunken` for the warm fill and `--color-bg` for the cream highlight. The highlight sweeps at `--duration-loading` while the image loads. Once the image is decoded, the sweep pauses and the placeholder fades over the image using `ease-in-out` over three times `--duration` (540ms). Reduced motion reveals the image immediately.

### Animated push mark

Use `PushMark` from `src/views/pushMark.jsx` alongside a visible heading or status message. The two arrows use the team color tokens, and the status effects use the existing palette. The SVG is decorative. With reduced motion, every variant renders as the static two-arrow mark.

| Variant | Motion | Use |
|---|---|---|
| `entry` | Arrows glide together with a brief glint | On entering the homepage |
| `loading` | Arrows separate and meet, with a pulse at the join | While checking a session or signing in or out |
| `searching` | A scan sweeps across the mark | While looking up weather |
| `success` | Arrows snap into place with a green halo | After signing in |
| `failure` | Arrows shake apart with a red split | Beside the login or weather error |
| `waiting` | Arrows separate briefly around three dots | While the join screen checks the session, and later while waiting in the lobby |
| `game-start` | The outlines trace before the arrows fill | When the TV lobby starts a round (issue #24) |

Loading and searching repeat only while the request is pending. The other variants play once per appearance. Start the round and enable controls on their normal schedule, independently of the animation.

## Game feel

Every game event answers on three channels at once: something moves on the TV, the TV plays a sound, and the phones of the players involved buzz. A player looking at their phone still hears it, and a muted TV still shows it. Never use one channel alone for something that matters.

| Event | On the TV | TV sound | Phone |
|---|---|---|---|
| Apple eaten | The apple bursts into six dots in the team colour, a ring grows from its cell, and a bulge travels down the snake's body | `eat`: two quick rising wooden notes, a little higher for Team B | Short buzz for both teammates |
| Snake crashes | A spark at the crashed head, the board shakes once, the snake flashes ink twice and its eyes turn to "x" | `crash`: a low thud that slides down | Long buzz for the team that crashed |
| Score changes | The score number pops once | `point`: three rising notes | None |
| Round starts | "3", "2", "1", "Go!" in the middle of the board, one per second | `count` on each number, `go` on "Go!" | Short buzz on "Go!" |
| Last 10 seconds | The timer turns `--color-warning` and pops each second | `tick` each second, and the music adds its last-10-seconds layer | None |
| Round won or tied | The winning team's chip grows into a banner with the team name | `win` (or `tie`) jingle | Long buzz for the winners |
| Player joins or leaves the lobby | The seat fills with a pop, or empties | `join` or `leave` | Short buzz on the phone that joined |
| Dash, Ping, Shed, Hold up | A short effect at the snake head, defined with the action rules (#27) | `dash` whoosh, `ping` bloop, `shed` snip, `hold` thunk | Short buzz (Controller rule 3) |
| Press during a cooldown | Nothing | None | `denied`: two short buzzes and a shake (Controller rule 5) |

A short buzz is `--press-vibration-ms`. A long buzz is three times that.

Rules:

1. **The board stays readable.** Effects never cover a snake head or the apple for longer than one tick. At most eight particles per effect, small, gone within `--duration-effect`.
2. **Short.** Event effects last `--duration-effect` or less, shorter than two ticks, so they never queue up. Only round-level moments (the countdown, the winner banner) take longer.
3. **Team colour for team events, ink for the rest.** An orange burst means Team A did it. As everywhere, the team name or letter is never far away.
4. **Bigger event, bigger effect.** Eating is small, a crash is medium, winning a round is the biggest. If everything is loud, nothing is.
5. **Safe flashing.** No full-screen flashes, and nothing flashes more than three times a second (WCAG 2.3.1).
6. **Reduced motion.** The effect tokens become 0: no particles, no shake, no pops. The board change and the sound still tell what happened.
7. **The model says what happened, the View shows it.** The model keeps a short list of recent events (`{ id, kind, team, x, y }`) and the View animates each new `id` once. A View never works out events by comparing the old and new board.

## Sound

**Toy box sound:** wooden, warm and plucky, like a marimba, a kalimba, wood blocks and a soft felt drum. No harsh beeps, no realistic recordings, no voices. Sound is a reward and a signal: a group should be able to play for an hour without anyone asking to turn it off.

- **Only the TV plays sound.** Four phones beeping in four hands is noise, so the phones buzz instead (Controller rule 3).
- **Made in code.** Every sound and every track is built with the Web Audio API, the same way the graphics are drawn with CSS. No audio files, nothing to license and nothing to download.
- **One track per screen:**

| Screen | Track | Feel | Tempo | Key |
|---|---|---|---|---|
| Lobby | `lobby` | Relaxed, waiting for friends | 92 BPM | F major |
| Round | `round` | Bouncy and driving. In the last 10 seconds it adds a fast hi-hat and the melody jumps an octave | 124 BPM | A minor |
| Trivia tie-break | `trivia` | Thinking, with a ticking clock | 84 BPM | D minor |
| Round results | `results` | Warm and proud | 100 BPM | C major |

- **Melodies use the five notes of the key's pentatonic scale.** Effects use only C, D, E, G and A (and Team B's, a fourth higher, F, G, A, C and D). All four keys contain these notes, so an effect never clashes with the music.
- **Mix:** effects sit clearly above the music (music at about half their level). Every effect is about as loud as the others, and a limiter on the output stops clipping.
- **Variation:** a sound that repeats (eating, ticks) shifts its pitch slightly each time, and the same sound never starts twice within 50ms. Twenty apples shouldn't sound like a machine gun.
- **Turning sound on and off:** browsers only allow sound after a press, so the first press on the TV ("Create room", "Start round") turns it on. The TV always shows a sound button with an icon and a label ("Sound on" / "Sound off"). Whether sound is on is application state.
- **Never sound alone.** Every sound has a picture that says the same thing (see the Game feel table), so deaf players and muted TVs miss nothing.
- **Where it lives:** `src/sound/` (`instruments.js`, `effects.js` with one function per event, `music.js` with the tracks as note patterns, `soundPlayer.js` with the mix and the music clock). Sound is output, like a View: Views use it through `MusicTrack`, `SoundCues` and `SoundToggle` (Shared components), and the model never imports it. Try every sound on `#/components`.
- **Check levels before you ship a sound:** `node .agents/skills/game-audio/scripts/render-audio.mjs` renders every effect and track to WAV files and warns about clipping and effects that are much louder or quieter than the rest.

## Components

**Buttons.** One primary button per screen: ink fill, white text. Secondary: `--color-sunken` fill, ink text. Minimum height `--hit-min` (48px) on phones. A button says what it does ("Join room", "Start round").

**Inputs.** A visible label above every input. Height 48px, `--color-sunken` fill, `--radius`. The room code is 4 separate boxes in `--font-numbers` that jump to the next box as you type and accept a pasted code.

**Team chips.** Team colour fill, `--radius`, text in the team's ink (`--color-team-a-ink` / `--color-team-b-ink`), always with the team name or a player name.

**Game board.** The board is where the fun is, so it is the one place that is always a little alive. `GameBoard` draws it on a canvas (`src/views/boardPainter.js`), with colours and timings read from the tokens:

- **Floor:** `--color-board` with faint seams and a dot in each cell, both using `--color-board-dot`.
- **Snakes** have continuous, rounded bodies in their team colours, 84% of a cell thick (`--tile-inset` on each side). Staggered, open scale edges in each team's soft colour add a subtle texture along the body. The head stays smooth, with both eyes easy to find. The heads angle into turns, and pupils look where the team steers, even before the body turns. When teammates pull apart the snake goes cross-eyed. A crashed snake has ink crosses on white eyes so they stay visible during the crash flash.
- **Movement:** snakes glide from cell to cell over one tick. The gallery's wrapping snakes cross the rim smoothly and stay connected on both sides.
- **Apples** are ink, with a two-lobed silhouette, a curved stalk, a leaf and a small white shine. They pop in when they appear and bob gently.
- **Both teammates' sticks** show as ink chevrons by the head. Two the same way make a double chevron and opposite ones point apart, so everyone can see why a snake stopped.
- **Weather from Open-Meteo is visible:** rain falls in slanted streaks, wind blows streaks the way the apples drift, and at night the board goes dark except for a light around each head.
- **Reduced motion:** snakes jump cell to cell, and nothing moves on its own (no gliding, bobbing, blinking, rain, wind or effects). Night stays dark.

**Score bar (TV).** A full-width bar on top, in `--font-display` 800 for scores and `--font-numbers` for the timer.

**Loading, empty and error.** Every View that shows data has all three, plus content:
- **Loading:** an animated push mark plus a sentence saying what is loading ("Checking the weather in Stockholm…"). The rest of the screen stays usable (a course requirement).
- **Empty:** what's missing and what to do ("No games yet. Join a room to play your first one.").
- **Error:** what went wrong and a button to try again. Use `--color-error` for the message, never for the whole screen.

### Shared components

Ready-made View components in `src/views/`. **Use them before writing your own**, and see every one in every state on `#/components` (the props to copy are in `galleryView.jsx`). If one is missing something, extend it in its own small PR instead of copying it.

| Component | Props | For |
|---|---|---|
| `StatusMessage` | `kind` (`loading`, `waiting`, `searching`, `empty`, `success`, `error`), the sentence as children, `onRetry`, `retryLabel` | Every loading, empty and error state |
| `ImageSkeleton` | `src`, `alt`, `width` and `height` (or dimensions from `className`), optional `fallback`, `referrerPolicy` and `pending` | Reserves an image's space and shows a warm shimmer until the image is ready to paint. The placeholder then fades away. Try **Replay image loading** on `#/components`. Reduced motion uses a static placeholder and immediate reveal. |
| `TeamChip` | `team` (`"a"` or `"b"`), a name as children (default "Team A") | Anywhere a team is shown |
| `TeamRoster` | `team`, `players` (`[{ id, name }]`), `seats` (default 2), `youId`, `name` | Lobby (#24), join (#25) |
| `RoomCode` | `code` (empty shows four dots). Its size follows the parent's font size | Lobby (#24) |
| `RoomCodeInput` | `value`, `onCodeChange(code)`, `disabled`, `invalid`, `label`. Put it inside a `<form>` so Enter submits | Join (#25) |
| `ScoreBar` | `scoreA`, `scoreB`, `teamAName`, `teamBName`, `title`, `secondsLeft` | Game board (#28) |
| `Countdown` | `value` (`"3"`, `"2"`, `"1"`, `"Go!"` or nothing). The parent needs `position: relative` | Game board (#28) |
| `GameBoard` | `columns`, `rows`, `snakes` (`[{ team, heading, body, crashed, looking, torn }]`, where `looking` is the direction the team steers and `torn` means teammates pull apart), `apples`, `effects` (`[{ id, kind: "eat" or "crash", team, x, y }]`, other kinds are ignored), `inputs` (`{ a: [dir, dir], b: [dir, dir] }`), `weather` (`{ wet, wind, night }`), `tickMs`, `label`. Drawn on a canvas, see Game board above | Game board (#28) |
| `SoundCues` | `cues`: the same event list as `GameBoard`. Plays each new `id` once; `kind` is a sound name from `src/sound/effects.js` | Every TV screen with events |
| `MusicTrack` | `name` (`lobby`, `round`, `trivia`, `results` or nothing), `intensity` (1 in the last 10 seconds), `muted`. One per screen | Every TV screen |
| `SoundToggle` | `muted`, `onToggle` | Every TV screen |

Every component sizes its text from the parent's font size, so the same piece works on the phone and, inside a parent with `font-size: var(--tv-text)`, on the TV.

### Controller (phone, landscape)

Players watch the TV, not their phone. In remote-control party games, on-screen buttons often feel dead: nothing moves, nothing buzzes, and you can't tell whether a press counted. These rules make every press feel like it landed:

1. **Act on press, not on release.** Start the action on `pointerdown`. A `click` only fires when the finger lifts, which feels slow.
2. **Show the press instantly.** The pressed state appears with no transition: the button shrinks to `--press-scale` (0.92) and darkens. Only the release animates back (`--duration-fast`).
3. **Buzz where the phone allows it.** Call `navigator.vibrate()` with `--press-vibration-ms` (20) on each press. It works in Chrome on Android, but **Safari on iPhone has no web vibration at all**. A known workaround toggles a hidden `<input type="checkbox" switch>` to trigger the iPhone's haptic engine, but it is undocumented, only works on some iOS versions and may stop working, so we treat it as a bonus, never something we depend on.
4. **Confirm from the TV.** When the TV has handled the action, the phone flashes a ring around the button, and the TV plays the action's sound. This is the "it counted" signal on iPhones that can't vibrate.
5. **Show cooldowns.** If an action can't be used again yet, the button shows a ring that fills up and is dimmed until it's ready. A press during cooldown gives a short "no" buzz and a shake, not silence.
6. **Big zones, not small buttons.** The visible buttons are at least `--controller-button` (72px) with `--controller-gap` (16px) between them. The **whole right half** of the screen is split into four zones, one per button, so a slightly missed press still counts. Each button has its Material Symbols icon and a short label under it: Dash `bolt`, Ping `radar`, Shed `content_cut`, Hold up `front_hand`.
7. **Stick: drag anywhere on the left half.** Where the thumb lands becomes the centre, and a ring appears there. The drag direction is the input. A dead zone (`--stick-dead-zone`, 12% of the ring) in the middle means "idle", which lets the teammate steer. Releasing the thumb sends idle at once.
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
- [ ] Looked at screenshots at phone and TV size, in every state (`node .agents/skills/ui-design/scripts/screenshot.mjs "#/route"` takes them)
- [ ] Game events have the picture, sound and buzz from the Game feel table, and nothing flashes more than three times a second

## Sources

- MDN, [Mobile touch controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Mobile_touch) and [Multi-touch interaction with pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Multi-touch_interaction)
- W3C, [Understanding WCAG: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- The iPhone haptics workaround and its limits: [ios-haptics README](https://unpkg.com/ios-haptics@3.1.1/README.md) and [WebKit bug 285120](https://bugs.webkit.org/show_bug.cgi?id=285120)
- Touch target minimums: Apple's Human Interface Guidelines (44×44 pt) and Material Design (48×48 dp)
