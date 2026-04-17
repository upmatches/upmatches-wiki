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
| `organizer` | `OrganizerSummary` | `{ id, name }` — the authenticated creator |
| `venue` | `VenueSummary` | `{ id, name, address, latitude, longitude, nearest: [{ stationCode, color }] }` |
| `skillLevel` | `{ from, to }` | Allowed range — both must belong to the game's activity and `to.sortOrder >= from.sortOrder` |
| `currency` | `string` | ISO-4217 3-letter code (e.g. `SGD`) |
| `price` | `decimal` | Per-player cost, `>= 0.00`, up to 8 integer digits + 2 decimals |
| `slots` | `integer` | Total seats, `1..100` — immutable after participants join |
| `numberOfPlayerJoined` | `long` | Active participant count (derived) |
| `startTime` / `endTime` | `Instant` | `endTime` must be after `startTime` |
| `visibility` | `GameVisibility` | `PUBLIC` or `PRIVATE` — immutable after creation |
| `gameType` | `GameType` | `SINGLE` or `DOUBLE` |
| `status` | `GameStatus` | `SCHEDULED`, `STARTED`, `EXPIRED`, or `CANCELLED` |
| `shareLink` | `ShareLinkResponse?` | Auto-generated on create (see [Share Link](/docs/modules/share-link)) |
| `createdAt` / `updatedAt` | `Instant` | Audit timestamps |

### Enums

| Enum | Values |
|---|---|
| `GameStatus` | `SCHEDULED`, `STARTED`, `EXPIRED`, `CANCELLED` |
| `GameVisibility` | `PUBLIC`, `PRIVATE` |
| `GameType` | `SINGLE`, `DOUBLE` |
| `ParticipantStatus` | `ACTIVE`, `LEFT` |

### Scheduler

A background job transitions games from `SCHEDULED` to `STARTED` once `startTime` has passed, and from `STARTED` to `EXPIRED` once `endTime` has passed. `CANCELLED` is reserved for explicit organiser action (future endpoint).

## API Contract

All game endpoints are under `/api/v1/games` and require a valid JWT. Bookmark endpoints live under `/api/v1/game-bookmarks`. Per-user listings live under `/api/v1/me/games`. See the [API overview](/docs/api/overview) for the envelope and error shapes.

### `POST /api/v1/games`

Creates a game. The organiser is the authenticated user. A share link is generated in the same transaction.

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
    "joinAsOrganizer": true
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

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "7a9a3b1a-0000-0000-0000-000000000001",
    "activity": { "id": "550e8400-...", "name": "Badminton" },
    "organizer": { "id": "d290f1ee-...", "name": "Jane Doe" },
    "venue": {
      "id": 12,
      "name": "Clementi Sports Hall",
      "address": "518 Clementi Ave 1",
      "latitude": 1.3150,
      "longitude": 103.7651,
      "nearest": [ { "stationCode": "EW23", "color": "#0066CC" } ]
    },
    "skillLevel": {
      "from": { "id": 3, "name": "High Beginner", "sortOrder": 3 },
      "to":   { "id": 5, "name": "Middle Intermediate", "sortOrder": 5 }
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
    "shareLink": {
      "id": "...", "code": "aB3xY9kQ", "resourceType": "GAME",
      "resourceId": "7a9a3b1a-...", "shareUrl": "http://localhost:8080/api/v1/share-links/aB3xY9kQ",
      "webUrl": "...", "mobileUrl": "...", "clickCount": 0, "createdAt": "..."
    },
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

Offset-paginated listing, sorted by `startTime` ascending. Private games are excluded unless the caller is the organiser or an active participant.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/games?page=0&size=20" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `200 OK`** — `data` is a `PagedResponse<GameResponse>` (see [overview](/docs/api/overview)).

### `GET /api/v1/games/cursor`

Cursor-based listing with filters. Sorted by `startTime` then `id` ascending. Private games are excluded unless the caller is the organiser or an active participant.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/games/cursor?size=20&from_date=2026-05-01&to_date=2026-05-31&venue_ids=12&latitude=1.3150&longitude=103.7651&radius_km=3" \
  -H "Authorization: Bearer <TOKEN>"
```

**Query parameters**

| Parameter | Type | Validation |
|---|---|---|
| `cursor` | `string` | Opaque Base64 cursor returned by a previous response. Omit for the first page. |
| `size` | `integer` | `1..1000`, default `20` |
| `venue_ids` | `long[]` | Optional, max 20 entries |
| `skill_level_ids` | `long[]` | Optional, max 20 entries |
| `from_date` | `LocalDate` | Optional. Interpreted in SGT |
| `to_date` | `LocalDate` | Optional, must be `>= from_date` |
| `from_time` | `LocalTime` | Optional |
| `to_time` | `LocalTime` | Optional |
| `latitude` | `decimal` | Optional, `-90.0..90.0` |
| `longitude` | `decimal` | Optional, `-180.0..180.0` |
| `radius_km` | `integer` | Optional, `1..5` |

If any of `latitude`, `longitude`, or `radius_km` is supplied, **all three must be supplied together**.

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
  "path": "/api/v1/games/cursor"
}
```

`nextCursor` is `null` when there are no further pages. A malformed cursor returns `400 Bad Request`.

### `GET /api/v1/games/filter-options`

Returns the distinct venues, skill levels, start-times, and game types present in the filtered result set. Intended to back progressive filter UIs.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/games/filter-options?from_date=2026-05-01&to_date=2026-05-31" \
  -H "Authorization: Bearer <TOKEN>"
```

**Query parameters**

| Parameter | Type | Validation |
|---|---|---|
| `from_date` | `LocalDate` | <span class="attention">Required</span> |
| `to_date` | `LocalDate` | <span class="attention">Required</span>, `>= from_date`, range `<= 90 days` |
| `venue_ids` | `long[]` | Optional, max 20 |
| `skill_level_ids` | `long[]` | Optional, max 20 |
| `from_time` / `to_time` | `LocalTime` | Optional |
| `game_type` | `GameType` | Optional, `SINGLE` or `DOUBLE` |
| `latitude` / `longitude` / `radius_km` | — | Optional, all three must be supplied together; same bounds as above |

Samples up to 500 games from the filtered range.

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

### `GET /api/v1/games/{id}`

Returns a single game. Private games are returned only to the organiser, active participants, or callers presenting a valid share access.

**cURL**

```bash
curl -X GET http://localhost:8080/api/v1/games/7a9a3b1a-... \
  -H "Authorization: Bearer <TOKEN>"
```

### `PUT /api/v1/games/{id}`

Updates a game. Only the organiser may update. The following fields are **immutable** and ignored if present: `activityId`, `visibility`, and `slots` (once any participant has joined). Everything else follows the same validation as creation.

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

Soft-deletes the game (sets `deletedAt`). Organiser only. Soft-deleted games are excluded from listings.

**Response `204 No Content`**

### `DELETE /api/v1/games/{id}/hard`

Hard-deletes the game (row removed). Organiser only. Use with care — this cascades to participants, bookmarks, and share accesses.

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

## My Games

Cursor-based listings scoped to the authenticated user. Both endpoints return `CursorPagedResponse<GameResponse>`, sorted by `startTime` ascending.

### `GET /api/v1/me/games/joined`

Games where the caller is an `ACTIVE` participant (excludes games they organise).

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/me/games/joined?size=20" \
  -H "Authorization: Bearer <TOKEN>"
```

**Query parameters**

| Parameter | Type | Validation |
|---|---|---|
| `cursor` | `string` | Opaque cursor from a previous response |
| `size` | `integer` | `1..1000`, default `20` |

### `GET /api/v1/me/games/hosted`

Games where the caller is the organiser.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/me/games/hosted?size=20" \
  -H "Authorization: Bearer <TOKEN>"
```

Same query parameters as `/joined`.

## Game Bookmarks

Bookmarks are per-user pointers to games the user wants to revisit. They do **not** imply participation.

### `POST /api/v1/game-bookmarks`

**Request**

```json
{ "gameId": "7a9a3b1a-..." }
```

**Response `201 Created`** — `GameBookmarkResponse` including the embedded `GameResponse`. Re-bookmarking the same game returns `409 Conflict` (`AlreadyBookmarkedException`).

### `GET /api/v1/game-bookmarks`

Offset-paginated listing of the caller's bookmarks.

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
| Non-organiser tries to update/delete | `404` | Returned as 404, not 403, to avoid enumeration |
| Private game accessed without share context | `404` | Present share link first |
| Malformed cursor, incomplete location filter, `to_date < from_date`, or filter-options date range > 90 days | `400` | Validation error |
