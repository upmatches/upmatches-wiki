---
title: Activity
sidebar_position: 4
---

# Activity

## Overview

The activity module manages sport and activity types (e.g., Badminton, Volleyball) that serve as lookup references for other modules such as [Venue](/docs/modules/venue). It provides standard CRUD operations for managing activities.

Each activity has a database-generated `referenceId` — a stable integer identifier used for cross-referencing.

## Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Auto-generated primary key |
| `referenceId` | `integer` | Auto-generated unique integer identifier (database-managed, read-only) |
| `name` | `string` | Activity name, e.g. `Badminton` (unique, max 100 chars) |
| `createdAt` | `timestamp` | Record creation time |
| `updatedAt` | `timestamp` | Last update time |

## API Contract

All endpoints are under `/api/v1/activities` and require a valid JWT. Responses are wrapped in a standard `ApiResponse` envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "...",
  "timestamp": "2026-04-06T12:00:00Z",
  "path": "/api/v1/activities"
}
```

### `GET /api/v1/activities`

Returns all activities.

**cURL**

```bash
curl -X GET http://localhost:8080/api/v1/activities \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "referenceId": 1,
      "name": "Badminton"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "referenceId": 2,
      "name": "Volleyball"
    }
  ],
  "message": "Activities retrieved successfully.",
  "timestamp": "2026-04-06T12:00:00Z",
  "path": "/api/v1/activities"
}
```

### `GET /api/v1/activities/{id}`

Returns a single activity by UUID.

**cURL**

```bash
curl -X GET http://localhost:8080/api/v1/activities/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "referenceId": 1,
    "name": "Badminton"
  },
  "message": "Activity retrieved successfully.",
  "timestamp": "2026-04-06T12:00:00Z",
  "path": "/api/v1/activities/550e8400-e29b-41d4-a716-446655440000"
}
```

### `POST /api/v1/activities`

Creates a new activity.

**cURL**

```bash
curl -X POST http://localhost:8080/api/v1/activities \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Volleyball"
  }'
```

**Request body**

```json
{
  "name": "Volleyball"
}
```

| Field | Type | Validation |
|-------|------|------------|
| `name` | `string` | <span class="attention">Required</span>, non-blank, unique |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "referenceId": 3,
    "name": "Volleyball"
  },
  "message": "Activity created successfully.",
  "timestamp": "2026-04-06T12:00:00Z",
  "path": "/api/v1/activities"
}
```

### `PUT /api/v1/activities/{id}`

Updates an existing activity.

**cURL**

```bash
curl -X PUT http://localhost:8080/api/v1/activities/550e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tennis"
  }'
```

**Request body**

```json
{
  "name": "Tennis"
}
```

| Field | Type | Validation |
|-------|------|------------|
| `name` | `string` | <span class="attention">Required</span>, non-blank, unique |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "referenceId": 3,
    "name": "Tennis"
  },
  "message": "Activity updated successfully.",
  "timestamp": "2026-04-06T12:00:00Z",
  "path": "/api/v1/activities/550e8400-e29b-41d4-a716-446655440002"
}
```

### `DELETE /api/v1/activities/{id}`

Deletes an activity.

**cURL**

```bash
curl -X DELETE http://localhost:8080/api/v1/activities/550e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `204 No Content`**

No response body.

### `GET /api/v1/activities/{id}/skill-levels`

Returns the skill levels defined for a specific activity, ordered by `sortOrder`.

**cURL**

```bash
curl -X GET http://localhost:8080/api/v1/activities/550e8400-e29b-41d4-a716-446655440000/skill-levels \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Beginner",
      "sortOrder": 1
    },
    {
      "id": 2,
      "name": "Middle Beginner",
      "sortOrder": 2
    },
    {
      "id": 3,
      "name": "High Beginner",
      "sortOrder": 3
    },
    {
      "id": 4,
      "name": "Low Intermediate",
      "sortOrder": 4
    },
    {
      "id": 5,
      "name": "Middle Intermediate",
      "sortOrder": 5
    },
    {
      "id": 6,
      "name": "High Intermediate",
      "sortOrder": 6
    },
    {
      "id": 7,
      "name": "Expert",
      "sortOrder": 7
    }
  ],
  "message": "Skill levels retrieved successfully.",
  "timestamp": "2026-04-06T12:00:00Z",
  "path": "/api/v1/activities/550e8400-e29b-41d4-a716-446655440000/skill-levels"
}
```

## Error Handling

| Scenario | HTTP Status | Error Code | Client Behavior |
|----------|-------------|------------|-----------------|
| Activity not found | `404` | — | Show error |
| Activity name already exists | `409` | `ACTIVITY_ALREADY_EXISTS` | Highlight duplicate name |
| Missing or blank name | `400` | Validation error | Highlight invalid field |
| Auth token expired / missing | `401` | — | Redirect to login |
| Server error | `500` | — | Show retry prompt |
