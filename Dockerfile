# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install dependencies with caching
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY . .

# Create data directory for database persistence
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Use volume for database persistence (mount at runtime)
# Example: docker run -v $(pwd)/data:/app/data ...
CMD ["npm", "start"]
