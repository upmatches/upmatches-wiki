---
title: Skill Levels
sidebar_position: 7
---

# Skill Levels

## Overview

Skill levels are per-activity difficulty tiers used by [onboarding](/docs/modules/new-user-onboarding), [game creation](/docs/modules/game), and user profiles. For badminton, the canonical seven-level ladder is documented in [Sports → Badminton → Skill Levels](/docs/sports/badminton/skill-levels).

## Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | `long` | Primary key |
| `name` | `string` | Display name (e.g. `High Beginner`) |
| `sortOrder` | `integer` | Ordering within the activity (`1` = lowest) |

Each level is scoped to a single activity. Two activities may share a name (e.g. both have `Beginner`) but the rows and IDs are distinct.

## API Contract

### `GET /api/v1/skill-levels`

Returns all skill levels for a given activity, ordered by `sortOrder` ascending. Requires authentication.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/skill-levels?activity_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <TOKEN>"
```

**Query parameters**

| Name | Type | Validation |
|---|---|---|
| `activity_id` | `UUID` | <span class="attention">Required</span> |

**Response `200 OK`**

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Beginner",           "sortOrder": 1 },
    { "id": 2, "name": "Middle Beginner",    "sortOrder": 2 },
    { "id": 3, "name": "High Beginner",      "sortOrder": 3 },
    { "id": 4, "name": "Low Intermediate",   "sortOrder": 4 },
    { "id": 5, "name": "Middle Intermediate","sortOrder": 5 },
    { "id": 6, "name": "High Intermediate",  "sortOrder": 6 },
    { "id": 7, "name": "Expert",             "sortOrder": 7 }
  ],
  "message": "Skill levels retrieved successfully.",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/skill-levels"
}
```

## Error Handling

| Scenario | HTTP Status | Notes |
|---|---|---|
| `activity_id` missing | `400` | Validation error |
| Activity not found | `404` | |
| Auth token expired / missing | `401` | Redirect to login |
