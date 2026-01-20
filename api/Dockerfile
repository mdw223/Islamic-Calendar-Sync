# Use Node.js 18 LTS as base
FROM node:18-alpine
# Set working directory
WORKDIR /usr/src/app
# Create logs directory
RUN mkdir -p logs
# Copy package files, Copies host's package.json to container (/usr/src/app/)
COPY package*.json ./
# Install dependencies, Creates NEW node_modules in container (/usr/src/app/)
RUN npm install
# Copy source code
COPY src/ ./src/
# Expose port
EXPOSE 3000
# Start the application
CMD ["npm", "start"]