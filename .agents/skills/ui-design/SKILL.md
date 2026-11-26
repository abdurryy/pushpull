---
name: ui-design
description: Design and build Push/Pull screens that look good and feel good to use. Use for any work a player sees or touches, before writing the first line of it - a new or changed View, CSS, layout, a component, text on screen, animation, the TV screens, the phone controller, loading, empty and error states, "make this look better" or "polish this". Also use when reviewing UI in a pull request.
---

# UI design: screens people enjoy using

Agents usually build UI blind. They never look at the result, fall back on generic web defaults and stop as soon as the code runs. That is why their screens look the same and feel cheap. This skill fixes it with three habits:

1. **Think before code:** write a short brief and block out the layout.
2. **Follow hard taste rules** instead of guessing.
3. **Look at what you built:** take screenshots, score them, fix, repeat.

Step 5 (look at it) is not optional. A screen you haven't looked at is not done.

`docs/design.md` and `src/styles/tokens.css` are the law. This skill is how to apply them well. If this file and design.md ever disagree, design.md wins.

## The rules in one list

1. Read `docs/design.md`, `src/styles/tokens.css` and the nearest existing View before you start.
2. Write the brief (step 2) before any code.
3. Use tokens only: `var(--token)` for every colour, font, size, space, radius and duration.
4. Design every state: loading, empty, error, content, disabled and long text.
5. Take screenshots and look at them before you say you are done. If you couldn't, say so.
6. Remove before you add. A calm screen with three things beats a busy one with ten.
7. All markup and CSS go in the View and its `.css` file. Presenters stay a single wrapper (see AGENTS.md).
8. Keep the code simple enough for the developer to explain to a teacher.

## Step 1: Load the context

Read these, in this order:

1. `docs/design.md`, the whole file. Note the controller rules and the PR checklist.
2. `src/styles/tokens.css`. These are the only values you may use.
3. The closest existing View and its CSS, as a sample of the house style. Copy its patterns instead of inventing new ones:
   - `src/views/homeView.jsx` / `.css`: page layout, hierarchy, link cards, the board drawing, the wide-screen breakpoint.
   - `src/views/loginView.jsx` / `.css`: buttons, pressed and disabled states, status lines with `PushMark`, error messages.
   - `src/views/weatherView.jsx` / `.css`: a TV form with idle, loading, error, empty and content states.
   - `src/views/controllerView.jsx` / `.css`: touch zones, safe areas, the landscape-only controller.
4. The **shared components** (design.md, Shared components). Open `#/components` to see each one in every state, and use them before writing your own: status lines, team chips and seats, room codes, the score bar, the countdown, the game board, and the sound components.
5. `references/recipes.md` in this skill folder: ready-made patterns for buttons, cards, fields, status lines and the TV frame.
6. The issue you are working on, especially its acceptance criteria.

Other skills cover the rest: **game-feel** for effects on game events, **game-audio** for sound, and **mvp-feature** for the model and presenter side.

## Step 2: Write the brief

Before code, write these six lines in your notes or your reply:

```
Screen:          route and View file
Device:          TV read from the sofa / phone in the hand, portrait / phone sideways, not looked at
Player's goal:   one sentence, in the player's own words
Primary action:  the one thing they should do next (one per screen)
Loudest thing:   what the eye must hit first
States:          loading, empty, error, content + disabled, long names, 0 and 4 players
```

If you can't fill in "Primary action" or "Loudest thing" in a few words, the screen does too much. Split it, or ask the developer.

Example for the TV lobby (issue #24):

```
Screen:          #/tv, lobbyView
Device:          TV, read from 2-3 m, nobody touches it
Player's goal:   "Get my phone into the game and onto a team."
Primary action:  join on your phone (scan the QR code or type the room code)
Loudest thing:   the room code and the QR code
States:          creating the room, 0 players, 1-3 players, 4 players ready, connection lost
```

## Step 3: Block out the layout in text

Draw the zones as a text sketch, in order of importance, before writing CSS. Decide:

- One column or two? Phone screens are one column. TV screens are at most two or three zones.
- What is fixed and what scrolls? On the TV nothing scrolls. Phone portrait screens should fit one screen when they can.
- Where is the primary action? Right after the content it acts on, and on a phone within thumb reach.

```
+------------------------------------------------------------+
| PUSH/PULL                              Stockholm, windy    |  quiet header
|                                                            |
|  Join on your phone                       +----------+     |
|  pushpull.live                            | QR code  |     |
|  [4] [K] [Q] [7]          <- loudest      +----------+     |
|                                                            |
|  Team A: Ada, open seat          Team B: Bo, open seat     |
|                                                            |
|  Waiting for 2 more players…              <- status, words  |
+------------------------------------------------------------+
```

## Step 4: Build in this order

1. **Markup that works without CSS.** `main`, a heading per section, headings in order, real `<button>`, `<a>` and `<label>`. If it reads well unstyled, the structure is right.
2. **Layout.** Grid or flex with `gap`. Spaces from the spacing ladder below.
3. **Type.** Sizes and weights from tokens. Decide the three sizes this screen uses.
4. **Colour.** Surfaces by fill. Colour only where it means something.
5. **States and feedback.** Pressed, focus, disabled, pending, error.
6. **Motion last,** and only where it explains a change.

## Taste rules

### Hierarchy: one loudest thing

- Each screen has **one** loudest thing. Make it clearly bigger, not a little bigger: skip at least one step on the type scale between levels (body 16 under a 24 title, not under 20).
- At most **three text sizes and two weights** per screen. Create levels with size first, then weight, then colour (ink against muted). Not with boxes, lines or icons.
- **One primary button** per screen (ink fill). Everything else is secondary (sunken fill) or a text link.
- **Squint test:** blur your eyes at the screenshot. The loudest thing and the primary action must still stand out. If everything melts into one grey area, the levels are too close.

### Spacing: closeness shows what belongs together

Things that belong together sit closer than things that don't. Use this ladder:

| Between | Token |
|---|---|
| An icon and its text, a label and its input | `--space-1` to `--space-2` |
| Items in a list, buttons in a group | `--space-3` to `--space-4` |
| Padding inside a card | `--space-4` on phones, `--space-5` on wider screens |
| Cards, or groups of content | `--space-5` to `--space-6` |
| Page sections, page padding on wide screens | `--space-7` to `--space-8` |

- Put `gap` on the parent, not margins on the children.
- Be generous **between** groups, not inside them. Crowded looks cheap. The Toy box look is chunky.
- The same kind of thing gets the same spacing on every screen. Copy values from the nearest View.

### Alignment

- Give every column one strong left edge. Left-align text. Centre only short things that stand alone: a lone status message, "Turn your phone sideways", a score.
- Centre icons on their text with `display: flex; align-items: center; gap: var(--space-2)`.
- Numbers that change (scores, timers, codes) use the `.numbers` class so the digits don't jump.
- Keep paragraphs readable: `max-width: 42ch`, as `.home-lead` does.
- Headings: `text-wrap: balance` so they don't leave one word alone on the last line.

### Type

- **Display font** (`--font-display`) for a few words only: the logo, headings, scores and big numbers. Never for sentences or buttons.
- **Text font** (`--font-text`) for everything else.
- Line height around 1.1 to 1.25 for display headings. Body text already gets 1.45 from tokens.css.
- Sentence case everywhere ("Join room", not "Join Room" or "JOIN ROOM"). The only all-caps text is the PUSH/PULL logo.
- Body text is at least `--text-body` on phones. Inputs too, or iPhones zoom in.

### Colour

- **Colour means something or it isn't there.** Team colours mean teams. Success, warning and error mean status. Everything else is ink, muted and the three surfaces.
- Surfaces go `--color-bg`, then `--color-surface` (a card), then `--color-sunken` (inputs and groups inside a card). Never put a card inside a card.
- Orange is never a text colour. Ink goes on orange, white goes on blue.
- A team colour always comes with the team's name, letter or player names.
- The error colour is for the error message, never a whole screen or card.

### Depth and shape

- **Flat.** No shadows, no borders around cards, no gradients, no blur or glass, no glow.
- `--radius` for cards, buttons, inputs and chips. `--radius-small` for small parts inside them. `--radius-round` only for circles.
- A rounded thing inside a rounded thing gets a smaller radius than its parent, or the corners look uneven.

### Feedback and status (graded: "feedback on user actions", "visibility of system status")

- Every press shows a change **at once**: the pressed state has no transition (see the controller rules in design.md).
- While waiting, **say what is happening in words**: `PushMark` plus a sentence like "Joining room 4KQ7…". Disable only the button that is waiting. The rest of the screen keeps working (a course requirement for grade C and up).
- After success, show the result **where the player is already looking**. No pop-up toasts.
- An error says what went wrong in the player's words, what to do next, and has a "Try again" button. Keep whatever they typed.
- Never a blank screen, a silent failure, `alert()`, or a raw error code.

### Words on screen

- Write like a friend explaining the game at a party: short, concrete, warm.
- Buttons say what they do, as a verb and a thing: "Join room", "Start round", "Try again". Never "OK", "Submit" or "Click here".
- Use the same word for the same thing everywhere ("room code" everywhere, never "PIN" in one place).
- Show progress as numbers people count: "2 of 4 players", "Round 3 of 5".
- An empty state says what is missing and what to do: "No games yet. Join a room to play your first one."
- Use "…" (one character) for something in progress.

### Motion

- Motion explains something: it arrived, it moved, it changed, it counted. If it explains nothing, remove it.
- `--duration-fast` for presses and toggles, `--duration` for panels and score changes, easing `--ease-out`. Nothing loops except a loading indicator.
- Animate `transform` and `opacity` only. They stay smooth; `width`, `height`, `top` and `left` stutter.
- tokens.css turns durations to 0 for reduced motion. Animation you start in JavaScript must check `matchMedia("(prefers-reduced-motion: reduce)")` itself.
- When a score changes on the TV, make that number pop once so people on the sofa notice. A React `key` on the number replays its animation when it changes. Add a token for the scale first.

### Phone

- Touch targets are at least `--hit-min`. Controller buttons are at least `--controller-button`.
- Inputs get the right `type`, `inputmode`, `autocomplete` and `enterkeyhint` (a room code: `inputmode="text"`, `autocapitalize="characters"`, `autocomplete="off"`).
- Respect the notch and home bar with `env(safe-area-inset-*)`, as controllerView.css does.
- Hover is a bonus, never the only way to see something. Phones have no hover.
- The controller is used **without looking at it**: big zones, instant feedback and confirmation from the TV. Follow the ten controller rules in design.md exactly.

### TV

- **Sofa test:** look at the 1920×1080 screenshot shrunk to a quarter. Anything you can't read is too small.
- Nothing scrolls. Everything sits inside `--tv-safe`. No text smaller than `--tv-text`. Use only the `--tv-*` sizes.
- Three to five things on screen, not more. The board and the scores are always the loudest.
- The TV is where the whole room sees that something happened, so the "it counted" feedback for phone actions shows here.

## The generic look: what to avoid

These make a screen look machine-made. Never use them here.

| Don't | Do instead |
|---|---|
| Gradients, gradient text, glass blur, glow, neon | Flat token fills |
| Shadows on cards, a border around every box | Separate surfaces by fill colour |
| A card inside a card inside a card | One surface level, grouped with spacing |
| Emoji as icons | Material Symbols Rounded, with the meaning in text |
| Everything centred | One left edge, centre only lone short items |
| A big headline + tagline + two buttons on every screen | Start with the screen's actual job |
| Many font sizes (13, 15, 18, 22...) | Three sizes from tokens |
| Random spaces (13px, 22px, 1.3rem) | The spacing ladder |
| Grey text on coloured backgrounds, thin light text | Ink or muted, weight 400 or more |
| A placeholder used as the label | A visible label above the input |
| Icon-only buttons | Icon + text (on the controller: icon + short label) |
| "Welcome!", "Submit", "Click here", lorem ipsum | Real, specific words |
| A spinner with no words | `PushMark` + a sentence saying what is loading |
| Things that bounce, float or fade in for fun | Motion only when something changes |
| A modal or `alert()` for a simple message | Inline text where the player is looking |
| The whole screen disabled while loading | Disable only the button that is waiting |
| Text that breaks on long names | Test with "Maximiliana Oxenstierna" and handle it (`overflow-wrap: anywhere` or one line with an ellipsis) |

## Quick fixes that almost always help

When a screen feels off and you don't know why, try these in order:

1. Make the loudest thing bigger and everything else quieter (muted colour, smaller size).
2. Remove a box, border or icon, and group with space instead.
3. Add more space **between** groups.
4. Left-align the text block.
5. Cut the text in half.
6. Make one button primary and the rest secondary or links.
7. Align every edge to the same few lines.

## Step 5: Look at it (mandatory)

1. Start the dev server in the background: `npm run dev` (port 8080).
2. Take screenshots: `npm run shots -- "#/your-route"` (the same as `node .agents/skills/ui-design/scripts/screenshot.mjs "#/your-route"`)
   - Sizes: small phone 360×640, phone 390×844, phone sideways 844×390, laptop 1280×720 and TV 1920×1080. Reduced motion is on, so animations don't blur the picture.
   - It warns when a page scrolls sideways, when a TV-sized page scrolls at all, and when the page throws an error.
   - To see another state, run a model action first: `--js="myModel.setCityQuery('Stockholm'); myModel.findWeather()"`. `myModel` and `roomModel` are on `window` in dev. For a state that's hard to reach, change the starting value in the model locally, take the screenshot and **undo it before you commit**.
   - For a state behind a button, press it first by its text: `--click="Enter controller"` (repeat for more, in order). `npm run shots:controller` does this for the controller. A size where the button isn't shown is skipped with a note.
   - Each run saves into its own folder, named after the first route or `--name=<folder>`. The script prints the paths.
   - First time only, if the browser is missing: `npx playwright install chromium`. Playwright itself comes with `npm install` (see CONTRIBUTING.md, one-time setup).
3. **Open every image and look at it.** Write one sentence: what does the eye hit first? If it isn't the "Loudest thing" from your brief, fix that before anything else.
4. Score it with the rubric below. Fix everything under 4, take new screenshots and score again. Stop after three rounds and report what is left.

If you can't run a browser (no Playwright, no network, a sandbox), say so plainly in your report and list the five things the developer should check by eye. Never say a screen looks good if you haven't seen it.

## Rubric

Score each from 1 to 5. Ship at 4 or more on every line.

1. **Focus:** within 3 seconds the eye lands on the loudest thing, and the primary action is obvious.
2. **Rhythm:** every space is from the ladder, and groups read as groups.
3. **Alignment:** clean edges, nothing a few pixels off, no stray centred bits.
4. **Consistency:** it looks like it belongs next to the home and login screens.
5. **States:** loading, empty, error, disabled and long text are designed, not just present.
6. **Feedback:** every press visibly lands at once, and status is written in words.
7. **Words:** short, specific and friendly, and buttons are verbs.
8. **Fits the device:** readable from the sofa (TV), usable without looking (controller), one thumb (phone).
9. **Restraint:** try removing one element. If the screen still works, leave it out.
10. **Access:** visible labels, focus ring, contrast pairs from design.md, and colour never alone.

## Step 6: Before you say done

1. Go through the PR checklist in `docs/design.md`.
2. Look for hard-coded values in the CSS you touched. This should print nothing:
   `grep -nE "#[0-9a-fA-F]{3,8}\b|box-shadow|linear-gradient|font-size: *[0-9.]+(px|rem)|[0-9]+ms" src/views/*.css`
3. Run `npm run build`.
4. Report to the developer:
   - the brief,
   - which screenshots you looked at and what you changed after looking,
   - the rubric scores,
   - what you could not check (for example a real iPhone, or the sofa distance),
   - a short plain-language explanation of the View they could repeat to a teacher (an AGENTS.md rule).

## Reviewing someone else's UI

Use the rubric and the "generic look" table. Give the **three** changes that would help most, the biggest first, each with the exact CSS or JSX change. Don't list twenty nitpicks.

## When the design system doesn't have what you need

Don't invent a one-off colour, size or effect. Use the nearest token. If a value is really missing, add it to tokens.css and design.md in its own small PR first (AGENTS.md). Don't add a UI library, font or icon set without the team agreeing.
