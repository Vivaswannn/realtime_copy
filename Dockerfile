# Use Node.js 18 Alpine as base image (lightweight)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy all source files into container
COPY . .

# Create data directory for SQLite database
RUN mkdir -p data

# Expose app port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
