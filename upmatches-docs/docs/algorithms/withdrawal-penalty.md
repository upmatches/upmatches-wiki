---
title: Withdrawal Penalty
sidebar_position: 3
---

# User Penalty & Withdrawal Calculation System

This system penalizes users for frequent last-minute withdrawals (e.g., within 24 hours of a game's start). It uses a continuous **90-day sliding window** to calculate withdrawal rates and a dynamic **Tolerance Tier** system based on accumulated Warning Points. A maximum of 3 points triggers an alert for the host to take attention.

## User Database Variables

The database must track the following variables for each user:

| Variable | Name | Description |
|----------|------|-------------|
| `P` | Penalty Points | Current number of warning points (0, 1, 2, or 3) |
| `G_90` | Games in Window | Total games joined in the past 90 days |
| `W_90` | Withdrawals in Window | Total last-minute withdrawals in the past 90 days |
| `W_new` | Withdrawals Since Last Penalty | Counter for withdrawals made *after* the most recent Warning Point was issued (starts at 0 for new users) |
| `T` | Tolerance Rate | Maximum permitted withdrawal percentage, determined by `P` |
| `W_min` | Minimum Threshold | Hardcoded as **3** |

## Tolerance Tiers

A user's allowed tolerance (`T`) strictly depends on their current active Penalty Points (`P`):

| Penalty Points (`P`) | Tolerance (`T`) | Status |
|-----------------------|-----------------|--------|
| 0 | 10% | Normal |
| 1 | 8% | Warning |
| 2 | 5% | Final Warning |
| 3 | — | Alert triggered for host attention |

## Evaluation Logic (Triggered on Withdrawal)

Every time a user makes a last-minute withdrawal, the system executes the following steps:

### Step A: Update Counters

- Add 1 to `W_90`.
- Add 1 to `W_new`.

### Step B: Calculate Current 90-Day Rate

```
Rate = (W_90 / G_90) × 100
```

### Step C: Evaluate Conditions

To receive a Warning Point, the user must meet **BOTH** conditions:

1. **Grace Period / Cascade Protection:** `W_new >= W_min` — user has made at least 3 active withdrawals since their last penalty.
2. **Tolerance Exceeded:** `Rate >= T` — the overall 90-day rate exceeds their allowed tier.

### Step D: Execute Consequences

If BOTH conditions are met:

1. Add 1 Warning Point to `P`.
2. Timestamp the new Warning Point for a strict 90-day expiration.
3. Reset `W_new` back to **0**.
4. Update `T` to the new, stricter tier.
5. If `P` reaches **3**, trigger an alert for the host to take attention.

If the conditions in Step C are NOT met, record the withdrawal normally and take no further action.

## Automated System Maintenance (Cron Jobs)

To maintain the sliding window and manage expirations, background tasks must process the following:

- **Point Expiration:** Warning Points have strict, independent lifespans. Exactly 90 days after a point is issued, it is deleted. `P` drops by 1, and the user's Tolerance Rate (`T`) relaxes to the previous tier.
- **Sliding Window Cleanup:** As joined games and withdrawals age past the 90-day mark, they automatically drop off the user's record, reducing the `G_90` and `W_90` totals dynamically.
