---
title: Health
sidebar_position: 8
---

# Health

Simple readiness probe for load balancers and uptime monitors.

## `GET /api/v1/public/health`

Public — no authentication.

**cURL**

```bash
curl -X GET http://localhost:8080/api/v1/public/health
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": "OK",
  "message": "Service is running",
  "timestamp": "2026-04-15T12:00:00Z",
  "path": "/api/v1/public/health"
}
```

For Spring-level health (database, Redis, disk) use the actuator endpoint `GET /actuator/health`.
