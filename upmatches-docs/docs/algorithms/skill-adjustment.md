---
title: Skill Adjustment & Lockout
sidebar_position: 2
---

# Dual-Track Skill Adjustment and Lockout System

This system automatically adjusts a player's skill level when peer ratings indicate a mismatch, locks the UI to prevent ego-driven readjustments, and provides fair, un-gameable pathways for the user to earn their rank back.

## Phase 1: The Trigger (Demotion & Lockout)

When a player self-selects a skill level (e.g., "Advanced") but receives consistent peer ratings indicating they are playing below that level, the system intervenes.

- **Action:** The system automatically drops the player's profile to the appropriate lower level (e.g., "Intermediate").
- **UI Lock:** The dropdown or selection tool to choose "Advanced" or higher is disabled for that user.
- **Initialization:** The Decaying Lockout Algorithm begins.

## Phase 2: Track 1 - The Decaying Lockout Algorithm (Time + Effort)

This is the baseline safety net. It forces a realistic cooldown period but allows the user to reduce that time by putting in honest court hours.

### Variables

| Variable | Name | Value | Description |
|----------|------|-------|-------------|
| `T_base` | Base Lockout | 60 Days | Maximum penalty if they do not play any matches |
| `T_min` | Hard Floor | 21 Days | Absolute biological minimum time required to improve — lockout cannot drop below this |
| `R` | Reduction Rate | 1 Day / 1 Hour | Days removed per hour of valid gameplay |
| `H_valid` | Valid Hours | — | Hours played that successfully pass the Anti-Grind checks |

### Formula

```
L_current = max(T_base - (H_valid × R), T_min)
```

### Anti-Grind Mechanics (Calculating `H_valid`)

- **Weekly Eligible Cap:** A maximum of **4 hours** of gameplay can be counted toward reduction within any rolling 7-day period. Hours played beyond this cap yield a reduction value of 0.
- **The Quality Gate:** A session's hours are only added to `H_valid` if the user receives neutral or positive peer feedback during that specific session. If they are downvoted for poor skill again, the session hours are discarded.

## Phase 3: Track 2 - The Fast Track Override (Peer Validation)

Since badminton is entirely about on-court performance, the community can override the algorithm. If a demoted player genuinely improves faster than the timer allows, their peers can promote them.

### Fast Track Mechanic

- After every game, peers submit a skill rating for the user.
- If the user accumulates a specific threshold of "Plays Above Current Level" ratings (e.g., **5 positive votes**), the Lockout Timer (`L_current`) is immediately set to **0**.
- The system automatically upgrades their profile back to the higher tier and removes the UI lock.

## Phase 4: Anti-Collusion System (Protecting Track 2)

To prevent a user from booking a private session with friends to spam positive ratings and trigger the Fast Track Override, the peer rating system enforces strict validation rules.

### Collusion Filters

| Filter | Rule |
|--------|------|
| **Unique Rater Rule** | Multiple positive ratings from the exact same User ID only count as **1 vote** toward the Fast Track threshold. The user must impress 5 *different* people, not 1 person 5 times. |
| **Familiarity Penalty** | If two users have shared more than **30%** of their total bookings, the rater's vote is flagged as "Familiar" and holds **zero weight** for promotion purposes. Only ratings from independent or infrequent opponents trigger the Fast Track. |

## Example User Journey

| Day | Event | Timer |
|-----|-------|-------|
| **1** | User is demoted to Intermediate. Lockout initialized. | **60 days** |
| **1–7** | User plays 6 hours. Weekly cap allows only 4 valid hours. | **56 days** |
| **8–14** | User plays 4 hours (all valid). | **52 days** |
| **15** | User plays a 2-hour session. Three independent strangers rate them "Plays Above Current Level." Combined with two strangers from a previous week, the user hits the 5-vote threshold. | **0 days** |

**Result:** Track 2 activates. The 52-day timer is instantly canceled. The user is promoted back to Advanced, and the UI lock is lifted.
