# Use Node.js 22
FROM node:22-alpine
# Set working directory
WORKDIR /app
# Create logs directory
RUN mkdir -p logs
# Copy package files, Copies host's package.json to container
COPY package*.json ./
# Install dependencies, Creates NEW node_modules in container 
RUN npm install
# Copy source code
COPY src/ ./src/
# Start the application
CMD ["npm", "start"]