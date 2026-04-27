---
title: Notifications
sidebar_position: 9
---

# Notifications

## Overview

The notification module delivers in-app notifications (retrievable via API) and push notifications (delivered via Firebase Cloud Messaging) to users for game-related events. Notifications are produced internally by game/participant lifecycle events and a reminder scheduler; clients only consume them.

Clients register a device token on login/app-launch so push notifications can reach the device, and unregister it on logout or token rotation.

## Data Model

### Notification

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Auto-generated primary key |
| `type` | `NotificationType` | Event type, e.g. `GAME_REMINDER_1_DAY` |
| `title` | `string` | Short headline (max 255 chars) |
| `message` | `string` | Full body (TEXT) |
| `resourceType` | `string?` | Domain object referenced by the notification (e.g. `GAME`) |
| `resourceId` | `UUID?` | ID of the referenced resource |
| `isRead` | `boolean` | `true` once the user has acknowledged it |
| `readAt` | `Instant?` | Timestamp the user marked it read |
| `createdAt` | `Instant` | When the notification was produced |

### DeviceToken

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Auto-generated primary key |
| `deviceToken` | `string` | FCM registration token (max 512 chars) |
| `platform` | `DevicePlatform` | `ANDROID`, `IOS`, or `WEB` |
| `createdAt` / `updatedAt` | `Instant` | Audit timestamps |

A `(user_id, device_token)` pair is unique — re-registering the same token is idempotent.

### Enums

| Enum | Values |
|---|---|
| `NotificationType` | `PLAYER_JOINED`, `PLAYER_LEFT`, `PLAYER_WARNING_MISMATCH`, `GAME_FULL`, `GAME_REMINDER_3_DAYS`, `GAME_REMINDER_1_DAY`, `GAME_UPDATED`, `GAME_REMOVED`, `PLAYER_REMOVED_FROM_GAME` |
| `DevicePlatform` | `ANDROID`, `IOS`, `WEB` |

## API Contract

All endpoints require a valid JWT. Notification endpoints are scoped to the caller (recipient). Responses follow the standard [API envelope](/docs/api/overview).

### `GET /api/v1/notifications`

Offset-paginated listing of the caller's notifications, sorted by `createdAt` descending.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/notifications?page=0&size=20" \
  -H "Authorization: Bearer <TOKEN>"
```

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `page` | `integer` | Zero-based page index, default `0` |
| `size` | `integer` | Page size, default `20` |

**Response `200 OK`** — `data` is a `PagedResponse<NotificationResponse>`:

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "b3f1...",
        "type": "GAME_REMINDER_1_DAY",
        "title": "Your game starts tomorrow",
        "message": "Clementi Sports Hall · 2026-05-01 19:00 SGT",
        "resourceType": "GAME",
        "resourceId": "7a9a3b1a-...",
        "isRead": false,
        "readAt": null,
        "createdAt": "2026-04-30T19:00:00Z"
      }
    ],
    "page": { "number": 0, "size": 20, "totalElements": 5, "totalPages": 1 }
  },
  "message": "Notifications retrieved successfully.",
  "timestamp": "2026-04-30T19:00:00Z",
  "path": "/api/v1/notifications"
}
```

### `GET /api/v1/notifications/unread-count`

Returns the count of the caller's unread notifications. Intended to back a badge on the notification bell.

**cURL**

```bash
curl -X GET http://localhost:8080/api/v1/notifications/unread-count \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": { "count": 3 },
  "message": "Unread count retrieved successfully.",
  "timestamp": "2026-04-30T19:00:00Z",
  "path": "/api/v1/notifications/unread-count"
}
```

### `PUT /api/v1/notifications/{id}/read`

Marks a single notification as read. Idempotent — calling again is a no-op.

**cURL**

```bash
curl -X PUT http://localhost:8080/api/v1/notifications/b3f1.../read \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `200 OK`** — the updated `NotificationResponse`.

Returns `404 Not Found` if the notification does not exist or belongs to another user.

### `PUT /api/v1/notifications/read-all`

Marks every unread notification for the caller as read in a single operation.

**cURL**

```bash
curl -X PUT http://localhost:8080/api/v1/notifications/read-all \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `200 OK`** — `data` is the number of notifications updated:

```json
{
  "success": true,
  "data": 3,
  "message": "All notifications marked as read.",
  "timestamp": "2026-04-30T19:00:00Z",
  "path": "/api/v1/notifications/read-all"
}
```

### `DELETE /api/v1/notifications/{id}`

Removes a notification from the caller's feed.

**cURL**

```bash
curl -X DELETE http://localhost:8080/api/v1/notifications/b3f1... \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `204 No Content`**

### `POST /api/v1/device-tokens`

Registers (or refreshes) the caller's device token for push notifications. The `(user, deviceToken)` pair is unique, so repeated calls with the same token are safe.

**cURL**

```bash
curl -X POST http://localhost:8080/api/v1/device-tokens \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "fcm-registration-token-abc123",
    "platform": "ANDROID"
  }'
```

**Request**

| Field | Type | Validation |
|---|---|---|
| `deviceToken` | `string` | <span class="attention">Required</span>, non-blank, max 512 chars |
| `platform` | `DevicePlatform` | <span class="attention">Required</span>, `ANDROID`, `IOS`, or `WEB` |

**Response `201 Created`** — empty `data`:

```json
{
  "success": true,
  "data": null,
  "message": "Device token registered successfully.",
  "timestamp": "2026-04-30T19:00:00Z",
  "path": "/api/v1/device-tokens"
}
```

### `DELETE /api/v1/device-tokens`

Unregisters a device token. Call this on logout, or when the FCM SDK rotates the token on the client.

**cURL**

```bash
curl -X DELETE "http://localhost:8080/api/v1/device-tokens?deviceToken=fcm-registration-token-abc123" \
  -H "Authorization: Bearer <TOKEN>"
```

**Query parameters**

| Parameter | Type | Validation |
|---|---|---|
| `deviceToken` | `string` | <span class="attention">Required</span>, non-blank, max 512 chars |

**Response `204 No Content`** — returns `204` whether or not the token was registered.

## Notification Triggers

Notifications are produced by internal services rather than by any client-facing endpoint:

| Trigger | Types produced |
|---|---|
| A player joins / leaves a game | `PLAYER_JOINED`, `PLAYER_LEFT`, `GAME_FULL` |
| A player's skill level falls outside a game's range | `PLAYER_WARNING_MISMATCH` |
| An organiser updates, cancels, or hard-deletes a game | `GAME_UPDATED`, `GAME_REMOVED`, `PLAYER_REMOVED_FROM_GAME` |
| Scheduled reminders (background job) | `GAME_REMINDER_3_DAYS`, `GAME_REMINDER_1_DAY` |

Each notification is persisted (so it appears in `GET /api/v1/notifications`) and, if the recipient has any registered device tokens, also dispatched via Firebase Cloud Messaging to those devices.

## Error Handling

| Scenario | HTTP Status | Notes |
|---|---|---|
| Notification does not exist or is owned by another user | `404` | `NotificationNotFoundException` |
| Missing / invalid `deviceToken` or `platform` | `400` | Validation error |
| Auth token expired / missing | `401` | Redirect to login |
