# Use Nginx as base
FROM nginx:alpine
# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
# Expose ports
EXPOSE 80 443
# Start nginx
CMD ["nginx", "-g", "daemon off;"]