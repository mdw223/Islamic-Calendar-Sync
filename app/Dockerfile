# Use Node.js 22
FROM node:22-alpine
# Set working directory
WORKDIR /app
# Copy package files, Copies host's package.json to container (/usr/src/app/)
COPY package*.json ./
# Install dependencies, Creates NEW node_modules in container (/usr/src/app/)
RUN npm install
# Copy source code
COPY . .
# Start the application
CMD ["npm", "run", "dev"]

