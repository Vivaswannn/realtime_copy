const express = require('express');
const app = express();
const path = require('path');

const socketIo = require('socket.io');
const http = require('http');
const server = http.createServer(app);

// Database module
const db = require('./db');

// CORS configuration - allow specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*';

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Cache latest location per connected socket id
const latestLocations = new Map();

// Rate limiting per socket (simple in-memory tracking)
const socketRateLimit = new Map();
const MAX_LOCATIONS_PER_SECOND = 10;

// Validate location data
function isValidLocation(data) {
    if (!data || typeof data !== 'object') return false;
    const { latitude, longitude } = data;
    
    // Check if latitude and longitude are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return false;
    }
    
    // Validate ranges: latitude -90 to 90, longitude -180 to 180
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return false;
    }
    
    // Check for NaN or Infinity
    if (!isFinite(latitude) || !isFinite(longitude)) {
        return false;
    }
    
    return true;
}

// Rate limiting check
function checkRateLimit(socketId) {
    const now = Date.now();
    const socketData = socketRateLimit.get(socketId) || { count: 0, resetTime: now + 1000 };
    
    if (now > socketData.resetTime) {
        socketData.count = 0;
        socketData.resetTime = now + 1000;
    }
    
    if (socketData.count >= MAX_LOCATIONS_PER_SECOND) {
        return false;
    }
    
    socketData.count++;
    socketRateLimit.set(socketId, socketData);
    return true;
}

io.on('connection', function(socket){
    console.log('a user connected:', socket.id);

    // Send all known locations to the newly connected client
    for (const [id, loc] of latestLocations.entries()) {
        // Skip sending back own location; will arrive when client emits
        if (id !== socket.id) {
            socket.emit('receive-location', { id, ...loc });
        }
    }

    socket.on('send-location', function(data){
        // Rate limiting
        if (!checkRateLimit(socket.id)) {
            socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
            return;
        }
        
        // Input validation
        if (!isValidLocation(data)) {
            socket.emit('error', { message: 'Invalid location data' });
            return;
        }
        
        try {
            console.log('Location received:', data);
            latestLocations.set(socket.id, data);
            
            // Save to database
            db.saveLocation(socket.id, data.latitude, data.longitude);
            
            io.emit('receive-location', {id: socket.id, ...data});
        } catch (error) {
            console.error('Error processing location:', error);
            socket.emit('error', { message: 'Server error processing location' });
        }
    });

    socket.on('disconnect', function(){
        console.log('user disconnected:', socket.id);
        latestLocations.delete(socket.id);
        socketRateLimit.delete(socket.id);
        io.emit('user-disconnected', socket.id);
    });
    
    socket.on('error', function(error) {
        console.error('Socket error:', error);
    });
});

// Health check endpoint
app.get('/health', function(req, res) {
    const analytics = db.getAnalytics();
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        activeConnections: io.engine.clientsCount,
        trackedUsers: latestLocations.size,
        database: {
            totalLocations: analytics ? analytics.totalLocations : 0,
            totalUsers: analytics ? analytics.totalUsers : 0
        }
    });
});

// Analytics endpoint - get summary statistics
app.get('/api/analytics', function(req, res) {
    try {
        const analytics = db.getAnalytics();
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Get location history for a specific user
app.get('/api/history/:socketId', function(req, res) {
    try {
        const socketId = req.params.socketId;
        const limit = parseInt(req.query.limit) || 100;
        const history = db.getLocationHistory(socketId, limit);
        res.json(history);
    } catch (error) {
        console.error('Error fetching location history:', error);
        res.status(500).json({ error: 'Failed to fetch location history' });
    }
});

// Get all location history (with optional date filters)
app.get('/api/history', function(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 1000;
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;
        const history = db.getAllLocationHistory(limit, startDate, endDate);
        res.json(history);
    } catch (error) {
        console.error('Error fetching all location history:', error);
        res.status(500).json({ error: 'Failed to fetch location history' });
    }
});

// Analytics page
app.get('/analytics', function(req, res) {
    res.render('analytics');
});

app.get('/', function(req, res) {
    res.render('index');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});

