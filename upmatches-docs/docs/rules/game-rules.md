---
title: Game Rules
sidebar_position: 1
---

# Game Rules

## Leave Policy

A user is <span class="attention">not allowed to leave a game within 24 hours</span> of the game's scheduled start time.

| Rule | Condition | Enforced |
|------|-----------|----------|
| No leave within 24h | `now >= game.startTime - 24h` | Server-side |

- Before the 24-hour window, users may freely leave a game.
- Within the 24-hour window, the API rejects leave requests.

## Time Overlap Policy

A user is <span class="attention">not allowed to join a game that overlaps in time</span> with any game they have already joined.

| Rule | Condition | Enforced |
|------|-----------|----------|
| No time overlap | New game's time range overlaps with any existing joined game | Server-side |

Two games overlap if the new game starts before the existing game ends **and** the new game ends after the existing game starts.

### Examples

Given a user has already joined a game on **15 Oct, 8 PM – 10 PM**:

| New Game Time | Result | Reason |
|---------------|--------|--------|
| 15 Oct, 9 PM – 11 PM | Rejected | Starts during the existing game |
| 15 Oct, 7 PM – 11 PM | Rejected | Fully encompasses the existing game |
| 15 Oct, 7 PM – 9 PM | Rejected | Ends during the existing game |
| 15 Oct, 10 PM – 1 AM | Accepted | Starts exactly when the existing game ends — no overlap |

## Game Change Notification Policy

When an organiser updates a game's details or information, the system must send a notification or push notification to <span class="attention">all affected players</span>. The same rule applies when an organiser deletes a game.

| Rule | Condition | Enforced |
|------|-----------|----------|
| Notify affected players on update | Organiser changes game details or information such as venue, skill range, price, slots, start time, or end time | Server-side |
| Notify affected players on delete | Organiser deletes the game | Server-side |

- Affected players include all active participants in the game.
- Notifications must be sent after the update or delete succeeds.
- If push notification delivery is unavailable, the notification must still be recorded for affected players so they can see it in-app.
- Notification content must clearly identify the game and whether it was updated or deleted.

## Post-Game Peer Review

After a game ends, the system prompts all participants to <span class="attention">review the skill level of every other player</span> in the same game. Only players who participated in the game may submit reviews.

| Rule | Condition | Enforced |
|------|-----------|----------|
| Reviewer must be a participant | Reviewer was a confirmed player in the game | Server-side |
| Game must have ended | `now >= game.endTime` | Server-side |
| Rating range limited to ±1 | Suggested level must be within 1 of the player's current level | Server-side |

### Review Flow

1. After the game ends, the system asks each participant: **"Does this player's skill match their stated level?"**
2. If **yes** — no further action is needed.
3. If **no** — the reviewer must suggest a new level, restricted to **−1 or +1** from the player's current level.

### Example

A player's current skill level is **Middle Beginner (2)**:

| Reviewer Action | Allowed | Reason |
|-----------------|---------|--------|
| Confirm as Middle Beginner (2) | Yes | Agrees with stated level |
| Suggest Beginner (1) | Yes | Within −1 of current level |
| Suggest High Beginner (3) | Yes | Within +1 of current level |
| Suggest Low Intermediate (4) | No | Exceeds the ±1 range |

See [Skill Adjustment & Lockout](/docs/algorithms/skill-adjustment) for how peer ratings feed into automatic skill corrections.
