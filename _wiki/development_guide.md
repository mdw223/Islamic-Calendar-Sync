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
- `compose-test.yml` - Testing environment configuration

## Development Workflow

### Starting the Development Environment

```bash
# Start development stack
docker compose up -d
```

### Starting the Testing Environment

```bash
# Start testing stack
docker compose -f compose-test.yml up -d
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
docker compose -f compose-test.yml down

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
docker compose -f compose-test.yml down -v

# Restart with fresh database
docker compose -f compose-test.yml up -d
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
docker compose -f compose-test.yml up -d

# View logs
docker compose -f compose-test.yml logs -f

# Stop testing environment
docker compose -f compose-test.yml down
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
docker compose -f compose.yml -f compose.debug.yml up -d
```

Testing your database

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/db
```

The API only gets traffic when the path starts with /api: Nginx listens on port 5000 and forwards /api/* to the API (after stripping the /api prefix) and everything else to the React app. Calling localhost:5000/health/db goes to the app (so you see the React HTML), and localhost:3000 isn’t used because the API’s port isn’t published to the host. To hit the health/db endpoint, use http://localhost:5000/api/health/db.

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
├── compose-test.yml               # Testing configuration
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
│   └── nginx.conf
└── Sql.Migrations/                # Database initialization scripts
```

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

# Rebuild specific service
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
