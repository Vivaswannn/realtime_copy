const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');

const socketIo = require('socket.io');
const http = require('http');
const server = http.createServer(app);

// Database module
const db = require('./db');

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Parse URL-encoded bodies (for login form)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS configuration - allow specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*';

// Trust proxy (important for Render and other reverse proxies)
app.set('trust proxy', true);

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    // Allow Socket.io to work behind proxies
    allowRequest: (req, callback) => {
        // Trust all requests (for proxy scenarios)
        callback(null, true);
    }
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Cache latest location per connected socket id
const latestLocations = new Map();

// Store IP address and user agent per socket
const socketInfo = new Map();

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
    // Get IP address and user agent from socket handshake
    // Try multiple methods to get IP (for different deployment scenarios)
    let ipAddress = 'unknown';
    
    // Method 1: Check X-Forwarded-For header (for proxies like Render)
    if (socket.handshake.headers) {
        const xForwardedFor = socket.handshake.headers['x-forwarded-for'] || 
                             socket.handshake.headers['X-Forwarded-For'] ||
                             socket.handshake.headers['X-Real-IP'];
        if (xForwardedFor) {
            ipAddress = xForwardedFor.split(',')[0].trim();
        }
    }
    // Method 2: Check socket.handshake.address
    if (ipAddress === 'unknown' && socket.handshake.address) {
        // Remove port if present (format: "::ffff:192.168.1.1:12345" or "::1")
        const addr = socket.handshake.address;
        if (addr.includes('::ffff:')) {
            // IPv4-mapped IPv6 address
            ipAddress = addr.split('::ffff:')[1].split(':')[0];
        } else if (addr.includes(':')) {
            // Regular IPv6 or IPv4 with port
            const parts = addr.split(':');
            if (parts.length > 2) {
                // IPv6, take the last part if it looks like IPv4
                ipAddress = parts[parts.length - 1];
            } else {
                ipAddress = parts[0];
            }
        } else {
            ipAddress = addr;
        }
    }
    // Method 3: Check socket.request
    if (ipAddress === 'unknown' && socket.request && socket.request.connection && socket.request.connection.remoteAddress) {
        ipAddress = socket.request.connection.remoteAddress;
    }
    // Method 4: Check socket.client
    if (ipAddress === 'unknown' && socket.client && socket.client.conn && socket.client.conn.remoteAddress) {
        ipAddress = socket.client.conn.remoteAddress;
    }
    
    const userAgent = (socket.handshake.headers && socket.handshake.headers['user-agent']) || 'unknown';
    
    console.log('=== NEW CONNECTION ===');
    console.log('Socket ID:', socket.id);
    console.log('IP Address:', ipAddress);
    console.log('User-Agent:', userAgent);
    console.log('Handshake address:', socket.handshake.address);
    console.log('Handshake headers keys:', Object.keys(socket.handshake.headers || {}));
    if (socket.handshake.headers) {
        console.log('X-Forwarded-For:', socket.handshake.headers['x-forwarded-for'] || socket.handshake.headers['X-Forwarded-For']);
        console.log('X-Real-IP:', socket.handshake.headers['x-real-ip'] || socket.handshake.headers['X-Real-IP']);
    }
    console.log('======================');
    
    // Store IP and user agent for this socket
    socketInfo.set(socket.id, { ipAddress, userAgent });

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
            // Get stored IP and user agent for this socket
            const info = socketInfo.get(socket.id) || { ipAddress: 'unknown', userAgent: 'unknown' };
            
            console.log('Location received:', data, 'from IP:', info.ipAddress);
            latestLocations.set(socket.id, data);
            
            // Save to database with IP and user agent
            db.saveLocation(socket.id, data.latitude, data.longitude, info.ipAddress, info.userAgent);
            
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
        socketInfo.delete(socket.id); // Clean up socket info
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

// Authentication middleware for analytics
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        return res.redirect('/analytics/login');
    }
}

// Analytics login page
app.get('/analytics/login', function(req, res) {
    // If already authenticated, redirect to analytics
    if (req.session && req.session.authenticated) {
        return res.redirect('/analytics');
    }
    res.render('analytics-login', { error: null });
});

// Analytics login POST handler
app.post('/analytics/login', function(req, res) {
    const password = process.env.ANALYTICS_PASSWORD || 'admin123'; // Default password, change via env var
    const enteredPassword = req.body.password;
    
    if (enteredPassword === password) {
        req.session.authenticated = true;
        req.session.save(function(err) {
            if (err) {
                console.error('Session save error:', err);
                return res.render('analytics-login', { error: 'Login failed. Please try again.' });
            }
            res.redirect('/analytics');
        });
    } else {
        res.render('analytics-login', { error: 'Incorrect password. Please try again.' });
    }
});

// Analytics logout
app.get('/analytics/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            console.error('Session destroy error:', err);
        }
        res.redirect('/analytics/login');
    });
});

// Analytics endpoint - get summary statistics (protected)
app.get('/api/analytics', requireAuth, function(req, res) {
    try {
        const analytics = db.getAnalytics();
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Get location history for a specific user (protected)
app.get('/api/history/:socketId', requireAuth, function(req, res) {
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

// Get all location history (with optional date filters) (protected)
app.get('/api/history', requireAuth, function(req, res) {
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

// Analytics page (protected)
app.get('/analytics', requireAuth, function(req, res) {
    res.render('analytics');
});

app.get('/', function(req, res) {
    res.render('index');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});

