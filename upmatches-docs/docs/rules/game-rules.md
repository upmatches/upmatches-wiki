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
