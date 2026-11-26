---
name: game-feel
description: Add or tune the visual effects that make Push/Pull feel alive - apple bursts, crash sparks, board shake, score pops, the countdown, winner banners, seat pops and button feedback. Use for any animation tied to something that happens in the game, for "make it feel better" or "more satisfying", and when adding a new game event. Use game-audio for the sound and ui-design for the screen around it.
---

# Game feel: every action should feel like it landed

"Very good feedback on user actions" is graded, and in a party game feedback is half the fun. Agents usually get it wrong in one of two ways: no effects at all, or effects everywhere that hide the game. They also can't see an animation in a normal screenshot, so they never check what they made. This skill gives you the rules, the recipes and a way to look at an effect frame by frame.

Read with it: `docs/design.md` (Game feel, Motion, Shared components) and `src/styles/tokens.css` (the effect tokens).

## The rules in one list

1. Every game event answers on three channels: a picture on the TV, a sound on the TV and a buzz on the phone. The Game feel table in design.md says which. A new event gets a row in that table first, in its own small PR.
2. The model says what happened, the View shows it. The model keeps a short list of recent events `{ id, kind, team, x, y }`. A View never works out events by comparing the old and new board.
3. Short: `--duration-effect` or less. Only round-level moments (countdown, winner banner) take longer.
4. The board stays readable: nothing covers a snake head or the apple for longer than one tick, and at most eight particles.
5. Team colour for team events, ink for neutral ones. Bigger event, bigger effect.
6. No full-screen flashes, and nothing flashes more than three times a second.
7. Reduced motion turns the effect tokens to 0. The effect must then end invisible, and the game must still make sense.
8. On the board, effects are drawn by `boardPainter.js` in GameBoard's one animation loop. Everywhere else, CSS keyframes on `transform` and `opacity`. Tokens for every colour and duration, and no extra timers per effect.
9. Look at the frames before you say you're done (step 6).

## Step 1: Load the context

1. design.md: the Game feel table and its rules, Motion, Shared components.
2. `src/views/boardPainter.js`: the board's burst, swallow bulge, crash flash and shake are the house style for board effects. Copy their pattern: a function that gets the effect's age and draws it, fully visible for the first half, then fading. For effects outside the board, the `pop` keyframes in tokens.css and `scoreBar.css` are the pattern.
3. Open `#/components` and press the board buttons to see the existing effects.
4. If the event is new, check with the model owner (README Team table) that the model will emit it (#27 is the game model).

## Step 2: Write the effect brief

```
Event:        what happened, in the player's words ("Team B's snake ate an apple")
Caused by:    a team, a player or nobody
Where:        a cell (x, y), a screen area (score bar, seat) or the whole screen
Size:         small (happens often) / medium / big (once a round)
How often:    every few seconds / a few times a round / once a round
Must stay readable: what must never be covered (snake heads, apple, score)
Channels:     picture + sound name + phone buzz, from the Game feel table
```

Small and frequent means short, quiet and close to where it happened. Big and rare can take the whole screen for a moment.

## Step 3: Get the event from the model

The shape is `{ id, kind, team, x, y }`. `id` is unique and grows, `kind` is also the sound name (`eat`, `crash`, `point`...), `team` is `"a"` or `"b"` when a team caused it, and `x`/`y` is the cell for board events. The model keeps the events of the last second or so. The presenter passes the list as a prop, and the same list goes to `GameBoard` (pictures) and `SoundCues` (sounds).

If the model doesn't emit the event yet, say so and ask the model owner. Don't detect it in the View.

## Step 4: Pick a recipe

| Effect | How | Use for |
|---|---|---|
| Pop | Give the element a new React `key` when the value changes and `animation: pop var(--duration-effect) var(--ease-out)` (the `pop` keyframes are in tokens.css). It needs `display: inline-block` | Score, timer, seat filled, any number that changed |
| Burst | Up to eight dots flying `--burst-distance` and fading (`paintBurst` in boardPainter.js) | Something collected or gained |
| Ring | A circle that grows and fades (also in `paintBurst`) | Marks where something happened |
| Travel | A shape moving along the snake's body (`pointAlong`, used for the swallow bulge) | Something passing through a snake |
| Shake | The whole board moving `--shake-distance` back and forth, fading (`shakeOffset`) | Crashes only. Never for small events |
| Enter | `opacity` from 0 and `transform: scale()` or `translateY()` into place, `animation-fill-mode: both` | Countdown numbers, banners, new things on screen |
| Flash | One or two changes of fill colour, never the whole screen | Confirming a phone press on its button (Controller rule 4) |

Timing:

- Arrivals use `--ease-out`: fast start, soft landing. The biggest change happens at the start, which is when the eye needs it.
- Keep an effect fully visible for the first half, then fade (see `paintBurst`). An effect that starts fading at once is gone before anyone sees it.
- Several particles may be staggered by up to 40ms. More than that feels slow.
- Effects outside the board sit in their own layer with `pointer-events: none` and `aria-hidden="true"`, so they never block a press or confuse a screen reader. On the board they are part of the canvas picture, and the board's `label` says what matters in words.

## Step 5: Pair it

- **Sound:** pass the same event list to `<SoundCues cues={events} />`. If `kind` has no sound yet, use the game-audio skill to add one.
- **Buzz:** phone buzzes come from the controller (design.md, Controller rule 3). A short buzz is `--press-vibration-ms`, a long one three times that.
- **Words:** for big moments (round won, tie) the screen also says it in text, so the effect is never the only signal.

## Step 6: Look at the frames (mandatory)

A normal screenshot catches an effect at a random moment, or not at all. Capture it frame by frame:

```
npm run dev   # keeps running: start it in its own terminal or in the background first
node .agents/skills/game-feel/scripts/capture-frames.mjs "#/components" --click="Team A eats" --selector=".gallery-board"
```

It presses the button, then moves time forward exactly: Playwright's paused fake clock drives the canvas, and every CSS animation is paused at the same time. It saves frames at 0, 60, 120, 200, 300 and 450ms, then one frame with reduced motion. Use `--js="..."` to start an effect with a model action instead of a click, and `--times="0,100,200"` for other times. Frames land in the system temp folder under `pushpull-frames`.

Open the frames and check:

1. **60 to 120ms:** the effect is clear, in the right place and in the right colour.
2. **200 to 300ms:** it is fading, and the snake head and the apple are visible again.
3. **450ms:** nothing is left.
4. **Reduced motion:** nothing extra on screen, and the change itself (longer snake, new score) is still visible.
5. **Next to the other effects:** this one is the right size for its event (eat smaller than crash, crash smaller than winning).

If something fails, fix it and capture again. If you can't run a browser, say so and list what the developer should look at on `#/components`.

## The noisy look: what to avoid

| Don't | Do instead |
|---|---|
| Confetti, glow or sparkles on every event | One small effect, sized to the event |
| Shake on every apple | Shake only on crashes |
| Effects longer than half a second | `--duration-effect`, fully visible for the first half |
| Full-screen flashes or blinking | A local ring, burst or pop |
| A `setTimeout` or animation loop per effect | Board: a draw function in boardPainter.js. Elsewhere: CSS keyframes, replayed with a new `key` |
| Hard-coded colours, sizes or durations in keyframes | Tokens (`--effect-colour` set from team tokens) |
| Animating `width`, `top` or `margin` | `transform` and `opacity` |
| The View comparing old and new boards to spot events | Events from the model, animated by `id` |
| Effects that ignore reduced motion | Tokens drop to 0, `animation-fill-mode: both` ends invisible |
| An effect with no sound or no words for a big moment | All three channels from the Game feel table |

## Before you say done

- [ ] The event has a row in the Game feel table, and the picture matches it.
- [ ] Only tokens in the CSS (the ui-design grep prints nothing).
- [ ] The frames from step 6 pass all five checks.
- [ ] The same event list feeds `GameBoard` (or your component) and `SoundCues`.
- [ ] Tell the developer, in plain words, what the effect does and why it lives in the View and not the model.
