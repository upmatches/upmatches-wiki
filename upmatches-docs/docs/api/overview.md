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

Endpoints that return lists accept `page` and `size` query parameters (defaults `0` and `20`). The `data` field is a `PagedResponse<T>`:

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
- `GET /api/v1/share-links/{code}` (rate-limited; 8-char alphanumeric code)
- `/v3/api-docs/**`, `/swagger-ui/**`, `/actuator/**`

All other endpoints require authentication. Admin-only endpoints additionally require the `ADMIN` role.
