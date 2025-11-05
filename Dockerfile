# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR /app

# Install dependencies with caching
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
