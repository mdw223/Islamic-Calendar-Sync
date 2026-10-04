# Documentation

Start here if you're new to the project.

## Getting started

- [Setup](getting-started/setup.md) — run the API and React app locally
- [Development](getting-started/development.md) — Docker workflows, env files, day-to-day work
- [Deployment](getting-started/deployment.md) — Contabo VPS backend, GitHub Pages frontend, domain

## Architecture

- [Entities](architecture/entities.md) — core data model
- [API design](architecture/api.md) — endpoints, auth, status codes
- [Islamic events](architecture/islamic-events.md) — definition data, generation, Hijri conversion
- [Wireframes](architecture/wireframes.md) — UI sketches (needs mobile-first redesign)

## Auth

- [JWT](auth/jwt.md) — cookie/bearer auth with passport-jwt
- [Google OAuth](auth/google-oauth.md) — Google login → app JWT
- [Subscription tokens](auth/subscription-tokens.md) — ICS feed URL credentials

## Features

- [Offline & PWA](features/offline-pwa.md) — IndexedDB fallback and shell caching
- [Logging](features/logging.md) — Winston + Postgres transport
- [Subscription testing](features/subscription-testing.md) — validate live ICS feeds

## Report

- [Final report](report/FINAL_REPORT.md) — CSC 490 independent study write-up
