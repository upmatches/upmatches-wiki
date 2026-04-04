---
title: Authentication
sidebar_position: 1
---

# Authentication

## Overview

Upmatches uses OAuth 2.0 with PKCE for authentication, supporting two identity providers: **Singpass** and **Auth0**. After authentication, the server issues a short-lived access token and a long-lived refresh token.

## Token Expiry

| Token | Expiry | Storage |
|-------|--------|---------|
| Access token | 15 minutes | JWT (ES256 signed) |
| Refresh token | 7 days | Opaque token, stored as SHA-256 hash in Redis |

## Auth Providers

| Provider | Use Case | ID Token Format |
|----------|----------|-----------------|
| Singpass | Singapore government identity | JWE encrypted, ES256 signed |
| Auth0 | Social / email login | RS256 signed |

## API Contract

All auth endpoints are under `/api/v1/auth`.

### `GET /api/v1/auth/login/singpass`

Initiates Singpass OAuth login.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/auth/login/singpass?platform=mobile"
```

**Response `200 OK` (mobile)**

```json
{
  "authorizationUrl": "https://stg-id.singpass.gov.sg/auth?..."
}
```

For web, returns a `302` redirect to the authorization URL.

### `GET /api/v1/auth/login/auth0`

Initiates Auth0 OAuth login.

**cURL**

```bash
curl -X GET "http://localhost:8080/api/v1/auth/login/auth0?platform=mobile&provider=google-oauth2"
```

**Response `200 OK` (mobile)**

```json
{
  "authorizationUrl": "https://your-tenant.auth0.com/authorize?..."
}
```

For web, returns a `302` redirect to the authorization URL.

### `POST /api/v1/auth/refresh`

Refreshes the access token. Accepts the refresh token from either a cookie (web) or request body (mobile). The old refresh token is invalidated and a new one is issued (token rotation).

**cURL (mobile)**

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

**Request body (mobile)**

```json
{
  "refreshToken": "<REFRESH_TOKEN>"
}
```

**Response `200 OK` (mobile)**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "new-base64-encoded-token",
  "expiresAt": 1712234400
}
```

**Response `200 OK` (web)**

```json
{
  "message": "Token refreshed successfully."
}
```

Tokens are set in HttpOnly cookies for web clients.

### `POST /api/v1/auth/logout`

Logs out the user and revokes all refresh tokens.

**cURL**

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `200 OK`**

```json
{
  "message": "Logged out successfully."
}
```

## Access Token Claims

| Claim | Description |
|-------|-------------|
| `sub` | User UUID |
| `iss` | `upmatches` |
| `aud` | `upmatches` |
| `iat` | Issued at timestamp |
| `nbf` | Not before timestamp |
| `exp` | Expiration timestamp |
| `auth_provider` | `singpass` or `auth0` |
| `singpass_uuid` | Singpass UUID (if applicable) |
| `auth0_uuid` | Auth0 UUID (if applicable) |

## Cookie Configuration (Web)

| Cookie | HttpOnly | Secure | SameSite | Max Age |
|--------|----------|--------|----------|---------|
| `access_token` | Yes | Yes (HTTPS) | Strict | 15 minutes |
| `refresh_token` | Yes | Yes (HTTPS) | Strict | 7 days |
| `token_expiry` | No | Yes (HTTPS) | Strict | 15 minutes |

The `token_expiry` cookie is readable by the client to know when to trigger a refresh.

## Error Handling

| Scenario | HTTP Status | Error Code | Client Behavior |
|----------|-------------|------------|-----------------|
| Invalid or expired refresh token | `401` | `invalid_refresh_token` | Redirect to login |
| Missing code or state in callback | `400` | `invalid_request` | Show error |
| Invalid provider | `400` | `invalid_provider` | Show error |
| OAuth state mismatch (expired session) | `401` | — | Restart login flow |

## Security

- **PKCE**: All OAuth flows use code challenge/verifier (S256)
- **Token rotation**: Refresh tokens are single-use; a new token is issued on each refresh
- **Token hashing**: Refresh tokens are stored as SHA-256 hashes in Redis
- **CSRF protection**: OAuth state parameter validated against Redis session (5-minute expiry)
- **Nonce validation**: Prevents token replay attacks
- **DPoP proofs**: Singpass uses Demonstration of Proof-of-Possession
