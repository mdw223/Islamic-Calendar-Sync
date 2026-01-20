# Setup Guide

## Prerequisites

Download and install the following:

- **PostgreSQL**: [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
- **Docker**: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

## Installation

### API Setup

Navigate to the API directory and initialize the project:

```bash
cd api
npm init -y
```

This initializes a new Node.js project and creates a `package.json` file with default settings. The `-y` flag accepts all prompts automatically.

Install the required dependencies:

```bash
npm install express@^4.18.2 cors@^2.8.5 dotenv@^16.3.1 pg@^8.11.3
```

**Dependencies explained:**

- `express` - Web framework for Node.js that handles HTTP requests, routes, and middleware
- `cors` - Enables Cross-Origin Resource Sharing, allowing the frontend to call backend APIs
- `dotenv` - Loads environment variables from `.env` files into the application
- `pg` - PostgreSQL client for Node.js to connect to the database

Install development dependencies:

```bash
npm install --save-dev tsx@^4.6.2 jest@^29.6.4
```

Install for logging:

```bash
npm install express-request-logger winston
```

### App Setup (React/Vite)

Navigate to the app directory and create a new Vite project:

```bash
cd ../app
npm create vite@latest . -- --template react
```

This creates a Vite project using the React template.

Install dependencies:

```bash
npm install
npm install react-dom
```

The second command explicitly installs React DOM for rendering React components.
