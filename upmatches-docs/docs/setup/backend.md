# Backend

Step-by-step guide to run the Upmatches API on your machine.

## Prerequisites

Install all of the following before continuing.

| Tool               | Version | Purpose                             | Install link                                    |
|--------------------|---------|-------------------------------------|-------------------------------------------------|
| **Docker Desktop** | Latest  | Runs the API, PostgreSQL, and Redis | https://www.docker.com/products/docker-desktop/ |
| **Git**            | Latest  | Clone the repository                | https://git-scm.com/downloads                   |

:::note
You do **not** need Java or Maven installed. Everything runs inside Docker containers.
:::

### Verify installations

Open a terminal and run each command. If any command fails, revisit the install link above.

```bash
docker --version        # e.g. Docker version 28.x.x
docker compose version  # e.g. Docker Compose version v2.x.x
git --version           # e.g. git version 2.x.x
```

:::tip Windows users
Use PowerShell or Windows Terminal. The commands below work on macOS, Linux, and Windows.
:::

---

## 1. Clone the repository

```bash
git clone <repository-url>
cd upmatches
```

---

## 2. Configure environment variables

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

Open `.env` in your editor and update the following:

```dotenv
# Pull the pre-built image from Docker Hub
DOCKER_IMAGE=chownrmrf/upmatches-api
IMAGE_TAG=latest

# Set your frontend origin so the API allows cross-origin requests
CORS_ALLOWED_ORIGINS=http://localhost:3002

# Infisical credentials (ask your team lead)
# Required for login flows (Singpass and Auth0) to work
INFISICAL_CLIENT_ID=<your-client-id>
INFISICAL_CLIENT_SECRET=<your-client-secret>
INFISICAL_PROJECT_ID=<your-project-id>
```

The remaining values in `.env` have sensible defaults and can be left as-is.

:::tip Local Singpass testing
For local development without calling the real Singpass staging environment, run [MockPass](https://github.com/opengovsg/mockpass) and copy the overrides from `.env.mockpass`. The API repo's `MOCKPASS.md` file lists the test NRICs and UUIDs you can use.
:::

### Reference: environment variables

| Group | Key variables |
|---|---|
| Server | `SERVER_PORT`, `SPRING_PROFILES_ACTIVE`, `SWAGGER_ENABLED` |
| Database | `POSTGRES_DB_HOST`, `POSTGRES_DB_PORT`, `POSTGRES_DB_NAME`, `POSTGRES_DB_USER`, `POSTGRES_DB_PASS` |
| DB pool | `DB_POOL_SIZE`, `DB_POOL_MIN_IDLE`, `DB_IDLE_TIMEOUT`, `DB_MAX_LIFETIME`, `DB_CONNECTION_TIMEOUT`, `DB_LEAK_DETECTION` |
| Flyway / cache | `FLYWAY_ENABLED`, `CACHE_TYPE` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD` |
| CORS | `CORS_ALLOWED_ORIGINS` (semicolon-delimited) |
| JWT | `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_TOKEN_EXPIRY_MINUTES`, `JWT_REFRESH_TOKEN_EXPIRY_DAYS`, `FRONTEND_CALLBACK_URL`, `MOBILE_CALLBACK_SCHEME` |
| Singpass | `SINGPASS_CLIENT_ID`, `SINGPASS_REDIRECT_URI`, `SINGPASS_ISSUER`, `SINGPASS_AUTHORIZATION_ENDPOINT`, `SINGPASS_PAR_ENDPOINT`, `SINGPASS_TOKEN_ENDPOINT`, `SINGPASS_JWKS_ENDPOINT`, `SINGPASS_USERINFO_ENDPOINT`, `SINGPASS_SCOPES`, `SINGPASS_AUTH_CONTEXT_TYPE`, `SINGPASS_AUTH_CONTEXT_MESSAGE`, `SINGPASS_PRIVATE_SIGNING_KEY_PATH`, `SINGPASS_PRIVATE_ENCRYPTION_KEY_PATH` |
| Auth0 | `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_REDIRECT_URI`, `AUTH0_SCOPES` |
| Infisical | `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`, `INFISICAL_PROJECT_ID`, `INFISICAL_ENVIRONMENT` |
| Share links | `SHARE_LINK_BASE_URL` |
| Observability | `TRACING_ENABLED`, `TRACING_OTLP_ENDPOINT`, `TRACING_SAMPLING_PROBABILITY` |

### Default infrastructure credentials (already configured)

| Service    | Host        | Port   | Username   | Password   | Database        |
|------------|-------------|--------|------------|------------|-----------------|
| PostgreSQL | `localhost` | `5432` | `postgres` | `postgres` | `upmatches_dev` |
| Redis      | `localhost` | `6379` | _(none)_   | _(none)_   | _(default)_     |

---

## 3. Start the services

Pull the latest API image and start all services (API, PostgreSQL, Redis):

```bash
docker compose pull && docker compose up -d
```

Wait a few seconds, then verify all three containers are running:

```bash
docker compose ps
```

You should see `upmatches-api`, `upmatches-db`, and `upmatches-redis` with status **healthy** (or **running** for the API).

On first startup the API will:

1. Connect to PostgreSQL and **automatically apply database migrations** (create tables, indexes, etc.).
2. Connect to Redis.
3. Fetch secrets from Infisical (if configured).

---

## 4. Verify it works

```bash
curl http://localhost:8080/actuator/health
```

Expected response:

```json
{
  "status": "UP"
}
```

---

## Quick reference

| What                         | Command                                      |
|------------------------------|----------------------------------------------|
| Pull latest API image        | `docker compose pull`                        |
| Start all services           | `docker compose up -d`                       |
| Stop all services            | `docker compose down`                        |
| Stop and **delete all data** | `docker compose down -v`                     |
| View logs (all services)     | `docker compose logs -f`                     |
| View API logs only           | `docker compose logs -f api`                 |
| Check service status         | `docker compose ps`                          |
| Check API health             | `curl http://localhost:8080/actuator/health` |

---

## API overview for frontend developers

### Base URL

```
http://localhost:8080
```

### Authentication

The API uses **cookie-based JWT authentication** (BFF pattern). After a successful login flow, the API sets `access_token` and `refresh_token` cookies. Your frontend should include credentials in requests:

```javascript
fetch("http://localhost:8080/api/v1/me", {
  credentials: "include",  // sends cookies with the request
});
```

### CORS

The API is configured to allow requests from `http://localhost:3002` by default. If your frontend runs on a different port, update the `CORS_ALLOWED_ORIGINS` value in your `.env` file and restart the API:

```bash
docker compose restart api
```

Multiple origins can be separated with a semicolon (`;`).

### Available endpoints

| Method   | Route                                                | Auth required | Description                        |
|----------|------------------------------------------------------|:-------------:|------------------------------------|
| `GET`    | `/actuator/health`                                   |      No       | Spring health check                |
| `GET`    | `/api/v1/public/health`                              |      No       | Application health check           |
| `GET`    | `/.well-known/jwks.json`                             |      No       | Public signing keys (JWKS)         |
| `GET`    | `/api/v1/auth/login/singpass`                        |      No       | Start Singpass login flow          |
| `GET`    | `/api/v1/auth/login/auth0`                           |      No       | Start Auth0 login flow             |
| `GET`    | `/callback/singpass`                                 |      No       | Singpass OAuth callback            |
| `GET`    | `/callback/auth0`                                    |      No       | Auth0 OAuth callback               |
| `POST`   | `/api/v1/auth/refresh`                               |      No       | Refresh access token               |
| `POST`   | `/api/v1/auth/logout`                                |      No       | Logout (clears cookies)            |
| `POST`   | `/api/v1/auth/dev/tokens`                            |      No*      | Mint test JWT (dev profiles only)  |
| `GET`    | `/api/v1/me`                                         |      Yes      | Get current user profile           |
| `POST`   | `/api/v1/me`                                         |      Yes      | Complete user profile (onboarding) |
| `PUT`    | `/api/v1/me`                                         |      Yes      | Update user profile                |
| `DELETE` | `/api/v1/me`                                         |      Yes      | Delete user account                |
| `GET`    | `/api/v1/me/games/joined`                            |      Yes      | List games the caller has joined   |
| `GET`    | `/api/v1/me/games/hosted`                            |      Yes      | List games the caller has hosted   |
| `GET`    | `/api/v1/activities`                                 |      No       | List activities (rate-limited)     |
| `GET`    | `/api/v1/activities/{id}`                            |      No       | Get activity by ID (rate-limited)  |
| `POST`   | `/api/v1/activities`                                 |      Yes      | Create activity                    |
| `PUT`    | `/api/v1/activities/{id}`                            |      Yes      | Update activity                    |
| `DELETE` | `/api/v1/activities/{id}`                            |      Yes      | Delete activity                    |
| `GET`    | `/api/v1/skill-levels?activityId=...`                |      Yes      | Get skill levels for an activity   |
| `GET`    | `/api/v1/venues`                                     |      No       | List venues (rate-limited)         |
| `POST`   | `/api/v1/venues/imports`                             |   Yes (admin) | Bulk import venues (multipart)     |
| `GET`    | `/api/v1/games`                                      |      No       | List games (cursor, rate-limited)  |
| `GET`    | `/api/v1/games/filter-options`                       |      No       | Filter options for a date range    |
| `GET`    | `/api/v1/games/{id}`                                 |      No       | Get a game (rate-limited)          |
| `POST`   | `/api/v1/games`                                      |      Yes      | Create a game                      |
| `PUT`    | `/api/v1/games/{id}`                                 |      Yes      | Update a game (organiser only)     |
| `DELETE` | `/api/v1/games/{id}`                                 |      Yes      | Soft-delete a game (organiser)     |
| `POST`   | `/api/v1/games/{id}/participants`                    |      Yes      | Join a game                        |
| `DELETE` | `/api/v1/games/{id}/participants/me`                 |      Yes      | Leave a game                       |
| `GET`    | `/api/v1/games/{id}/participants`                    |      Yes      | List participants                  |
| `DELETE` | `/api/v1/games/{gameId}/participants/{participantId}`|      Yes      | Expel participant (organiser)      |
| `DELETE` | `/api/v1/admin/games/{id}`                           |   Yes (admin) | Hard-delete a game                 |
| `GET`    | `/api/v1/game-bookmarks`                             |      Yes      | List the caller's bookmarks       |
| `POST`   | `/api/v1/game-bookmarks`                             |      Yes      | Bookmark a game                    |
| `DELETE` | `/api/v1/game-bookmarks/{gameId}`                    |      Yes      | Remove a bookmark                  |
| `POST`   | `/api/v1/share-links`                                |      Yes      | Create a share link                |
| `GET`    | `/api/v1/share-links/{code}`                         |      No       | Resolve a share link (rate-limited)|
| `GET`    | `/games/{code}`                                      |      No       | Web fallback HTML page             |
| `GET`    | `/api/v1/notifications`                              |      Yes      | List the caller's notifications    |
| `GET`    | `/api/v1/notifications/unread-count`                 |      Yes      | Unread notification count          |
| `PUT`    | `/api/v1/notifications/{id}/read`                    |      Yes      | Mark a notification as read        |
| `PUT`    | `/api/v1/notifications/read-all`                     |      Yes      | Mark all notifications as read     |
| `DELETE` | `/api/v1/notifications/{id}`                         |      Yes      | Delete a notification              |
| `POST`   | `/api/v1/device-tokens`                              |      Yes      | Register a push device token       |
| `DELETE` | `/api/v1/device-tokens?deviceToken=...`              |      Yes      | Unregister a push device token     |

\* `/api/v1/auth/dev/tokens` is gated by `DEV_MINT_ENDPOINT_ENABLED=true`, requires a non-`prod` profile, and only accepts requests originating from `localhost`.

### Auth flow (how login works)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Upmatches API
    participant IDP as Identity Provider

    FE->>API: GET /api/v1/auth/login/singpass
    API->>IDP: Redirect to Singpass/Auth0
    IDP->>API: Callback with auth code
    API->>API: Create/update user, set cookies
    API->>FE: Redirect to /auth/callback
    FE->>API: GET /api/v1/me (with cookies)
    API->>FE: User profile
```

1. Frontend redirects the user to `GET /api/v1/auth/login/singpass` (or `/auth0`).
2. The API redirects the user to the identity provider (Singpass or Auth0).
3. After login, the identity provider redirects back to the API callback URL.
4. The API processes the callback, creates or updates the user, and redirects to `http://localhost:3002/auth/callback` with auth cookies set.
5. Frontend can now call authenticated endpoints (e.g., `GET /api/v1/me`).

:::info New users
If the user has not completed onboarding, the callback redirect includes `?isNewUser=true`. Use this to route new users to an onboarding flow.
:::

---

## Troubleshooting

### Port already in use

If port `8080`, `5432`, or `6379` is already taken by another process:

```bash
# Check what's using a port (example: 8080)
# macOS/Linux
lsof -i :8080
# Windows (PowerShell)
netstat -ano | findstr :8080
```

Stop the conflicting process, or change the port in your `.env` file (e.g., `API_PORT=9090`) and restart.

### Docker containers not starting

```bash
# View container logs for errors
docker compose logs
```

### API fails to connect to database

Make sure the database and Redis containers are healthy before the API starts. Docker Compose handles this automatically via health checks, but if you see connection errors:

```bash
docker compose ps
```

Both `upmatches-db` and `upmatches-redis` should show status **healthy**. If they show **starting**, wait a few seconds and check again.

### Login flows not working

If Singpass or Auth0 login redirects fail, ensure the Infisical credentials are set correctly in your `.env` file. Without them, the API cannot fetch the required secrets (private keys, client secrets).

### Reset everything (nuclear option)

Stop containers, delete all data volumes, and start fresh:

```bash
docker compose down -v
docker compose pull && docker compose up -d
```

The API will re-create the database from scratch on next startup.
