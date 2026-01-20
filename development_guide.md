# Development Guide

## Project Overview

This is a full-stack application with:

- **Frontend**: React/Vite app running on port 5173
- **Backend**: Node.js/Express API running on port 3000
- **Database**: PostgreSQL with separate development and testing environments
- **Proxy**: Nginx reverse proxy on ports 80/443

## Environment Setup

### Environment Files

- `.env.development` - Development database credentials
- `.env.testing` - Testing database credentials
- `.dockerignore` - Excludes unnecessary files from Docker builds
- `.gitignore` - Excludes sensitive files from Git

### Docker Compose Files

- `docker-compose.dev.yml` - Development environment configuration
- `docker-compose.test.yml` - Testing environment configuration

## Development Workflow

### Starting the Development Environment

```bash
# Start development stack
docker-compose -f docker-compose.dev.yml --env-file .env.development up -d

# Alternative syntax (newer Docker Compose v2)
docker compose -f docker-compose.dev.yml --env-file .env.development up -d
```

### Starting the Testing Environment

```bash
# Start testing stack
docker-compose -f docker-compose.test.yml --env-file .env.testing up -d

# Alternative syntax (newer Docker Compose v2)
docker compose -f docker-compose.test.yml --env-file .env.testing up -d
```

### Container Management

#### Check Running Containers

```bash
# See all running containers
docker ps

# See all containers (including stopped)
docker ps -a

# Check specific service status
docker-compose -f docker-compose.dev.yml ps

# Check database environment variables
docker exec -it ics_postgres_db_dev env | grep POSTGRES
```

#### Rebuilding and Recreating Containers

```bash
# Rebuild images and recreate containers (development)
docker-compose -f docker-compose.dev.yml --env-file .env.development up -d --build

# Force recreate containers (loses database data!)
docker-compose -f docker-compose.dev.yml --env-file .env.development up -d --force-recreate

# Normal development - reuse existing containers
docker-compose -f docker-compose.dev.yml --env-file .env.development up -d
```

### Stopping Services

```bash
# Stop development services
docker-compose -f docker-compose.dev.yml down

# Stop testing services
docker-compose -f docker-compose.test.yml down

# Stop services and remove volumes (resets database)
docker-compose -f docker-compose.dev.yml down -v
```

## Accessing the Application

### Development Environment

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Direct API**: http://localhost:3000
- **Database**: localhost:5432 (credentials from .env.development)

### Testing Environment

- **Frontend**: http://localhost (different backend endpoint)
- **Backend API**: http://localhost/api (points to test database)
- **Direct API**: http://localhost:3000
- **Database**: localhost:5433 (credentials from .env.testing)

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
docker-compose -f docker-compose.dev.yml down -v

# Restart with fresh database
docker-compose -f docker-compose.dev.yml --env-file .env.development up -d
```

#### Testing Database Reset

```bash
# Stop services and remove testing database volume
docker-compose -f docker-compose.test.yml down -v

# Restart with fresh database
docker-compose -f docker-compose.test.yml --env-file .env.testing up -d
```

## Development Tips

### Hot Reloading

The volume mounts enable hot reloading:

- Frontend changes are reflected immediately
- Backend code changes trigger container restarts

### Environment Variables

Development environment variables are loaded from:

- `.env.development` file
- Default values in docker-compose.dev.yml

Testing environment variables are loaded from:

- `.env.testing` file
- Default values in docker-compose.test.yml

### Code Changes

- Frontend (app/): Changes are reflected immediately
- Backend (api/): Restart the api service or rebuild the image
- Configuration (proxy/): Rebuild the proxy image

### Common Commands

#### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml --env-file .env.development up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

#### Testing

```bash
# Start testing environment
docker-compose -f docker-compose.test.yml --env-file .env.testing up -d

# View logs
docker-compose -f docker-compose.test.yml logs -f

# Stop testing environment
docker-compose -f docker-compose.test.yml down
```

#### Debugging

```bash# Access container shell
docker exec -it ics_postgres_db_dev sh
docker exec -it api_service sh

# Check container status
docker-compose -f docker-compose.dev.yml ps

# Check network connections
docker network ls
docker network inspect app-network
```

## Project Structure

```
project/
├── docker-compose.dev.yml         # Development configuration
├── docker-compose.test.yml        # Testing configuration
├── .env.development               # Development environment variables
├── .env.testing                   # Testing environment variables
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
│   ├── Dockerfile
│   ├── .dockerignore
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
docker-compose -f docker-compose.dev.yml build --no-cache api
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
docker-compose -f docker-compose.dev.yml logs database

# Test database connection from API container
docker exec -it api_service psql -h database -U ${DB_USER} -d ${DB_NAME}
```
