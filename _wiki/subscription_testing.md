# Local Development with IIS Express and ngrok

## Overview

This guide explains how to run the project locally with IIS Express and expose it to external services (like Google Subscription API) using ngrok as `localhost` is not publicly accessible, so ngrok provides a public tunnel to your local development environment.

**Architecture:**

```
Google Subscription API → https://abc123.ngrok.io/api/subscription/events
                 ↓ (ngrok tunnels internally)
                 https://localhost:5000/api/subscription/events
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
   ngrok http https://localhost:5000
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
   ngrok http https://localhost:5000 --url=your-domain.ngrok-free.dev
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
ngrok http https://localhost:5000 --url=your-domain.ngrok-free.dev --upstream-tls-verify=false
```

### Viewing ngrok Responses

To see request/response logs:

```powershell
ngrok http https://localhost:5000 --url=your-domain.ngrok-free.dev --log=stdout
```

### "Bad Request - Invalid Hostname"

**Problem:** IIS Express only accepts requests from hostnames it's configured to trust. When ngrok forwards requests with its hostname, IIS Express rejects them.

**Solution:** Use ngrok's `--host-header` flag to rewrite the Host header so IIS Express sees `localhost`:

```powershell
ngrok http http://localhost:55404 --url=your-domain.ngrok-free.dev --host-header="localhost:55404"
```

**The Following Works the Best!**

```powershell
ngrok http https://localhost:5000 --url=your-domain.ngrok-free.dev --host-header="localhost:5000"
```

### Self-Signed Certificate Rejection

**Problem:** ngrok hits a wall before reaching your route due to the self-signed certificate.

**Solution:** Combine both flags:

```powershell
ngrok http https://localhost:5000 --url=your-domain.ngrok-free.dev --host-header="localhost:5000" --upstream-tls-verify=false
```
