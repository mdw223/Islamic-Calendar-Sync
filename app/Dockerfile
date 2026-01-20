# Use Node.js as base for Vite build
FROM node:18-alpine as build
# Set working directory
WORKDIR /usr/src/app
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy source code
COPY . .
# Build the application
RUN npm run build
# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port
EXPOSE 5173
# Start nginx
CMD ["nginx", "-g", "daemon off;"]