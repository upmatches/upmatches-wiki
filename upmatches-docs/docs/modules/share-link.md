---
title: Share Link
sidebar_position: 6
---

# Share Link

## Overview

The share-link module turns any resource UUID (currently only `GAME`) into a short 8-character alphanumeric code that can be embedded in a URL. The resolver endpoint is the only unauthenticated endpoint that returns business data — it is rate-limited to protect against enumeration.

See the [API overview](/docs/api/overview) for the envelope and error shapes.

## Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Auto-generated primary key |
| `code` | `string` | 8 alphanumeric characters, matches `^[0-9A-Za-z]{8}$` |
| `resourceType` | `ResourceType` | Currently only `GAME` |
| `resourceId` | `string` | UUID of the target resource |
| `shareUrl` | `string` | Canonical resolve URL (e.g. `.../api/v1/share-links/aB3xY9kQ`) |
| `webUrl` | `string` | Deep link for web clients |
| `mobileUrl` | `string` | Deep link for mobile clients (custom scheme) |
| `clickCount` | `long` | Total successful resolves |
| `createdAt` | `Instant` | Audit timestamp |

Games automatically create a share link on `POST /api/v1/games`, so clients rarely need to call `POST /api/v1/share-links` directly.

## API Contract

### `POST /api/v1/share-links`

Requires authentication.

**cURL**

```bash
curl -X POST http://localhost:8080/api/v1/share-links \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "GAME",
    "resourceId": "7a9a3b1a-0000-0000-0000-000000000001"
  }'
```

**Request**

| Field | Type | Validation |
|-------|------|------------|
| `resourceType` | `ResourceType` | <span class="attention">Required</span>, currently `GAME` |
| `resourceId` | `string` | <span class="attention">Required</span>, must be a valid UUID |

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "bb...",
    "code": "aB3xY9kQ",
    "resourceType": "GAME",
    "resourceId": "7a9a3b1a-...",
    "shareUrl": "http://localhost:8080/api/v1/share-links/aB3xY9kQ",
    "webUrl": "https://app.upmatches.com/games/7a9a3b1a-...",
    "mobileUrl": "upmatches://games/7a9a3b1a-...",
    "clickCount": 0,
    "createdAt": "2026-04-15T12:00:00Z"
  },
  "message": "Share link created successfully.",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/share-links"
}
```

### `GET /api/v1/share-links/{code}`

**Public** — no authentication required. Rate-limited via `ShareLinkRateLimitFilter`. Path variable must match `^[0-9A-Za-z]{8}$`.

**cURL**

```bash
curl -X GET http://localhost:8080/api/v1/share-links/aB3xY9kQ
```

**Response `200 OK`** — `data` is a `PublicShareLinkResponse`, intentionally limited to fields safe to expose without auth:

```json
{
  "success": true,
  "data": {
    "resourceType": "GAME",
    "webUrl": "https://api.upmatches.dev/games/7a9a3b1a-...",
    "mobileUrl": "upmatches://games/7a9a3b1a-..."
  },
  "message": "Share link resolved successfully.",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/share-links/aB3xY9kQ"
}
```

The public response omits `resourceId`, `code`, `clickCount`, and any user-identifying fields — clients follow `webUrl` or `mobileUrl` to reach the resource through the authenticated flow.

## Error Handling

| Scenario | HTTP Status | Notes |
|---|---|---|
| Code does not match `^[0-9A-Za-z]{8}$` | `400` | Reject before DB lookup |
| Code not found | `404` | |
| Rate limit exceeded | `429` | Back off and retry |
| `resourceId` is not a valid UUID | `400` | |
