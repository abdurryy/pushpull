---
name: game-audio
description: Make, change or hook up Push/Pull sound effects and music. Use for any work with sound - a new or changed effect, a music track or layer, the mix and loudness, playing sounds for a game event on a screen, the sound on/off setting, or "make it sound better". Also use when reviewing sound code.
---

# Game audio: sounds people want to hear twice

Agents can't hear. So they write sounds that are harsh, too loud or too quiet, clash with the music, or get annoying by the tenth time. This skill fixes that with sound design rules, a script that measures every sound, and a short listening check for a person.

Read with it: `docs/design.md` (Sound and Game feel), and the code in `src/sound/` (`instruments.js`, `effects.js`, `music.js`, `soundPlayer.js`). Everything is synthesized with the Web Audio API. There are no audio files.

## The rules in one list

1. Only the TV plays sound. Phones buzz.
2. Sound is output, like a View. Views play it through `MusicTrack`, `SoundCues` and `SoundToggle`. The model, presenters and persistence never import `src/sound/`.
3. Every sound has a picture or words that say the same thing (Game feel table). Never sound alone.
4. Effects use only the notes C, D, E, G and A. Every track's key contains them, so effects never clash with the music. Team B's version is a fourth higher (F, G, A, C, D), which also fits every key.
5. Build sounds from the instruments in `instruments.js`. No raw square or sawtooth beeps, no recordings.
6. Measure before you ship: no peak above -1 dBFS, every effect within 6 dB of the others, and the music about 6 dB under the effects (step 6).
7. A person listens before the user test. You can't, so say so.

## Step 1: Load the context

1. design.md: the Sound section (feel, tracks, mix rules) and the Game feel table (which event gets which sound).
2. `src/sound/effects.js` and `music.js`: the existing sounds are the house style. Copy their patterns.
3. `#/components`: every effect and track can be played there.

## Step 2: Write the sound brief

```
Event:      what happened ("Team B's snake ate an apple")
Meaning:    good / bad / neutral / information
Size:       small (often) / medium / big (once a round)
Team:       does Team A sound different from Team B?
How often:  every second / a few times a round / once
Picture:    the effect or words it pairs with
```

## Step 3: Design the sound

**The shape of the pitch carries the meaning.** Players learn it without being told:

| Meaning | Shape | Example in effects.js |
|---|---|---|
| Good, gained something | Rising notes | `eat` (E5, A5), `point` (C5, E5, G5), `join` |
| Bad, lost something | Falling notes or a falling slide | `crash` (thud and drop), `leave` |
| Neutral, information | One note or a repeated note | `count`, `tick`, `tie` |
| Arrival, achievement | A run that lands on a chord | `go`, `win` |

**Size grows with the event:** small events are 1 to 2 notes and under 0.2 s, medium ones 3 notes or a thud, big ones a run and a chord of up to about 1 s. Frequent sounds are the shortest and quietest.

**Register:** effects live around C5 to C6, above the melodies (A4 to E5) and far above the bass, so they cut through without covering the music. Low sounds are only for crashes.

**Timbre (instrument):** marimba for gains and melodies, pluck for chords, woodblock for ticks and counts, thud and drop for crashes, blip, swoosh and snip for the action buttons. Add a new instrument to `instruments.js` only if none of these fits, and keep its comment explaining what it imitates.

**Repetition:** `playSound` already varies the pitch by up to 3% and blocks the same sound within 50ms. Don't add your own randomness on top.

To add an effect: write a function in the `soundEffects` object in `effects.js` with the signature `(output, time, pitch, team)`, using `melody(...)` and `pitchFor(team, pitch)` like the others. `SOUND_NAMES` and the `#/components` buttons pick it up by themselves.

## Step 4: Write or change music

A track in `music.js` is a tempo plus layers. Each layer has an instrument, a volume and a list of bars. Each bar is 16 steps (sixteenth notes), written in groups of four so beats line up: `"A4 . C5 .  D5 . E5 .  . . D5 .  C5 . A4 ."`. `.` is a rest, `x` is a drum hit and `A3+C4+E4` is a chord. A layer with `from: 1` only plays in the last 10 seconds, and `octave: 1` plays it an octave up.

- **Pick the progression by mood:** driving and tense i - VI - III - VII (Am F C G), happy I - V - vi - IV (C G Am F), relaxed I - vi - IV - V (F Dm Bb C), thinking i - VI - iv - V (Dm Bb Gm A).
- **Tempo:** 84 to 100 BPM for waiting and thinking, 110 to 130 for action.
- **Melody:** notes from the key's pentatonic scale. Write 8 bars as two 4-bar phrases: the first ends away from the home note (a question), the second ends on it (the answer). Leave rests. A melody that never stops leaves no room for the effects.
- **Layers and their usual volumes:** kick 0.45 to 0.6, clap about 0.25, shaker or hat 0.08 to 0.12, bass about 0.4, chord stabs about 0.1 per note, arpeggios about 0.2, melody about 0.3.
- **Intensity layers add, they never change** the tempo or key, so the switch at 10 seconds lifts the energy without a jolt.
- **Length:** a track heard for more than 30 seconds needs at least 8 bars of melody, or it starts to feel like a loop.

## Step 5: Hook sound into a screen

Follow the mvp-feature skill for the layers:

- **Model:** the list of recent events (`{ id, kind, team, x, y }`) and a `soundOn` setting with one action to toggle it. Ask the model owner if they don't exist yet.
- **Presenter:** passes `events`, `soundOn` and `onToggleSound`.
- **View:** renders one `<MusicTrack name="round" intensity={lastTenSeconds ? 1 : 0} muted={!props.soundOn} />`, `<SoundCues cues={props.events} />` and `<SoundToggle muted={!props.soundOn} onToggle={props.onToggleSound} />`.

Never call `playSound` from the model or a presenter.

## Step 6: Measure, then get a person to listen (mandatory)

```
npm run dev
node .agents/skills/game-audio/scripts/render-audio.mjs            # everything
node .agents/skills/game-audio/scripts/render-audio.mjs eat round  # only these
```

It renders each effect (Team A and B) and each track (normal and last 10 seconds) offline in Chromium with the real mixer, saves WAV files in the system temp folder under `pushpull-audio`, and prints the peak and loudness (the loudest 50ms). It warns about peaks near clipping, effects more than 6 dB from the median, and bars that don't have 16 steps. Fix every warning and run it again.

Today's reference levels: effects median about -17 dB loudness, music about -22 dB, the loudest peak -1.5 dBFS.

Then give a person something to listen to. Convert the files with `ffmpeg -i in.wav -b:a 128k out.mp3` and attach them, or point them to `#/components`. Ask them to check:

1. Can you tell what happened from the sound alone, without looking?
2. Can you tell Team A from Team B?
3. Is anything annoying after hearing it 20 times in a row?
4. Does any effect disappear under the music, or jump out of it?
5. Does the last-10-seconds layer raise the tension without stressing you out?
6. Is the music still pleasant after three loops?
7. On the TV's own small speakers, can you still hear the bass and the kick?

If you couldn't run the script, say so. Never say a sound "sounds great": you haven't heard it.

## The bad-game-audio look: what to avoid

| Don't | Do instead |
|---|---|
| Square or sawtooth beeps | Instruments from `instruments.js` |
| Audio files or sound libraries | Synthesize, like the rest |
| Sound on the phones | Buzz on the phone, sound on the TV |
| `playSound` in the model or a presenter | `SoundCues` with the model's event list |
| Effects with notes outside C, D, E, G, A | Stay on those five (and the fourth-up set for Team B) |
| The same sound for good and bad events | Rising for good, falling for bad |
| Long sounds for frequent events | Under 0.2 s for anything that happens often |
| Music that never pauses | Melodies with rests |
| Starting sound before a press | `soundPlayer.js` waits for the first press already |
| Information only in sound | A picture or words as well |

## Before you say done

- [ ] The sound matches its row in the Game feel table, and the table is updated if the event is new.
- [ ] `render-audio.mjs` prints no warnings.
- [ ] A person has listened, or the report says nobody has yet.
- [ ] Nothing outside `src/views/` imports `src/sound/`.
- [ ] Tell the developer, in plain words, how the sound is built (instrument, notes, timing) and why it lives next to the Views.
