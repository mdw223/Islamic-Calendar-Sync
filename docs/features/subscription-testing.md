# Subscription Feed Testing

## Purpose

This guide explains how to validate the live ICS subscription endpoint in the current Node/Express stack.

## Endpoint

- Dev: `http://localhost:5000/api/subscription/events?token=<token>`
- Prod: `https://api.yourdomain.com/api/subscription/events?token=<token>`

This endpoint does not require login cookie/JWT. Access is controlled by the subscription token in the query string.

## Local Testing Steps

1. Start development stack:

```bash
docker compose up --build
```

2. Log in to app and create a subscription URL from the Subscriptions page.
3. Copy the generated URL.
4. Open URL in browser and confirm valid ICS response.

Optional checks:

```bash
curl -I "http://localhost:5000/api/subscription/events?token=<token>"
curl "http://localhost:5000/api/subscription/events?token=<token>"
```

## Revocation Test

1. Revoke the subscription URL in the app.
2. Retry the old URL.
3. Confirm request is rejected.

## Definition Selection Test

1. Create a subscription with a narrow definition subset.
2. Request ICS feed.
3. Confirm only selected definitions appear.

## Remote Tunnel Test (Optional)

```bash
ngrok http http://localhost:5000
```

Then test:

`https://<your-ngrok-domain>/api/subscription/events?token=<token>`

## Common Failure Cases

- Invalid/revoked token -> request denied
- Empty feed -> selected definitions exclude expected events or no generated events in range
- Wrong path -> must call `/api/subscription/events`
