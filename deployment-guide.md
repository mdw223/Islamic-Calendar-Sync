# Deployment Guide: Contabo VPS Backend + GitHub Pages Frontend + Namecheap Domain

This guide walks you through hosting:

- Backend API on a **Contabo VPS** (Docker containers)
- Frontend on **GitHub Pages** using **`actions/deploy-pages`**
- Custom domain from **Namecheap** (no `github.io` URL in normal usage)

The examples below use:

- Frontend source in `app/` (Vite build)
- Backend source in `api/`
- Domain: `yourdomain.com`
- Frontend URL: `https://www.yourdomain.com`
- API URL: `https://api.yourdomain.com`

---

## 1) Target architecture

- `api.yourdomain.com` -> Contabo VPS public IP -> Nginx reverse proxy -> API container
- `www.yourdomain.com` -> GitHub Pages
- Frontend calls backend at `https://api.yourdomain.com/api/...` (see `VITE_API_BASE_URL`)

This separates static hosting (cheap and simple) from backend runtime (VPS control).

---

## 2) Prerequisites

- A Contabo VPS (Ubuntu 22.04 or 24.04 recommended)
- A Namecheap domain
- GitHub repository (this project)
- Docker and Docker Compose files working locally
- Ability to edit DNS in Namecheap

---

## 3) Namecheap DNS setup

In Namecheap -> Domain List -> Manage -> Advanced DNS, create these records:

1. **Frontend subdomain (GitHub Pages)**
   - Type: `CNAME`
   - Host: `www`
   - Value: `<your-github-username>.github.io`
   - TTL: Automatic

2. **Backend API subdomain (Contabo VPS)**
   - Type: `A Record`
   - Host: `api`
   - Value: `<your-contabo-vps-public-ip>`
   - TTL: Automatic

If you also want root domain (`yourdomain.com`) to show frontend, add:

- Type: `A Record`
- Host: `@`
- Value: GitHub Pages IPs (from GitHub docs)

Then point GitHub Pages custom domain to root domain instead of `www`.

---

## 4) Prepare backend for VPS-only deployment

The repo is configured for split hosting:

- `compose.prod.yml` runs `api`, `database`, `redis`, and `proxy` only (no `app` container).
- Production Nginx is API-only (strips the `/api` path prefix, same contract as `proxy/nginx.conf` in development) and uses `proxy/nginx.prod.https.template` directly.
- `proxy/nginx.conf` is still used by `compose.yml` for local full-stack dev (React + API behind one port).

### 4.1 CORS for GitHub Pages domain

The API supports explicit CORS allowlisting via `CORS_ALLOWED_ORIGINS` and enables credentials (`Access-Control-Allow-Credentials: true`) for cookie-based auth.

Set `CORS_ALLOWED_ORIGINS` in `.env.prod` as a comma-separated list:

- `https://www.yourdomain.com`
- optionally `https://yourdomain.com` (if root serves frontend)

Example:

```env
CORS_ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com
```

This is read by `api/src/config.js` and applied in `api/src/index.js` using the Express `cors` middleware.

---

## 5) Contabo VPS initial server setup

SSH into your VPS:

```bash
ssh root@<vps-ip>
```

Install system updates and tooling:

```bash
apt update && apt upgrade -y
```

Install Docker Engine + Docker Compose plugin (official Docker docs method).

#### docker-compose-plugin isn't in Ubuntu's default repos — it comes from Docker's official repo.

#### Add Docker's official repo first

```bash
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
```

```bash
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Create and secure firewall:

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
```

---

## 6) Deploy backend containers on VPS

### 6.1 Clone repo and set production env

If your repository is private, the VPS needs credentials for future `git pull` operations. A deploy key is the safest simple option (repo-scoped, revocable, no PAT stored on server):

1. Generate a dedicated SSH key pair on the VPS:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/IslamicCalendarSync_deploy -N ""
   ```
2. Copy the public key:
   ```bash
   cat ~/.ssh/IslamicCalendarSync_deploy.pub
   ```
3. In GitHub repo settings, add that public key under **Deploy keys** (read-only is usually enough).
4. Configure SSH on the VPS to use that key for GitHub (`~/.ssh/config`):
   ```sshconfig
   Host github.com
     IdentityFile ~/.ssh/IslamicCalendarSync_deploy
     IdentitiesOnly yes
   ```

After this, `git pull` works on the VPS without logging into your GitHub account on the server.

```bash
git clone git@github.com:<your-org-or-user>/<your-repo>.git .
```

Create `.env.prod` with all production variables used by API and Postgres, plus:

- `API_DOMAIN=api.yourdomain.com` (must match the public API hostname and the Namecheap `A` record for `api`; used by Nginx `server_name` and TLS paths).
- `CORS_ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com` (second origin optional if you do not serve the frontend from root).

Do not commit `.env.prod`.

### 6.2 Use production compose

On the VPS, from the project root, start the backend stack with:

```bash
docker compose -f compose.prod.yml up -d --build
```

Verify:

```bash
docker compose -f compose.prod.yml ps
docker compose -f compose.prod.yml logs -f api
```

---

## 7) Enable HTTPS for the API (`api.yourdomain.com`)

TLS is terminated **inside the Nginx container** (`proxy` service). GitHub Pages already provides HTTPS for the frontend once you set a custom domain and enable **Enforce HTTPS** (see section 10).

### 7.1 What each system does

| System          | Role for HTTPS                                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Namecheap**   | DNS only: `api` → VPS IP. No API certificate here.                                                                                                                                                    |
| **Contabo VPS** | Hosts Docker; Nginx serves port **80** (ACME + HTTP or redirect) and **443** (API over TLS). Let’s Encrypt files live on the host at `/etc/letsencrypt` and are mounted read-only into the container. |
| **GitHub**      | Issues and renews TLS for `www.yourdomain.com` on Pages.                                                                                                                                              |

### 7.2 How the repo behaves

`compose.prod.yml` mounts `proxy/nginx.prod.https.template` directly as Nginx's active config template. This means the proxy expects certificate files to already exist at `/etc/letsencrypt/live/${API_DOMAIN}/...` when it starts.

### 7.3 Prerequisites before requesting a cert

1. Namecheap **A** record for `api` points to the VPS public IP (section 3).
2. Firewall allows **80** and **443** (section 5).
3. Stop anything already using ports 80/443 on the host while issuing the first cert (for example, stop the proxy container or any host web server).

4. `.env.prod` includes `API_DOMAIN=api.yourdomain.com` (same hostname you pass to Certbot).

### 7.4 Install Certbot on the VPS (host)

```bash
apt install -y certbot
```

### 7.5 Issue a certificate (standalone, first-time setup)

For first-time issuance, use standalone mode on the VPS host:

```bash
certbot certonly --standalone -d api.yourdomain.com
```

Follow the prompts (email, agree to terms). Certbot writes certificates under `/etc/letsencrypt` on the host (default).

Then start or restart the production stack:

```bash
docker compose -f compose.prod.yml up -d --build
```

Verify:

```bash
curl -sI https://api.yourdomain.com/api/health   # or your health path
```

### 7.6 Renewal

Certbot installs a **systemd** timer on Ubuntu (`certbot.timer`). With standalone renewals, port 80 must be free during challenge validation.

After renewal, reload Nginx in the container so it picks up renewed files (same paths):

```bash
cd IslamicCalendarSync
docker compose -f compose.prod.yml exec proxy nginx -s reload
```

Optional: add a deploy hook that temporarily stops/starts the proxy around renewals and then runs `nginx -s reload` (see Certbot deploy-hook documentation).

### 7.7 Frontend (GitHub Pages) HTTPS

No VPS change required for the SPA certificate. In GitHub: **Settings → Pages → Custom domain** set to `www.yourdomain.com`, wait for verification, then enable **Enforce HTTPS** (section 10).

### 7.8 Build-time API URL

Set repository secret `VITE_API_BASE_URL` to `https://api.yourdomain.com/api` (must include `/api`) so the Pages build talks to the API over HTTPS (section 8).

---

## 8) Configure frontend to use VPS API URL

The SPA uses `VITE_API_BASE_URL` in `app/src/util/HttpClient.js`. The value must include the **`/api` path** so it matches Nginx and your existing API routes (e.g. `/api/users/me` is rewritten to `/users/me` upstream).

- Example: `VITE_API_BASE_URL=https://api.yourdomain.com/api`

For GitHub Actions, store the same value as a repository **secret** named `VITE_API_BASE_URL`.

---

## 9) GitHub Pages setup (actions/deploy-pages method)

In GitHub repo:

1. Settings -> Pages
2. Build and deployment -> Source = **GitHub Actions**

Create workflow file:

`/.github/workflows/deploy-frontend-pages.yml`

```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: ["main"]
    paths:
      - "app/**"
      - ".github/workflows/deploy-frontend-pages.yml"
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: app/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        run: npm run build

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Commit and push.  
After workflow success, your site is live on GitHub Pages.

---

## 10) Connect custom domain in GitHub Pages

In GitHub:

1. Settings -> Pages -> Custom domain
2. Enter: `www.yourdomain.com`
3. Save and wait for DNS verification
4. Enable "Enforce HTTPS" once available

Optional `CNAME` file in frontend build source:

- Content: `www.yourdomain.com`

GitHub Pages may create/manage this automatically after custom domain is set.

---

## 11) Production checks

Run these checks after deployment:

1. `https://www.yourdomain.com` loads frontend
2. Frontend API calls target `https://api.yourdomain.com/api/...` (build-time `VITE_API_BASE_URL` includes `/api`)
3. API health endpoint responds
4. Browser shows valid HTTPS cert for both subdomains
5. No CORS errors in browser console
6. Backend logs show normal traffic and no crash loops

---

## 12) Ongoing operations

- Keep VPS patched (`apt upgrade`)
- Back up Postgres data and test restore
- Keep `.env.prod` and secrets out of git
- Monitor container health and disk usage
- Rotate credentials and API keys periodically

---

## 13) Troubleshooting quick guide

- **GitHub Pages deploy succeeds but blank app**  
  Usually wrong asset base path or missing environment variable at build time.

- **Frontend cannot reach API**  
  Check DNS (`api` record), firewall (`80/443`), reverse proxy, and API port binding.

- **CORS blocked**  
  Backend must allow exact frontend origin and credentials policy.

- **HTTPS not available on Pages custom domain**  
  Wait for DNS propagation and certificate provisioning; can take time.

- **Nginx exits on startup (certificate file not found)**  
  Ensure `API_DOMAIN` in `.env.prod` matches the Certbot `-d` name and certificate files exist under `/etc/letsencrypt/live/<that-hostname>/` before starting `proxy`.

- **Certbot fails with connection / timeout**  
  Confirm port 80 is open on the VPS, DNS for `api` resolves to this server, and `docker compose ... ps` shows `proxy` listening.

- **Backend 502/504 via proxy**  
  API container unhealthy or wrong upstream in Nginx.

---

## 14) Optional improvement: backend CI/CD

After this is stable, add a backend deployment workflow that:

1. SSHs to Contabo VPS
2. Pulls latest `main`
3. Runs `docker compose -f compose.prod.yml up -d --build`
4. Runs health checks and rolls back if needed

This gives one-command or automated backend releases.
