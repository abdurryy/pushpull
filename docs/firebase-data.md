# Firebase data map for profiles and rounds

Use this map to find the path, writer and lifetime for a field. The first section describes the rules and client on `main`. The remaining sections are the proposed contract for [#22](https://github.com/abdurryy/pushpull/issues/22), [#30](https://github.com/abdurryy/pushpull/issues/30), [#103](https://github.com/abdurryy/pushpull/issues/103), [#122](https://github.com/abdurryy/pushpull/issues/122) and [#130](https://github.com/abdurryy/pushpull/issues/130).

## Current room paths

Any authenticated user who knows a code can read `rooms/{code}` and its children. The room list at `rooms` is denied. Join currently reads metadata and then reads the whole room to check existing membership and free seats. There are no Realtime Database rules or writes for `users/{uid}`, shared phases, round results or ballots. Firebase Auth supplies the signed-in user's UID, name and photo URL to the app model. [Current rules](../database.rules.json) · [Room service](../src/persistence/roomSync.js) · [App model](../src/model/PushPullModel.js)

| Path under `rooms/{code}` | Fields, defaults and validation | Writer and lifetime |
| --- | --- | --- |
| `meta` | `hostUid` is the creator's UID. `expiresAt` is Unix milliseconds, in the future and at most 24 hours from the rule's server time. The client reserves a four-character code and uses roughly a day. | The host reserves once with `createRoom`. A host can delete the whole room. After expiry any signed-in user can delete it under the current rules. Expiry blocks new activity and does not itself schedule deletion. |
| `hostOnline` | A boolean, absent until the host registers. Only `true` signals presence. | The host sets it on connect and registers `false` for disconnect. It ends with the room. |
| `seats/{seat}` | `s1` through `s4` map to UIDs. The map starts absent. A claim must match the player's seat in the same write. | Each player claims an unoccupied seat and can release their own along with their player record. |
| `players/{uid}` | `name` is 1–80 characters, initially the trimmed Auth name or `Player`. `side` starts at `center` and can be `a` or `b`, at most two on each team. `seat` must match the reserved seat and stays fixed. | Each signed-in player writes their own record. Joining and leaving update the seat and player together. |
| `inputs/{uid}` | `stick` is `idle` or a cardinal direction. Optional `button` is `dash`, `ping`, `shed` or `hold`. Optional `buttonAt` is a timestamp at or before server time. An absent record is neutral. | Only the player can publish their input. The client clears it on disconnect, reconnect and leave. Closing the room removes all input records. |

The current game board, clock, score and result are local to the TV's game model. The room model and persistence code are coordinated by Abdurrahman, with Faraz proposed for room sync and Firebase. Aryan owns the game model. [Room model](../src/model/RoomModel.js) · [Game model](../src/model/DemoModel.js) · [Team ownership](../README.md#team)

## Proposed access and rollout

- **Private user data.** Grant reads at `users/{uid}` only to the matching authenticated UID. Put writes on `profile` and individual `matchHistory` entries so each can have its own policy. Keep Auth credentials and private preferences out of rooms.
- **Room data.** Grant a whole-room read only to the host and current members. A member has a player record and the matching seat claim. Before joining, a signed-in user with the code can read `meta` and their own `players/{uid}` record. They can use the existing atomic seat and player claim without reading other guests' records. The host and current members can read the room's ballot choices, cast votes and shared results.
- **Change join before tightening reads.** Replace the pre-join whole-room reads in `roomSync.joinRoom` first. Check metadata and the caller's own record, then try the four seat claims against the existing occupancy rules. Recheck metadata and own membership after a rejected claim to distinguish an expired room or a duplicate join from a full room. Ship the compatible client under the existing rules first, and verify join and reconnect under the narrower rules in [#101](https://github.com/abdurryy/pushpull/issues/101). Tighten the parent read before storing vote data. A child denial cannot undo a broad parent read. [Firebase rule inheritance](https://firebase.google.com/docs/database/security/core-syntax)

## Private profile and history

All rows below are readable only by the account owner. Profile reads and saves belong in the model's persistence side effects. Load defaults only after confirming the account has no saved entry. On account change, detach the old listener, discard unsent changes, ignore late callbacks for that UID and clear its data from the model before loading the next profile. [Profile persistence #22](https://github.com/abdurryy/pushpull/issues/22) · [Phone profile #30](https://github.com/abdurryy/pushpull/issues/30)

| Path under `users/{uid}` | Fields, defaults and validation | Write owner and lifetime |
| --- | --- | --- |
| `profile` | `displayName` is a trimmed 1–80 character string, initially the Auth name or `Player`. `avatar` is an optional HTTPS image URL up to 512 characters, initially the Auth photo or absent. `leftHanded` and `vibration` are booleans, default `false` and `true`. | The signed-in owner updates their profile through model actions and the persistence reaction in #22. Values survive sign-out and other devices. |
| `matchHistory/{roundId}` | Starts absent. A completed round records `modeId`, `team` (`a` or `b`), `outcome` (`a`, `b` or `tie`), `finishedAt` (Unix ms), and nonnegative integer `teamApples` and `teamCancellations`. Count a cancellation once when the team's two sticks first oppose each other. Derive wins and totals from these records. | In #30, the signed-in player's device creates its own entry from a completed shared result if its UID was in the round. A stable round key makes a repeated delivery a no-op. Entries survive the room. The TV writes the shared result and each phone saves its own private history. |

Example value at `users/player-ada` after a completed round

```json
{
  "profile": {
    "displayName": "Ada",
    "avatar": "https://example.test/ada.png",
    "leftHanded": false,
    "vibration": true
  },
  "matchHistory": {
    "-OktB73GeK9TvQYFH2st": {
      "modeId": "double-snake",
      "team": "a",
      "outcome": "a",
      "finishedAt": 1795800075000,
      "teamApples": 3,
      "teamCancellations": 2
    }
  }
}
```

## Shared rounds and votes

The TV remains authoritative for the clock's decisions, game ticks, board positions, weather effects and game results. Store only the phase, deadlines, vote and completed summary for the phones. Use Firebase push IDs for globally distinct round IDs. These IDs also key private history, so a retry reuses the same key and a fresh round always has a new one.

| Path under `rooms/{code}` | Fields, defaults and validation | Write owner and lifetime |
| --- | --- | --- |
| `match` | `phase` is `lobby`, `voting`, `resolving`, `modeIntro`, `countdown`, `playing` or `results`. Absent match data means lobby. `activeRoundId` is absent before the first vote and otherwise references an existing round. After interruption, lobby may retain that round ID for the reason. | The host advances phase in a transaction on `match` that checks the prior phase and active ID. #103 owns entry into voting. #122 owns the handoff and later transitions. Retain the current series until rematch or room removal. |
| `match/rounds/{roundId}` | `number` is a positive integer. `choices.first` is required and `choices.second` is optional and distinct. Both use implemented, approved mode IDs from #81/#82. `eligible` maps the four seats to `{ uid, team }` from the ready roster. `voteClosesAt` is a future server-relative deadline within room expiry. `tieBreakChoice` is one of the offered slots, drawn before voting opens and held fixed. | The host creates the round and freezes its ballot configuration when entering voting in #103/#130. Only the host appends the outcome fields below. Old IDs cannot reopen. |
| `ballots/{roundId}/{uid}` | A single field `choice` is `first` or `second` and the slot must exist. A missing ballot means abstention. For creation the UID must match the authenticated caller, their snapshotted seat and their current seat, and the shared phase and active ID must still be open with server `now < voteClosesAt`. | The voter creates their own entry once in #130. Updates, client deletes during the vote and writes by another UID are denied. Retain accepted ballots through the series for reconciliation and remove them when a new series starts or the room closes. |
| `match/rounds/{roundId}/voteResult` | Optional until resolved. `modeId` is the selected mode ID used by all clients. `votesFirst` and `votesSecond` are integer counts from the accepted ballots, with zero for an absent second slot. The larger count wins. A tie, including zero ballots, uses `tieBreakChoice`. A single-slot ballot always resolves to the first choice. | The host writes it once in #130, after closing the ballot. #103 and #122 read this same mode ID for the intro and round. |
| `match/rounds/{roundId}/countdownEndsAt` and `playEndsAt` | Optional Unix ms deadlines set on phase entry. Use server-relative time, enforce each deadline within room expiry, and enforce countdown completion before play. The mode model supplies the play duration. | The host writes each once. #103 owns the countdown gate and #122 owns the handoff to play, using the clock work in [#93](https://github.com/abdurryy/pushpull/issues/93). |
| `match/rounds/{roundId}/result` or `endReason` | A completed result has `outcome` (`a`, `b` or `tie`), `finishedAt` (server ms) and `teams.a` and `teams.b` with nonnegative integer `apples` and `cancellations`. An abandoned round instead stores `endReason` (`host-disconnected`, `mode-unavailable` or `roster-changed`). It contributes no point or history entry. | The host publishes a result once with the `playing → results` transition. #122 owns shared publication and [#120](https://github.com/abdurryy/pushpull/issues/120) counts completed outcomes once per ID. #122 handles unavailable modes and changed rosters, and uses [#92](https://github.com/abdurryy/pushpull/issues/92) for host loss. |
| `inputs/{uid}/roundId` | Proposed addition to the existing input record. Active input writes carry the round ID that was current when the action occurred. The rule checks current membership, host presence, active ID and `playing`. Input is neutral before play and when the record is absent or belongs to another round. Own-record deletion remains available for cleanup. | #122 stamps the existing player-owned input writes and clears held inputs during transitions. The TV applies only input for the active round. Remove the record on leave or disconnect. |

Keep the host's `match` write grant separate from the player-owned `ballots` branch. Check prior phase, active ID and immutable field changes on writes. Put create-only and delete restrictions in the write rules because Firebase skips validation on deletions. Whole-room deletion still follows the existing host and expiry policy. [Firebase rule conditions](https://firebase.google.com/docs/database/security/rules-conditions)

The host first commits `voting → resolving` after all eligible ballots arrive or the server deadline passes. That transition closes the ballot to later writes. The host then reads the accepted ballots and commits counts, winner and `modeIntro` together. At that first result write, validate the counts against the four snapshotted voter UIDs and enforce the documented winner. The host rechecks the roster and winning mode before starting the countdown. If either changed, return to lobby with a reason and allocate a fresh vote. [Firebase transactions and atomic updates](https://firebase.google.com/docs/database/web/read-and-write)

Example value at `rooms/K7M4` with the first round completed and a vote open for round two. The sample second mode illustrates the schema after approval and implementation. Empty optional fields are omitted.

```json
{
  "meta": { "hostUid": "tv-host", "expiresAt": 1795886400000 },
  "hostOnline": true,
  "seats": { "s1": "player-ada", "s2": "player-max", "s3": "player-bo", "s4": "player-kim" },
  "players": {
    "player-ada": { "name": "Ada", "side": "a", "seat": "s1" },
    "player-max": { "name": "Max", "side": "a", "seat": "s2" },
    "player-bo": { "name": "Bo", "side": "b", "seat": "s3" },
    "player-kim": { "name": "Kim", "side": "b", "seat": "s4" }
  },
  "match": {
    "phase": "voting",
    "activeRoundId": "-OktC86Hd3KPeRTG8gxy",
    "rounds": {
      "-OktB73GeK9TvQYFH2st": {
        "number": 1,
        "choices": { "first": "double-snake", "second": "wraparound" },
        "eligible": {
          "s1": { "uid": "player-ada", "team": "a" },
          "s2": { "uid": "player-max", "team": "a" },
          "s3": { "uid": "player-bo", "team": "b" },
          "s4": { "uid": "player-kim", "team": "b" }
        },
        "voteClosesAt": 1795800015000,
        "tieBreakChoice": "second",
        "voteResult": { "modeId": "double-snake", "votesFirst": 2, "votesSecond": 1 },
        "countdownEndsAt": 1795800018000,
        "playEndsAt": 1795800078000,
        "result": {
          "outcome": "a",
          "finishedAt": 1795800075000,
          "teams": {
            "a": { "apples": 3, "cancellations": 2 },
            "b": { "apples": 1, "cancellations": 0 }
          }
        }
      },
      "-OktC86Hd3KPeRTG8gxy": {
        "number": 2,
        "choices": { "first": "wraparound", "second": "double-snake" },
        "eligible": {
          "s1": { "uid": "player-ada", "team": "a" },
          "s2": { "uid": "player-max", "team": "a" },
          "s3": { "uid": "player-bo", "team": "b" },
          "s4": { "uid": "player-kim", "team": "b" }
        },
        "voteClosesAt": 1795800100000,
        "tieBreakChoice": "first"
      }
    }
  },
  "ballots": {
    "-OktB73GeK9TvQYFH2st": {
      "player-ada": { "choice": "first" },
      "player-max": { "choice": "first" },
      "player-bo": { "choice": "second" }
    },
    "-OktC86Hd3KPeRTG8gxy": { "player-ada": { "choice": "first" } }
  }
}
```

## Walkthrough and emulator cases

Sign in as Ada and load her profile. An atomic claim puts her in `s1`, with her room display name copied into the player record. After round one, the eligible phone saves its own completed history row. Round two opens a new ballot for the same seats. After a reconnect, Ada reads the active ID, phase, deadlines and her existing `first` ballot from the room, and restores the current screen from that snapshot. The phone starts with idle input and uses a fresh physical press for the active round. Sign-out ends the profile and room subscriptions. Any unfinished round, inactive ballot and input event is scoped to its original ID.

Use the existing room sync check for the current rules and add these cases through the owning feature and [#101](https://github.com/abdurryy/pushpull/issues/101) as paths land. [Existing emulator check](../test/roomSync.emulator.mjs)

| Case | Allow | Deny or ignore |
| --- | --- | --- |
| Private profile and history | Owner reads and saves an existing profile on a second device, and creates one history entry for a completed round. | Another UID reads or writes the profile or history. A second result delivery overwrites the entry. First-load defaults overwrite saved data. |
| Room discovery and admission | Signed-in user checks metadata, claims a free seat, then reads the room. An existing member reconnects to the same seat. | Unauthenticated discovery, a nonmember reading the room or ballots, a fifth seat claim, or another player's input write. |
| Vote eligibility | Snapshotted seated members cast their own ballot. Their valid ballot remains counted if they leave. | Lobby guests without a team, outsiders, a replacement UID in a snapshotted seat, or anyone writing for another UID. |
| Duplicate, late and stale votes | Reconnect reads the already cast ballot. Freeze succeeds at the deadline or once all snapshotted voters have voted. | Replacing or deleting a live ballot, a vote after freeze or deadline, or writing to the previous round ID. |
| Host phase and result | Host opens a fresh vote, checks its counts and starts countdown once. Tie, empty and one-choice ballots resolve by the stored rule. | Guest phase or result writes, skipping the vote, a wrong tally or winner, a second result, or a second start from a repeated Continue. |
| Input and reconnect | The active seated player can steer with the current round ID after Go. On host loss phones return to idle and read the new phase on reconnect. | Input from an older ID, before Go or while the host is away. An interrupted round adds a point or a private history row. |

For implementation, Abdurrahman owns the voting and round-handoff model changes in #103, #122 and #130. Coordinate join access, user paths and rules with Faraz, the proposed room-sync owner, and use Aryan's mode and result contract from #82 for game summaries. [Team ownership](../README.md#team)
