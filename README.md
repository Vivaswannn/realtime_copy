# Realtime Tracker

This is a real-time tracking application built with Node.js, Express, Socket.io, and Leaflet.js.

## Features

- Real-time location tracking using Socket.io
- Interactive map display using Leaflet.js
- Responsive UI with EJS templating and static assets served via Express

## Installation

1. Clone the repository
2. Run `npm install` to install dependencies
3. Start the server with `npm start`
4. Open your browser and navigate to `http://localhost:3000`

## Usage

- The app tracks user location in real-time and displays it on the map.
- Make sure to allow location access in your browser.

## Development

- The server uses Express to serve static files and handle socket connections.
- Client-side JavaScript uses Socket.io to send location data to the server.

## Deployment

### Deploy on Render
1. Push this project to a GitHub repository.
2. Go to Render, create a new Web Service, and connect your repo.
3. Environment:
   - Runtime: Node 18+
   - Build Command: (leave empty)
   - Start Command: `npm start`
4. Deploy. Once live, open the public URL on two devices/browsers and allow location access.

### Deploy on Railway
1. Push this project to GitHub.
2. In Railway, create a new project → Deploy from GitHub → select your repo.
3. Set Start Command to `npm start` (no build command required).
4. Deploy and test using the public URL on two devices/browsers.

## Docker

Build and run locally:

```bash
docker build -t realtime-tracker .
docker run -p 3000:3000 -e PORT=3000 --name realtime-tracker --rm realtime-tracker
```

Then open `http://localhost:3000`.

## Jenkins CI (Docker image)

The included `Jenkinsfile` builds the app and Docker image, and can optionally push to a registry.

- Required on the Jenkins agent: Docker and Node (for npm install).
- Optional env vars (set in Jenkins job):
  - `DOCKER_REGISTRY` (e.g., `docker.io/youruser`)
  - `DOCKER_CREDENTIALS_ID` (Jenkins username/password credentials for registry)

Pipeline stages:
- Install deps (`npm ci`)
- Docker build: `realtime-tracker:${BUILD_NUMBER}`
- If registry vars provided: tag and push `:${BUILD_NUMBER}` and `:latest`
