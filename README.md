# Realtime Tracker

This is a real-time tracking application built with Node.js, Express, Socket.io, and Leaflet.js.

## Features

- Real-time location tracking using Socket.io
- Interactive map display using Leaflet.js
- Responsive UI with EJS templating and static assets served via Express

## Installation

1. Clone the repository
2. Run `npm install` to install dependencies
3. Start the server with `node app.js`
4. Open your browser and navigate to `http://localhost:3000`

## Usage

- The app tracks user location in real-time and displays it on the map.
- Make sure to allow location access in your browser.

## Development

- The server uses Express to serve static files and handle socket connections.
- Client-side JavaScript uses Socket.io to send location data to the server.
