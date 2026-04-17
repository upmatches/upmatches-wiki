---
title: Venue
sidebar_position: 3
---

# Venue

## Overview

The venue management module handles venue data including physical locations, nearby transit stations, and associated activities. It provides endpoints to retrieve all venues and, for administrators, to bulk import venues from a JSON file.

Venues are linked to **activities** (e.g., Badminton), **stations** (nearby public transit), and **transit lines** (e.g., MRT line codes). Stations are shared across venues — if two venues are near the same station, they reference the same station record.

## Data Model

### Venue

| Field | Type | Description |
|-------|------|-------------|
| `id` | `long` | Auto-generated primary key |
| `sourceId` | `string` | Unique external identifier (for idempotent imports) |
| `activity` | `Activity` | The activity this venue supports |
| `name` | `string` | Venue name (max 200 chars) |
| `address` | `string` | Full street address (max 500 chars) |
| `postalCode` | `string` | 6-digit Singapore postal code |
| `latitude` | `decimal` | Latitude (-90 to 90), precision 13,10 |
| `longitude` | `decimal` | Longitude (-180 to 180), precision 13,10 |
| `stations` | `Station[]` | Nearby transit stations (many-to-many) |

### Station

| Field | Type | Description |
|-------|------|-------------|
| `id` | `long` | Auto-generated primary key |
| `name` | `string` | Station name (max 150 chars) |
| `latitude` | `decimal` | Station latitude |
| `longitude` | `decimal` | Station longitude |
| `transitLines` | `TransitLine[]` | Lines this station belongs to |

### Transit Line

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Line code, e.g. `EW`, `NS`, `CC` (primary key, max 10 chars) |
| `name` | `string` | Full line name (max 100 chars) |
| `color` | `string` | Hex color for UI display, e.g. `#0066CC` |

### Activity

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Auto-generated primary key |
| `referenceId` | `integer` | Auto-generated unique integer identifier (database-managed, read-only) |
| `name` | `string` | Activity name, e.g. `Badminton` (unique, max 100 chars) |

## API Contract

All endpoints are under `/api/v1/venues`. Responses are wrapped in the standard `ApiResponse` envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "...",
  "timestamp": "2026-04-05T12:00:00Z",
  "path": "/api/v1/venues"
}
```

### `GET /api/v1/venues`

Offset-paginated listing of venues with their associated stations and transit lines. Sorted by `name` ascending.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/venues?page=0&size=20" \
  -H "Authorization: Bearer <TOKEN>"
```

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `page` | `integer` | Zero-based page index, default `0` |
| `size` | `integer` | Page size, default `20` |

**Response `200 OK`** — `data` is a `PagedResponse<VenueResponse>` (see [overview](/docs/api/overview)).

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "sourceId": "SRC-001",
        "activity": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "referenceId": 1,
          "name": "Badminton"
        },
        "name": "Clementi Sports Hall",
        "address": "518 Clementi Ave 1",
        "postalCode": "129907",
        "latitude": 1.3150,
        "longitude": 103.7651,
        "stations": [
          {
            "id": 5,
            "name": "Clementi MRT Station",
            "latitude": 1.3148,
            "longitude": 103.7653,
            "transitLines": [
              {
                "code": "EW",
                "name": "East West Line",
                "color": "#0066CC",
                "stationNumber": 8
              }
            ]
          }
        ],
        "createdAt": "2026-04-05T12:00:00Z",
        "updatedAt": "2026-04-05T12:00:00Z"
      }
    ],
    "page": { "number": 0, "size": 20, "totalElements": 42, "totalPages": 3 }
  },
  "message": "Venues retrieved successfully.",
  "timestamp": "2026-04-05T12:00:00Z",
  "path": "/api/v1/venues"
}
```

Each transit line entry includes `stationNumber`, the integer extracted from the station code (e.g., `EW8` → `8`).

### `POST /api/v1/venues/imports`

Bulk import venues from a JSON file. Requires the `ADMIN` role. The operation is transactional and idempotent — venues with an existing `sourceId` are skipped.

**cURL**

```bash
curl -X POST http://localhost:8080/api/v1/venues/imports \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -F "file=@venues.json"
```

**Request** (`multipart/form-data`)

| Field | Type | Description |
|-------|------|-------------|
| `file` | `file` | A JSON file containing an array of venue objects |

The JSON file must contain an array of venue objects:

```json
[
  {
    "sourceId": "SRC-001",
    "activityId": 1,
    "name": "Clementi Sports Hall",
    "address": "518 Clementi Ave 1",
    "postalCode": 129907,
    "latitude": 1.3150,
    "longitude": 103.7651,
    "stations": [
      {
        "code": "EW8",
        "name": "Clementi MRT Station",
        "color": "#0066CC",
        "latitude": 1.3148,
        "longitude": 103.7653
      }
    ]
  }
]
```

**Venue import fields**

| Field | Type | Validation |
|-------|------|------------|
| `sourceId` | `string` | <span class="attention">Required</span>, unique per venue |
| `activityId` | `integer` | <span class="attention">Required</span>, must match an existing activity's `referenceId` |
| `name` | `string` | <span class="attention">Required</span> |
| `address` | `string` | <span class="attention">Required</span> |
| `postalCode` | `integer` | Formatted as 6-digit string with leading zeros |
| `latitude` | `decimal` | Must be between -90 and 90 |
| `longitude` | `decimal` | Must be between -180 and 180 |
| `stations` | `array` | List of nearby stations |

**Station import fields**

| Field | Type | Validation |
|-------|------|------------|
| `code` | `string` | <span class="attention">Required</span>, must match `^([A-Za-z]+)(\d+)$` (e.g., `EW8`, `NS15`) |
| `name` | `string` | <span class="attention">Required</span> |
| `color` | `string` | Hex color code (e.g., `#0066CC`) |
| `latitude` | `decimal` | Station latitude |
| `longitude` | `decimal` | Station longitude |

The station `code` is parsed into two parts:
- **Letters** — transit line code (e.g., `EW`)
- **Digits** — station number on that line (e.g., `8`)

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "imported": 1
  },
  "message": "Venues imported successfully.",
  "timestamp": "2026-04-05T12:00:00Z",
  "path": "/api/v1/venues/imports"
}
```

## Error Handling

| Scenario | HTTP Status | Description |
|----------|-------------|-------------|
| Caller lacks `ADMIN` role | `403` | Import is admin-only |
| Invalid JSON file format | `400` | File cannot be parsed as JSON |
| Invalid station code format | `400` | Station code does not match `^([A-Za-z]+)(\d+)$` |
| Referenced activity does not exist | `404` | `activityId` has no matching activity |
| Auth token expired / missing | `401` | Redirect to login |
| Server error | `500` | Show retry prompt |

## Import Behavior

- **Idempotent**: Venues are deduplicated by `sourceId`. Re-importing a file with the same source IDs will skip existing venues and only import new ones.
- **Transactional**: The entire import succeeds or fails as a single transaction.
- **Station reuse**: Stations are matched by name. If a station already exists, the existing record is reused rather than creating a duplicate.
- **Transit line resolution**: Transit lines are resolved by the code parsed from the station code. New lines are created automatically if they don't exist.
