---
title: Game
sidebar_position: 5
---

# Game

## Overview

The game module is the core of Upmatches. It lets an authenticated user organise a match for a specific activity at a venue, set pricing and slot limits, bound the allowed skill-level range, and invite other users to join. Games can be `PUBLIC` (discoverable in listings) or `PRIVATE` (reachable only via share link).

Every response envelope conforms to the [API overview](/docs/api/overview).

## Data Model

### Game

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Auto-generated primary key |
| `activity` | `ActivitySummary` | `{ id, name }` — immutable after creation |
| `organizer` | `OrganizerSummary` | `{ id, name, contactMethods }` — `name` is `Anonymous` if the organiser hasn't set one; `contactMethods` is the organiser's `whatsapp` / `telegram` / `messenger` list |
| `venue` | `VenueSummary` | `{ id, name, address, latitude, longitude }` |
| `skillLevel` | `{ from, to }` | Allowed range — both must belong to the game's activity and `to.sortOrder >= from.sortOrder` |
| `currency` | `string` | ISO-4217 3-letter code (e.g. `SGD`) |
| `price` | `decimal` | Per-player cost, `>= 0.00`, up to 8 integer digits + 2 decimals |
| `slots` | `integer` | Total seats, `1..100` — cannot be reduced below the current active participant count |
| `numberOfPlayerJoined` | `long` | Active participant count (derived) |
| `startTime` / `endTime` | `Instant` | `endTime` must be after `startTime` |
| `visibility` | `GameVisibility` | `PUBLIC` or `PRIVATE` — immutable after creation |
| `gameType` | `GameType` | `SINGLE` or `DOUBLE` |
| `status` | `GameStatus` | `SCHEDULED`, `STARTED`, `EXPIRED`, or `CANCELLED` |
| `remark` | `string?` | Free-form note from the organiser, up to 500 chars |
| `shareLink` | `ShareLinkResponse?` | Generated on create for `PUBLIC` games (see [Share Link](/docs/modules/share-link)) |
| `viewerJoinability` | `ViewerJoinabilityResponse?` | Whether the calling user can join, plus warnings — populated only for authenticated viewers on detail / participant endpoints |
| `viewerIsOrganizer` | `boolean?` | `true` when the calling user is the organiser; `null` for anonymous viewers |
| `createdAt` / `updatedAt` | `Instant` | Audit timestamps |

### Enums

| Enum | Values |
|---|---|
| `GameStatus` | `SCHEDULED`, `STARTED`, `EXPIRED`, `CANCELLED` |
| `GameVisibility` | `PUBLIC`, `PRIVATE` |
| `GameType` | `SINGLE`, `DOUBLE` |
| `ParticipantStatus` | `ACTIVE`, `LEFT`, `EXPELLED` |
| `JoinabilityReason` | `ALREADY_JOINED`, `GAME_FULL`, `GAME_NOT_JOINABLE`, `SKILL_OUT_OF_RANGE`, `OVERLAPS_WITH_EXISTING_GAME`, … |
| `JoinabilityWarning` | `SKILL_MISMATCH`, `PARTICIPANT_PENALTY_RECORD`, … |

### Scheduler

Background jobs transition games from `SCHEDULED` to `STARTED` once `startTime` has passed, and from `STARTED` to `EXPIRED` once `endTime` has passed. `CANCELLED` is reserved for explicit organiser action (future endpoint).

## API Contract

Game endpoints are split between three controllers:

- `/api/v1/games` — read endpoints (`GET`) are **public** and rate-limited via `PublicReadRateLimitFilter`; write endpoints require a JWT.
- `/api/v1/game-bookmarks` — per-user bookmarks; require a JWT.
- `/api/v1/admin/games` — destructive admin operations; require the `ADMIN` role.

See the [API overview](/docs/api/overview) for the envelope and error shapes. My-games listings live under [`/api/v1/me/games`](/docs/modules/me#me-games).

### `POST /api/v1/games`

Creates a game. The organiser is the authenticated user. A share link is generated in the same transaction for `PUBLIC` games.

**cURL**

```bash
curl -X POST http://localhost:8080/api/v1/games \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "activityId": "550e8400-e29b-41d4-a716-446655440000",
    "venueId": 12,
    "skillLevelFromId": 3,
    "skillLevelToId": 5,
    "currency": "SGD",
    "price": "8.50",
    "slots": 8,
    "startTime": "2026-05-01T19:00:00Z",
    "endTime": "2026-05-01T21:00:00Z",
    "visibility": "PUBLIC",
    "gameType": "DOUBLE",
    "joinAsOrganizer": true,
    "remark": "Bring your own shuttles"
  }'
```

**Request**

| Field | Type | Validation |
|-------|------|------------|
| `activityId` | `UUID` | <span class="attention">Required</span> |
| `venueId` | `long` | <span class="attention">Required</span> |
| `skillLevelFromId` | `long` | <span class="attention">Required</span>, must belong to `activityId` |
| `skillLevelToId` | `long` | <span class="attention">Required</span>, must belong to `activityId`, `sortOrder >= from` |
| `currency` | `string` | <span class="attention">Required</span>, matches `^[A-Z]{3}$` |
| `price` | `decimal` | <span class="attention">Required</span>, `>= 0.00`, 8 int digits + 2 decimals |
| `slots` | `integer` | <span class="attention">Required</span>, `1..100` |
| `startTime` / `endTime` | `Instant` | <span class="attention">Required</span>, `endTime` after `startTime` |
| `visibility` | `GameVisibility` | <span class="attention">Required</span> |
| `gameType` | `GameType` | <span class="attention">Required</span>, `SINGLE` or `DOUBLE` |
| `joinAsOrganizer` | `boolean?` | If `true`, organiser is added as an `ACTIVE` participant |
| `remark` | `string?` | Optional note, max 500 chars |

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "7a9a3b1a-0000-0000-0000-000000000001",
    "activity": { "id": "550e8400-...", "name": "Badminton" },
    "organizer": {
      "id": "d290f1ee-...",
      "name": "Jane Doe",
      "contactMethods": [
        { "name": "whatsapp", "value": "+6591234567" }
      ]
    },
    "venue": {
      "id": 12,
      "name": "Clementi Sports Hall",
      "address": "518 Clementi Ave 1",
      "latitude": 1.3150,
      "longitude": 103.7651
    },
    "skillLevel": {
      "from": { "id": 3, "name": "High Beginner",        "sortOrder": 3 },
      "to":   { "id": 5, "name": "Middle Intermediate",  "sortOrder": 5 }
    },
    "currency": "SGD",
    "price": 8.50,
    "slots": 8,
    "numberOfPlayerJoined": 1,
    "startTime": "2026-05-01T19:00:00Z",
    "endTime":   "2026-05-01T21:00:00Z",
    "visibility": "PUBLIC",
    "gameType": "DOUBLE",
    "status": "SCHEDULED",
    "remark": "Bring your own shuttles",
    "shareLink": {
      "id": "...",
      "code": "aB3xY9kQ",
      "resourceType": "GAME",
      "resourceId": "7a9a3b1a-...",
      "shareUrl": "http://localhost:8080/api/v1/share-links/aB3xY9kQ",
      "webUrl": "...",
      "mobileUrl": "...",
      "clickCount": 0,
      "createdAt": "..."
    },
    "viewerJoinability": null,
    "viewerIsOrganizer": true,
    "createdAt": "2026-04-15T12:00:00Z",
    "updatedAt": "2026-04-15T12:00:00Z"
  },
  "message": "Game created successfully.",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/games"
}
```

The creator must have completed onboarding; otherwise the request is rejected with `409 Conflict` (`OnboardingRequiredException`). Overlapping games (same organiser, overlapping `[startTime, endTime)`) are rejected with `409 Conflict`.

### `GET /api/v1/games`

**Public** (no JWT required, rate-limited). Cursor-based listing with optional filters. Sorted by `startTime` then `id` ascending. `PRIVATE` games are excluded unless the caller is authenticated and is the organiser or an active participant.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/games?size=20&fromDate=2026-05-01&toDate=2026-05-31&venueIds=12&latitude=1.3150&longitude=103.7651&radiusKm=3"
```

**Query parameters**

| Parameter | Type | Validation |
|---|---|---|
| `cursor` | `string` | Opaque Base64 cursor returned by a previous response. Omit for the first page. |
| `size` | `integer` | `1..1000`, default `20` |
| `venueIds` | `long[]` | Optional, max 20 entries |
| `skillLevelIds` | `long[]` | Optional, max 20 entries |
| `fromDate` | `LocalDate` | Optional. Interpreted in SGT |
| `toDate` | `LocalDate` | Optional, must be `>= fromDate` |
| `fromTime` | `LocalTime` | Optional |
| `toTime` | `LocalTime` | Optional |
| `latitude` | `decimal` | Optional, `-90.0..90.0` |
| `longitude` | `decimal` | Optional, `-180.0..180.0` |
| `radiusKm` | `integer` | Optional, `1..5` |

If any of `latitude`, `longitude`, or `radiusKm` is supplied, **all three must be supplied together**.

**Response `200 OK`** — `data` is a `CursorPagedResponse<GameResponse>`:

```json
{
  "success": true,
  "data": {
    "content": [ { "id": "7a9a3b1a-...", "...": "..." } ],
    "nextCursor": "eyJzdGFydFRpbWUiOiIyMDI2LTA1LTAxVDE5OjAwOjAwWiIsImlkIjoiN2E5YTNiMWEtLi4uIn0"
  },
  "message": "Games retrieved successfully.",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/games"
}
```

`nextCursor` is `null` when there are no further pages. A malformed cursor returns `400 Bad Request`. Anonymous callers are rate-limited at 60 req/min per IP; authenticated callers at 240 req/min per user.

### `GET /api/v1/games/filter-options`

**Public.** Returns the distinct venues, skill levels, start-times, and game types present in the filtered result set. Intended to back progressive filter UIs. Samples up to 500 games from the filtered range.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/games/filter-options?fromDate=2026-05-01&toDate=2026-05-31"
```

**Query parameters**

| Parameter | Type | Validation |
|---|---|---|
| `fromDate` | `LocalDate` | <span class="attention">Required</span> |
| `toDate` | `LocalDate` | <span class="attention">Required</span>, `>= fromDate`, range `<= 90 days` |
| `venueIds` | `long[]` | Optional, max 20 |
| `skillLevelIds` | `long[]` | Optional, max 20 |
| `fromTime` / `toTime` | `LocalTime` | Optional |
| `gameType` | `GameType` | Optional, `SINGLE` or `DOUBLE` |
| `latitude` / `longitude` / `radiusKm` | — | Optional, all three must be supplied together; same bounds as above |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "venues": [ { "id": 12, "name": "Clementi Sports Hall", "...": "..." } ],
    "skillLevels": [ { "id": 3, "name": "High Beginner", "sortOrder": 3 } ],
    "availableStartTimes": ["19:00", "20:00", "21:00"],
    "gameTypes": ["SINGLE", "DOUBLE"]
  },
  "message": "Game filter options retrieved successfully.",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/games/filter-options"
}
```

`availableStartTimes` are formatted `HH:mm` in SGT.

### `GET /api/v1/games/date-availability`

**Public.** Returns whether at least one non-deleted game exists on the given date. The date is interpreted in `Asia/Singapore`; the service queries games whose `startTime` falls within `[date 00:00 SGT, next-day 00:00 SGT)`.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/games/date-availability?date=2026-04-28"
```

**Query parameters**

| Parameter | Type | Validation |
|---|---|---|
| `date` | `LocalDate` | <span class="attention">Required</span>, ISO format `yyyy-MM-dd` |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "date": "2026-04-28",
    "hasGame": true
  },
  "message": "Game date availability retrieved successfully.",
  "timestamp": "2026-04-28T12:00:00Z",
  "path": "/api/v1/games/date-availability"
}
```

### `GET /api/v1/games/{id}`

**Public.** Returns a single game. `PRIVATE` games are returned only to the organiser, active participants, or callers presenting a valid share access.

**cURL**

```bash
curl -X GET http://localhost:8080/api/v1/games/7a9a3b1a-...
```

### `PUT /api/v1/games/{id}`

Updates a game. Only the organiser may update. The following fields are **immutable** and ignored if present: `activityId` and `visibility`. `slots` may be raised but not reduced below the current `ACTIVE` participant count. Everything else follows the same validation as creation.

**cURL**

```bash
curl -X PUT http://localhost:8080/api/v1/games/7a9a3b1a-... \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "price": "10.00",
    "gameType": "SINGLE",
    "startTime": "2026-05-01T19:30:00Z",
    "endTime":   "2026-05-01T21:30:00Z"
  }'
```

**Request** — all fields optional; omitted fields are left unchanged.

**Response `200 OK`** — full `GameResponse`. Reducing `slots` below the current active participant count returns `409 Conflict`.

### `DELETE /api/v1/games/{id}`

Soft-deletes the game (sets `deletedAt`). Organiser only. Soft-deleted games are excluded from listings. Active participants and the organiser are notified.

**Response `204 No Content`**

### `POST /api/v1/games/{id}/participants`

Joins the authenticated user to the game. Rejects if the game is full, past, cancelled, or if the caller is already `ACTIVE`. For `PRIVATE` games the caller must have resolved the share link first.

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "e1...",
    "gameId": "7a9a3b1a-...",
    "userId": "d290f1ee-...",
    "userName": "Jane Doe",
    "status": "ACTIVE",
    "joinedAt": "2026-04-15T12:05:00Z",
    "leftAt": null
  },
  "message": "Joined game successfully.",
  "timestamp": "2026-04-15T12:05:00Z",
  "path": "/api/v1/games/7a9a3b1a-.../participants"
}
```

### `DELETE /api/v1/games/{id}/participants/me`

Leaves the game. The participant row is not removed — its `status` becomes `LEFT` and `leftAt` is stamped. The organiser cannot leave their own game.

**Response `204 No Content`**

### `GET /api/v1/games/{id}/participants`

Lists every participant on the game (status `ACTIVE`, `LEFT`, and `EXPELLED`). Available to any authenticated caller able to read the game.

**Response `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": "e1...",
      "gameId": "7a9a3b1a-...",
      "userId": "d290f1ee-...",
      "userName": "Jane Doe",
      "status": "ACTIVE",
      "skillLevel": { "id": 4, "name": "Low Intermediate", "sortOrder": 4 },
      "joinedAt": "2026-04-15T12:05:00Z",
      "leftAt": null
    }
  ],
  "message": "Game participants retrieved successfully.",
  "timestamp": "2026-04-15T12:05:00Z",
  "path": "/api/v1/games/7a9a3b1a-.../participants"
}
```

### `DELETE /api/v1/games/{gameId}/participants/{participantId}`

Organiser-only. Expels a participant from the game with an optional reason. The participant row is preserved with `status = EXPELLED`, `leftAt = now()`, and `expelReason` is stored. The expelled user receives a `PLAYER_REMOVED_FROM_GAME` notification.

**Request** (optional body)

```json
{ "reason": "Repeated no-shows." }
```

| Field | Type | Validation |
|-------|------|------------|
| `reason` | `string?` | Optional, max 500 chars |

**Response `204 No Content`**

### `DELETE /api/v1/admin/games/{id}`

**Admin only.** Hard-deletes the game (row removed). Cascades to participants, bookmarks, and share accesses. Use only for moderation — prefer `DELETE /api/v1/games/{id}` (soft-delete) for normal organiser flows.

**Response `204 No Content`**

## Game Bookmarks

Bookmarks are per-user pointers to games the user wants to revisit. They do **not** imply participation.

### `POST /api/v1/game-bookmarks`

**Request**

```json
{ "gameId": "7a9a3b1a-..." }
```

**Response `201 Created`** — `GameBookmarkResponse` including the embedded `GameResponse`. Re-bookmarking the same game returns `409 Conflict` (`AlreadyBookmarkedException`).

### `GET /api/v1/game-bookmarks`

Cursor-paginated listing of the caller's bookmarks.

| Parameter | Type | Validation |
|---|---|---|
| `cursor` | `string` | Opaque cursor from a previous response |
| `size` | `integer` | `1..1000`, default `20` |

### `DELETE /api/v1/game-bookmarks/{gameId}`

Removes the caller's bookmark for the given game. Returns `204 No Content` whether or not the bookmark existed.

## Error Handling

| Scenario | HTTP Status | Notes |
|---|---|---|
| Missing onboarding, caller tries to create | `409` | Complete profile first (`OnboardingRequiredException`) |
| Overlapping game for same organiser | `409` | Reschedule |
| Skill-level range invalid (wrong activity or reversed order) | `400` | See validation messages |
| Reducing `slots` below current participants | `409` | `GameSlotsBelowParticipantsException` |
| Join attempt on full game | `409` | `GameFullException` |
| Join attempt on past / cancelled game | `409` | `GameNotJoinableException` |
| Organiser tries to leave own game | `409` | `GameNotJoinableException` |
| Non-organiser tries to update / delete / expel | `404` | Returned as 404, not 403, to avoid enumeration |
| `PRIVATE` game accessed without share context | `404` | Present share link first |
| Non-admin calls `DELETE /api/v1/admin/games/{id}` | `403` | `AccessDeniedException` |
| Malformed cursor, incomplete location filter, `toDate < fromDate`, or filter-options date range > 90 days | `400` | Validation error |
| Public read rate limit exceeded | `429` | Retry after the `Retry-After` window |
