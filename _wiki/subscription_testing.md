# Local Development with IIS Express and ngrok

## Overview

This guide explains how to run the project locally with IIS Express and expose it to external services (like Google Subscription API) using ngrok as `localhost` is not publicly accessible, so ngrok provides a public tunnel to your local development environment.

**Architecture:**

```
Google Subscription API → https://abc123.ngrok.io/api/subscription/events
                 ↓ (ngrok tunnels internally)
                 http://localhost:5000/api/subscription/events
```

## Prerequisites

- Visual Studio with an ASP.NET project using IIS Express
- [ngrok](https://ngrok.com/) - Download Windows version from https://dashboard.ngrok.com/get-started/setup/windows

## Step 1: Set Up ngrok

### Initial Setup

1. Go to https://dashboard.ngrok.com/get-started/setup/windows
2. Create an account and log in
3. Download ngrok for Windows
4. Add your authentication token:
   ```powershell
   ngrok config add-authtoken <your-token>
   ```
5. Verify connection:
   ```powershell
   ngrok http http://localhost:5000
   ```

## Step 2: Configure Google Subscription API Integration

Once you have a stable ngrok URL from Step 3:

1. Go to Google Cloud Console
2. Navigate to your Subscription API subscription
3. Update the endpoint to your ngrok URL (e.g., `https://your-domain.ngrok-free.dev/api/subscription/events`)

### Using a Persistent Domain (Recommended)

To avoid changing endpoints every time you restart ngrok:

1. Go to https://dashboard.ngrok.com/domains/
2. Claim a permanent ngrok domain (free tier available)
3. Start ngrok with your domain:
   ```powershell
   ngrok http http://localhost:5000 --url=your-domain.ngrok-free.dev
   ```

## Important Considerations

### Endpoint Changes Affect Other Services

When you change your ngrok endpoint for testing, other services with active Subscription API subscriptions (Calendar, Microsoft integrations, etc.) will no longer receive notifications because they are configured with the old endpoint.

**Action required:** Update the subscription endpoints in Google Cloud for all affected services before changing your ngrok URL.

### Frontend Configuration

If you change the client/endpoint in Google Cloud, you must also update the frontend configuration:

- Update `src/environments/environments.ts` in the web project with the new endpoint URL

This ensures the frontend points to the correct backend endpoint.

## Troubleshooting

### Handling SSL Certificate Issues

If ngrok fails due to your local self-signed certificate, add the TLS verification skip flag:

```powershell
ngrok http http://localhost:5000 --url=your-domain.ngrok-free.dev --upstream-tls-verify=false
```

### Viewing ngrok Responses

To see request/response logs:

```powershell
ngrok http http://localhost:5000 --url=your-domain.ngrok-free.dev --log=stdout
```

### "Bad Request - Invalid Hostname"

**Problem:** IIS Express only accepts requests from hostnames it's configured to trust. When ngrok forwards requests with its hostname, IIS Express rejects them.

**Solution:** Use ngrok's `--host-header` flag to rewrite the Host header so IIS Express sees `localhost`:

```powershell
ngrok http http://localhost:5000 --url=your-domain.ngrok-free.dev --host-header="localhost:5000"
```

**The Following Works the Best!**

```powershell
ngrok http http://localhost:5000 --url=your-domain.ngrok-free.dev --host-header="localhost:5000"
```

### Self-Signed Certificate Rejection

**Problem:** ngrok hits a wall before reaching your route due to the self-signed certificate.

**Solution:** Combine both flags:

```powershell
ngrok http http://localhost:5000 --url=your-domain.ngrok-free.dev --host-header="localhost:5000" --upstream-tls-verify=false
```

### Public URL not loading / Network blocking check

If your public ngrok URL shows an error like **"sent an invalid response"** or **"connection is not secure"**, first determine whether requests are reaching ngrok at all (vs. your network/ISP blocking it).

- **Check the ngrok inspector**: open `http://127.0.0.1:4040` and then load the public URL in your browser.
  - If you see **no requests**, your browser likely **is not reaching ngrok** (DNS filtering, firewall, ISP security, etc.).

- **Use curl and look for block redirects/pages**:

```bash
curl -sv http://your-domain.ngrok-free.dev/ --max-time 10
curl -sv https://your-domain.ngrok-free.dev/ --max-time 10
```

  - If the `http://` request returns a `Location:` redirect to a **block/warn** page (often containing strings like `block`, `warn`, `umbrella`, `zscaler`, `fortiguard`), that strongly indicates **network filtering**.

- **Compare on another network**:
  - Test from your phone on **cellular** (Wi‑Fi off) or via a **VPN**.
  - If it works there but not on your main network, the main network/ISP is blocking/interfering.

- **Check DNS differences**:

```bash
nslookup your-domain.ngrok-free.dev
```

  - Compare results between networks (home vs cellular/VPN). If one network returns unusual results or fails while others work, that points to **DNS filtering**.
