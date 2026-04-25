# Development Guide

## Project Overview

This is a full-stack application with:

- **Frontend**: React/Vite app running on port 5000
- **Backend**: Node.js/Express API running on port 3000
- **Database**: PostgreSQL with separate development and testing environments
- **Proxy**: Nginx reverse proxy on ports 80/443

## Environment Setup

### Environment Files

- `.env` - database credentials
- `.dockerignore` - Excludes unnecessary files from Docker builds
- `.gitignore` - Excludes sensitive files from Git

### Docker Compose Files

- `compose.yml` - Development environment configuration
- `compose.test.yml` - Testing environment configuration

## Development Workflow

## Starting the Production Environment

### Prerequisites

- Ensure you have `compose.prod.yml` and `.env.prod` in the project root.
- Production images for the API use `api/Dockerfile` (see `compose.prod.yml`). The SPA is not built or served by this stack when you use split hosting (GitHub Pages + VPS); see **Production Deployment** below.

### Start Production Stack

```bash
docker compose -f compose.prod.yml up -d --build
```

### Stopping Production Services

```bash
docker compose -f compose.prod.yml down
```

### Accessing Production (VPS / `compose.prod.yml`)

- **API (via Nginx)**: `http://localhost/api` when testing the stack on your machine (Nginx maps host port **80** to container 80; use `http://localhost/api/...` not port 5000).
- **Database**: internal to Docker; from the host, use `localhost:5432` only if you add a `ports` mapping (not included by default—connect with `docker exec` or add a port if required).
- **Redis**: not exposed on the host in production (API uses the `redis` service name on the internal network).

### Environment Variables

- Production environment variables are loaded from `.env.prod`.

### Container Names (Production)

- `api_service_prod` (port 3000, internal; reached via Nginx)
- `nginx_proxy_prod` (host **80** / **443** → container; TLS is configured in-container when Let’s Encrypt certs exist for `API_DOMAIN`; see `deployment-guide.md`)
- `ics_postgres_db_prod`
- `ics_redis_prod` (not published to the host)

### Notes

- For production, hot reloading is typically disabled.
- Make sure to use secure credentials and review `.env.prod` for sensitive values.
- If you deploy more web apps over time, scale vertically by moving to a larger Contabo VPS plan before splitting workloads across multiple VPS instances.

## Production Deployment (Contabo VPS + GitHub Pages + Namecheap)

This project can run with a split deployment model:

- **Backend** on Contabo VPS (`api`, `database`, `redis`, `proxy` using `proxy/nginx.prod.https.template`)
- **Frontend** on GitHub Pages (built from `app/` via GitHub Actions)
- **Domain/DNS** managed in Namecheap

Recommended public URLs:

- Frontend: `https://www.yourdomain.com`
- Backend API: `https://api.yourdomain.com`

### DNS Records in Namecheap

Create these records in Namecheap Advanced DNS:

1. `CNAME` -> Host: `www` -> Value: `<your-github-username>.github.io`
2. `A` -> Host: `api` -> Value: `<your-contabo-vps-public-ip>`

Optional root-domain setup:

- Point `@` to GitHub Pages IPs if you want `https://yourdomain.com` to serve frontend.

### GitHub Pages workflow (actions/deploy-pages)

The workflow is committed at:

- `.github/workflows/deploy-frontend-pages.yml`

It:

- Builds Vite frontend in `app/`
- Uses `actions/upload-pages-artifact`
- Deploys using `actions/deploy-pages`

GitHub setup steps:

1. Repository Settings -> Pages -> Source: **GitHub Actions**
2. Add secret in repository settings (must include the `/api` path; it matches Nginx and `HttpClient`):
   - `VITE_API_BASE_URL=https://api.yourdomain.com/api`
3. In Pages custom domain, set:
   - `www.yourdomain.com`
4. Enable **Enforce HTTPS** after certificate is issued.

### Backend deployment on Contabo VPS

On VPS:

1. Install Docker and Docker Compose plugin.
2. Open firewall ports: `22`, `80`, `443`.
3. Clone repo and create `.env.prod`.
4. Start production stack:

```bash
docker compose -f compose.prod.yml up -d --build
```

5. Verify:

```bash
docker compose -f compose.prod.yml ps
docker compose -f compose.prod.yml logs -f api
```

### Important backend adjustments for split hosting

Because the SPA is on GitHub Pages, production uses **API-only** Nginx (`proxy/nginx.prod.https.template` mounted directly by `compose.prod.yml`) and no longer includes the `app` service. Remaining work for a working split deploy:

- Configure backend CORS to allow:
  - `https://www.yourdomain.com`
  - (optional) `https://yourdomain.com`

If using cookies/sessions across domains, ensure secure cross-site cookie settings and matching CORS credentials configuration.

### TLS/HTTPS recommendations

- GitHub Pages provides TLS for `www.yourdomain.com` (custom domain + **Enforce HTTPS**).
- API TLS: set `API_DOMAIN` in `.env.prod`, issue Let’s Encrypt certs on the VPS, mount `/etc/letsencrypt` and restart `proxy` (full steps in `deployment-guide.md` section 7).
- Keep both frontend and backend strictly HTTPS in production.

### Deployment validation checklist

After rollout, verify:

1. `https://www.yourdomain.com` loads successfully.
2. Frontend API calls go to `https://api.yourdomain.com/api/...` (see `VITE_API_BASE_URL`).
3. No CORS errors in browser console.
4. API health endpoints return success.
5. Certificates are valid on both subdomains.

---

### Starting the Development Environment

```bash
# Start development stack
docker compose up -d
```

### Starting the Testing Environment

```bash
# Start testing stack
docker compose -f compose.test.yml up -d
```

### Container Management

#### Check Running Containers

```bash
# See all running containers
docker ps

# See all containers (including stopped)
docker ps -a

# Check specific service status
docker compose ps

# Check database environment variables
docker exec -it ics_postgres_db_dev env | grep POSTGRES
```

You should see 4 containers running:

- api_service (port 3000)
- react_app (port 5000)
- ics_postgres_db_dev (port 5432)
- nginx_proxy (port 8080)

#### Rebuilding and Recreating Containers

```bash
# Rebuild images and recreate containers (development)
docker compose up -d --build

# Force recreate containers (loses database data!)
docker compose up -d --force-recreate

# Normal development - reuse existing containers
docker compose up -d
```

The `-d` flag stands for "detached mode," meaning the containers will run in the background. You won't see the logs in the terminal, but you can still interact with running containers.

### Stopping Services

```bash
# Stop development services
docker compose down

# Stop testing services
docker compose -f compose.test.yml down

# Stop services and remove volumes (resets database)
docker compose down -v
```

## Accessing the Application

### Development Environment

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost/api
- **Database**: localhost:5432 (credentials from .env)

## Database Management

### Development Database

```bash
# Connect to development database
docker exec -it ics_postgres_db_dev psql -U ${DB_USER} -d ${DB_NAME}

# View database tables
\dt

# View database structure
\l
```

### Testing Database

```bash
# Connect to testing database
docker exec -it ics_postgres_db_test psql -U ${DB_USER} -d ${DB_NAME}

# View database tables
\dt

# View database structure
\l
```

### Database Reset

#### Development Database Reset

```bash
# Stop services and remove development database volume
docker compose down -v

# Restart with fresh database
docker compose up -d
```

#### Testing Database Reset

```bash
# Stop services and remove testing database volume
docker compose -f compose.test.yml down -v

# Restart with fresh database
docker compose -f compose.test.yml up -d
```

## Development Tips

### Hot Reloading

The volume mounts enable hot reloading:

- Frontend changes are reflected immediately
- Backend code changes trigger container restarts

### Environment Variables

Environment variables are loaded from:

- `.env` file
- Default values in compose.yml

### Code Changes

- **Frontend (app/)**: Changes are reflected immediately
- **Backend (api/)**: Restart the api service or rebuild the image
- **Configuration (proxy/)**: Rebuild the proxy image

### Common Commands

#### Development

```bash
# Start development environment
docker compose up -d

# View logs
docker compose logs -f

# View a specific service's logs (api)
docker compose logs api

# Check logs of the React app container
docker logs <container_id>

# Stop development environment
docker compose down

# To temporarily stop development environment
docker compose stop
```

#### Testing

```bash
# Start testing environment
docker compose -f compose.test.yml up -d

# View logs
docker compose -f compose.test.yml logs -f

# Stop testing environment
docker compose -f compose.test.yml down
```

#### Debugging

Add the following launch.json for vs code

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Attach to API",
      "type": "node",
      "request": "attach",
      "address": "localhost",
      "port": 9229,
      "localRoot": "${workspaceFolder}/api",
      "remoteRoot": "/app",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

```bash
docker compose -f compose.debug.yml up -d
```

Testing your database

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/db
```

The API only gets traffic when the path starts with /api: Nginx listens on port 5000 and forwards /api/\* to the API (after stripping the /api prefix) and everything else to the React app. Calling localhost:5000/health/db goes to the app (so you see the React HTML), and localhost:3000 isn’t used because the API’s port isn’t published to the host. To hit the health/db endpoint, use http://localhost:5000/api/health/db.

```bash
# Access container shell
docker exec -it ics_postgres_db_dev sh
docker exec -it api_service sh

# Check container status
docker compose ps

# Check network connections
docker network ls
docker network inspect app-network
```

## Project Structure

```
project/
├── _wiki                          # Wiki pages
├── compose.yml                    # Development configuration
├── compose.test.yml               # Testing configuration
├── .env                           # Development environment variables
├── .dockerignore                  # Docker build exclusions
├── .gitignore                     # Git exclusions
├── logs/                          # logs
├── api/                           # Backend service
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
├── app/                           # Frontend service
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
├── proxy/                         # Nginx reverse proxy
│   ├── nginx.conf                 # Dev (`compose.yml`): /api + React
│   └── nginx.prod.https.template  # Prod: HTTPS + HTTP→HTTPS redirect (requires existing Let’s Encrypt certs)
├── certbot/www/                   # Prod: ACME webroot (mounted into `proxy`; keep in repo via .gitkeep)
└── Sql.Migrations/                # Database initialization scripts

### Applying incremental DB migrations (existing databases)

For databases that were already initialized earlier, run migration files manually instead of relying on container init scripts.

Example:

```bash
docker exec -i ics_postgres_db_dev psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < Sql.Migrations/001_subscription_definition_selection.sql
```
```

## Architecture

This project uses Docker Compose with an Nginx reverse proxy. Understanding the architecture is crucial for configuring environment variables correctly.

```
┌────────────────────────────────────────────────────────┐
│                    Host Machine                        │
│                                                        │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Frontend   │    │    Backend   │                  │
│  │  (Vite)      │    │  (Express)   │                  │
│  │  Port 80     │    │  Port 3000   │                  │
│  │  (container) │    │  (container) │                  │
│  └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                          │
│         └──────────┬────────┘                          │
│                   │                                    │
│            ┌──────▼──────┐                             │
│            │ Nginx Proxy │                             │
│            │  Port 80    │                             │
│            │ (container) │                             │
│            └──────┬──────┘                             │
│                   │                                    │
│            ┌──────▼──────┐                             │
│            │   Host      │                             │
│            │ Port 5000   │                             │
│            └─────────────┘                             │
└────────────────────────────────────────────────────────┘
```

**Nginx Routing:**

- `/api/*` → Backend (rewrites to remove `/api` prefix)
- `/*` → Frontend

## Troubleshooting

### Port Conflicts

- Development: Port 5432 for database
- Testing: Port 5433 for database
- If ports are in use, check what's using them:
  ```bash
  lsof -i :5432
  lsof -i :5433
  ```

### Container Build Issues

```bash
# Clean up Docker cache
docker system prune -a

# Rebuild specific service (api)
docker compose build --no-cache api
```

### Network Issues

```bash
# Check network configuration
docker network inspect app-network

# Test service communication
docker exec -it api_service curl http://database:5432
```

### Database Connection Issues

```bash
# Check database container logs
docker compose logs database

# Test database connection from API container
docker exec -it api_service psql -h database -U ${DB_USER} -d ${DB_NAME}
```
