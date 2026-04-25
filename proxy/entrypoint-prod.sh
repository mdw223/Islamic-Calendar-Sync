#!/bin/sh
set -e
if [ -z "${API_DOMAIN}" ]; then
  echo "proxy: API_DOMAIN is required (set it in .env.prod, e.g. API_DOMAIN=api.yourdomain.com)" >&2
  exit 1
fi
if [ -f "/etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem" ]; then
  echo "proxy: TLS certificates found for ${API_DOMAIN}; enabling HTTPS."
  cp /templates/nginx.prod.https.template /etc/nginx/templates/default.conf.template
else
  echo "proxy: No TLS certificates yet for ${API_DOMAIN}; HTTP only. Issue a cert (see deployment-guide.md), then restart this container."
  cp /templates/nginx.prod.http.template /etc/nginx/templates/default.conf.template
fi
exec /docker-entrypoint.sh nginx -g 'daemon off;'
