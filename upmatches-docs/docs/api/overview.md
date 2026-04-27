---
title: Overview
sidebar_position: 1
---

# API Overview

Conventions shared by every Upmatches API endpoint. Module docs reference this page instead of repeating the envelope and error shapes.

## Base URL

```
http://localhost:8080
```

All business endpoints are versioned under `/api/v1`.

## JSON Conventions

- Request and response bodies use **camelCase** JSON keys.
- Timestamps are ISO-8601 `Instant` values in UTC (e.g. `2026-04-15T12:00:00Z`).
- Monetary amounts are decimal strings serialised from `BigDecimal`.
- Enums are serialised as uppercase strings (e.g. `SCHEDULED`, `PUBLIC`).

## Standard Response Envelope

Every successful response is wrapped in `ApiResponse<T>`:

```json
{
  "success": true,
  "data": { "...": "endpoint-specific payload" },
  "message": "Human-readable summary.",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/..."
}
```

Endpoints that return `204 No Content` (soft/hard deletes, leave game, delete bookmark) have no body.

## Pagination

Two pagination styles are used depending on the endpoint.

### Offset-based (`PagedResponse<T>`)

Used by `GET /api/v1/venues`, `GET /api/v1/notifications`, `GET /api/v1/activities`, `GET /api/v1/game-bookmarks`, etc. Accepts `page` and `size` query parameters (defaults `0` and `20`).

```json
{
  "success": true,
  "data": {
    "content": [ { "...": "item" } ],
    "page": {
      "number": 0,
      "size": 20,
      "totalElements": 42,
      "totalPages": 3
    }
  },
  "message": "...",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/..."
}
```

### Cursor-based (`CursorPagedResponse<T>`)

Used by `GET /api/v1/games`, `GET /api/v1/me/games/joined`, and `GET /api/v1/me/games/hosted` for keyset pagination on large, time-ordered datasets. Accepts an opaque `cursor` and `size` (default `20`, max `1000`).

```json
{
  "success": true,
  "data": {
    "content": [ { "...": "item" } ],
    "nextCursor": "eyJzdGFydFRpbWUiOiIyMDI2LTA1LTAxVDE5OjAwOjAwWiIsImlkIjoiN2E5YTNiMWEtLi4uIn0"
  },
  "message": "...",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/..."
}
```

`nextCursor` is `null` when there are no further pages. Pass it back as `?cursor=...` to fetch the next page. A malformed cursor returns `400`.

## Error Responses (RFC 7807)

Errors are returned as [`ProblemDetail`](https://datatracker.ietf.org/doc/html/rfc7807):

```json
{
  "type": "about:blank",
  "title": "Resource not found",
  "status": 404,
  "detail": "Game with id 123e4567-... was not found.",
  "instance": "/api/v1/games/123e4567-...",
  "timestamp": "2026-04-15T12:00:00Z"
}
```

Validation failures include a `errors` property listing each field violation.

### Common Exception → Status Mapping

| Exception | HTTP Status | Typical Trigger |
|---|---|---|
| `ResourceNotFoundException` | `404` | Missing record, or ownership mismatch (returned as 404 to avoid leaking existence) |
| `UnauthorizedException` | `401` | Missing/invalid JWT, invalid refresh token |
| `InvalidAuthRequestException` | `400` | Malformed auth parameters |
| `InvalidFileException` | `400` | Rejected bulk import file |
| `ConstraintViolationException` / `MethodArgumentNotValidException` | `400` | Bean Validation failure on path/query/body |
| `AccessDeniedException` | `403` | `@PreAuthorize` role check failed |
| `ExternalServiceException` | `502` / `503` | Upstream provider (Singpass, Auth0, Infisical) failure |

## Authentication

Protected endpoints accept a JWT resolved in this order:

1. `Authorization: Bearer <token>` header (preferred for mobile and server-to-server).
2. `access_token` HTTP cookie (used by the web BFF flow).

Access tokens are signed with **ES256**, live for **15 minutes**, and expose the public keys at [`GET /.well-known/jwks.json`](/docs/modules/authentication).

Refresh tokens are opaque, rotated on every `/api/v1/auth/refresh` call, and stored server-side (SHA-256 hashed) in Redis for 7 days.

## Public Endpoints

No JWT required:

- `GET /api/v1/public/health`
- `GET /api/v1/auth/login/singpass`, `GET /api/v1/auth/login/auth0`
- `GET /callback/singpass`, `GET /callback/auth0`
- `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
- `GET /.well-known/jwks.json`
- `GET /.well-known/apple-app-site-association`
- `GET /api/v1/share-links/{code}` (rate-limited; 8-char alphanumeric code)
- `GET /games/{code}` (web fallback for share links — returns HTML)
- `GET /api/v1/games`, `GET /api/v1/games/{id}`, `GET /api/v1/games/filter-options` (rate-limited via `PublicReadRateLimitFilter`)
- `GET /api/v1/venues` (rate-limited)
- `GET /api/v1/activities`, `GET /api/v1/activities/{id}` (rate-limited)
- `/v3/api-docs/**`, `/swagger-ui/**`, `/actuator/**`

The public read rate limiter applies to anonymous callers at **60 req/min per IP** and to authenticated callers at **240 req/min per user**. Resolve calls to `GET /api/v1/share-links/{code}` are rate-limited separately. Exceeding either limit returns `429 Too Many Requests` with a `Retry-After` header.

All other endpoints require authentication. Admin-only endpoints (`/api/v1/admin/**`) additionally require the `ADMIN` role.

Server-to-server endpoints under `/api/v1/internal/**` are not protected by JWT but require the shared `X-Internal-Secret` header — they are not callable from clients.
