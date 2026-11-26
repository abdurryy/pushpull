---
name: user-testing
description: Plan, run and write up Push/Pull user tests the way the course grades them (30 min at the prototype stage, 30 min of formative evaluation, documented and creative improvements). Use when preparing a test session, writing test tasks or questions, turning notes into a docs/user-testing file, or turning findings into issues. Also use for any school text in this repo, such as reports and write-ups, because it has the writing rules.
---

# User testing: learn from real players, and show it

For grades B and A, user consultation has to be documented, with improvements made because of it (`docs/course/project/grading-criteria.md`, Usability; `docs/user-testing/README.md`). A good test finds the moments where players get stuck or bored. A good write-up shows a teacher what you saw, what you changed and why. Agents tend to write test plans that lead the tester and write-ups that sound like a press release. This skill fixes both.

## What the course asks for

| Grade | Documented user consultation |
|---|---|
| C | One 30 min session at the prototype **or** evaluation stage, plus the improvements |
| B | 30 min prototype **and** 30 min formative evaluation (or 2 × 30 min formative), plus the improvements |
| A | At least 30 min at the prototype stage **and** 30 min formative, with **creative** improvements |

Testers come from the target group: friends and students who meet with one TV or laptop and their phones. Write down how long each session took.

## Step 1: Plan the session

Write this plan before the session, in the issue for the test (#31 is test 1):

```
Question:     the one thing we most want to learn ("Do teammates understand that they steer one snake together?")
Stage:        prototype (paper, Figma) or formative (the deployed app, link or commit)
Testers:      3 to 5 from the target group, no full names
Roles:        facilitator (talks), note-taker (writes), and for paper tests a "computer" who moves the paper snakes
Time:         30 min (see the schedule below)
Tasks:        3 to 5, written as goals
Questions:    5 to 7, open and not leading
```

A 30 minute schedule:

| Minutes | What |
|---|---|
| 0 to 3 | Welcome, what we're testing (the app, not them), ask if notes and photos without faces are OK |
| 3 to 6 | Set up: phones, TV, teams. Explain as little as a real host would |
| 6 to 21 | Tasks, with thinking aloud. Don't help unless they're completely stuck, and write down when you do |
| 21 to 28 | Questions |
| 28 to 30 | Thanks, anything they want to add |

## Step 2: Write tasks as goals, not instructions

| Leading (bad) | Goal (good) |
|---|---|
| "Tap Join and type the code K7M4" | "Get your phone into the game on Team B" |
| "Press the Dash button" | "Try to reach the apple before the other team" |
| "Look at the score bar" | "Who's winning right now, and how do you know?" |

## Step 3: Write questions that don't lead

Open questions that ask about what happened, not opinions about the design:

- "Could you tell when your press counted? How?"
- "What happened when you and your teammate pushed different ways?"
- "Was there a moment you didn't know what to do? What did you do then?"
- "What was the most fun moment? The most annoying one?"
- "If you could change one thing, what would it be?"
- "On a scale from 1 to 5, how much would you want to play another round?" (a number makes rounds comparable)

Avoid "Did you like the colours?", "Was it easy?" or "Don't you think the controller is clear?". They invite polite answers.

## Step 4: Take notes during the session

The note-taker writes one line per observation, with the time:

```
| Time | Task | What happened | Quote | Severity |
| 7:40 | Join | Typed O instead of 0 in the code | "is that a zero?" | 2 |
```

Severity: 1 = cosmetic, 2 = slows them down, 3 = blocks them. Write what people did and said, not what you think they meant. Count things: "3 of 4 testers looked at their phone during the round" beats "testers were confused".

## Step 5: Turn notes into findings and changes

1. Group lines that are about the same problem. One finding = one problem, with how many testers hit it.
2. Rank by severity × how many testers hit it.
3. For each of the top findings, decide a change. For grade A, at least one change should be **creative**: it goes beyond fixing the bug and finds a new way to help (for example "players looked at their phones, so the TV now shows a ring around the snake for every press", not just "made the button bigger").
4. Open an issue for each change with the task template and a link to the write-up.

## Step 6: Write it up

One file per session: `docs/user-testing/YYYY-MM-DD-<what>.md`, using the template in `docs/user-testing/README.md`, with pictures in `docs/user-testing/img/`. Add:

- the plan (question, stage, version, testers, roles, how long it took),
- the tasks and questions as asked,
- the findings table (finding, how many testers, severity, a quote),
- what we changed because of it, each with a link to the issue and later the PR. Update the links when the PRs merge.

## Writing rules for school text

These apply to the write-up and to any other report or text that goes to the teachers:

- **Plain, human language.** Short sentences. Write like you'd explain it to a classmate.
- **Simple words.** If there is a simpler word, use it: "use", not "leverage"; "help", not "facilitate"; "important", not "crucial"; "look at", not "delve into".
- **No long dashes.** Never use the long dashes (— or –). Use a comma, a colon, a full stop or a short "-" instead.
- **Facts over adjectives.** "3 of 4 testers missed the code box" instead of "testers had significant difficulties".
- **"We" for the team,** past tense for what happened.
- **No full names** of testers and no photos of faces.
- **No mention of AI tools** (AGENTS.md).

Check a file before you hand it over:

```sh
grep -nE "—|–|leverage|seamless|robust|delve|crucial|utili[sz]e|facilitate|enhance|showcase|streamline" docs/user-testing/*.md
```

It should print nothing.

## Before you say done

- [ ] The session was at least 30 minutes, and the file says how long it took.
- [ ] Testers are from the target group and aren't named.
- [ ] Every finding says how many testers hit it, and gives a quote or an observation.
- [ ] Every change links to an issue (and to its PR once merged), and at least one change is creative.
- [ ] The writing check above prints nothing.
