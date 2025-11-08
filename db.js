const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path - use data directory for persistence
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'locations.db');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
function initializeDatabase() {
    // Locations table - stores all location updates
    db.exec(`
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            socket_id TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create indexes for locations table
    db.exec(`CREATE INDEX IF NOT EXISTS idx_locations_socket_id ON locations(socket_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp)`);

    // Sessions table - tracks user sessions
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            socket_id TEXT UNIQUE NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            location_count INTEGER DEFAULT 0
        )
    `);

    // Create index for sessions table
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_socket_id ON sessions(socket_id)`);

    console.log('Database initialized successfully');
}

// Initialize on module load
initializeDatabase();

// Save location to database
function saveLocation(socketId, latitude, longitude, ipAddress = null, userAgent = null) {
    try {
        // Insert location
        const insertLocation = db.prepare(`
            INSERT INTO locations (socket_id, latitude, longitude, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        `);
        insertLocation.run(socketId, latitude, longitude, ipAddress, userAgent);

        // Update or insert session
        const upsertSession = db.prepare(`
            INSERT INTO sessions (socket_id, ip_address, user_agent, last_seen, location_count)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)
            ON CONFLICT(socket_id) DO UPDATE SET
                last_seen = CURRENT_TIMESTAMP,
                location_count = location_count + 1
        `);
        upsertSession.run(socketId, ipAddress, userAgent);

        return true;
    } catch (error) {
        console.error('Error saving location to database:', error);
        return false;
    }
}

// Get location history for a specific socket_id
function getLocationHistory(socketId, limit = 100) {
    try {
        const stmt = db.prepare(`
            SELECT latitude, longitude, timestamp
            FROM locations
            WHERE socket_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `);
        return stmt.all(socketId, limit);
    } catch (error) {
        console.error('Error fetching location history:', error);
        return [];
    }
}

// Get all location history (for analytics)
function getAllLocationHistory(limit = 1000, startDate = null, endDate = null) {
    try {
        let query = `
            SELECT socket_id, latitude, longitude, timestamp
            FROM locations
        `;
        const params = [];

        if (startDate || endDate) {
            const conditions = [];
            if (startDate) {
                conditions.push('timestamp >= ?');
                params.push(startDate);
            }
            if (endDate) {
                conditions.push('timestamp <= ?');
                params.push(endDate);
            }
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(limit);

        const stmt = db.prepare(query);
        return stmt.all(...params);
    } catch (error) {
        console.error('Error fetching all location history:', error);
        return [];
    }
}

// Get analytics summary
function getAnalytics() {
    try {
        // Total locations
        const totalLocations = db.prepare('SELECT COUNT(*) as count FROM locations').get();
        
        // Total unique users
        const totalUsers = db.prepare('SELECT COUNT(DISTINCT socket_id) as count FROM locations').get();
        
        // Locations in last 24 hours
        const last24h = db.prepare(`
            SELECT COUNT(*) as count 
            FROM locations 
            WHERE timestamp >= datetime('now', '-1 day')
        `).get();
        
        // Locations in last hour
        const lastHour = db.prepare(`
            SELECT COUNT(*) as count 
            FROM locations 
            WHERE timestamp >= datetime('now', '-1 hour')
        `).get();
        
        // Most active users
        const activeUsers = db.prepare(`
            SELECT socket_id, COUNT(*) as location_count, 
                   MIN(timestamp) as first_seen, 
                   MAX(timestamp) as last_seen,
                   MAX(ip_address) as ip_address,
                   MAX(user_agent) as user_agent
            FROM locations
            GROUP BY socket_id
            ORDER BY location_count DESC
            LIMIT 10
        `).all();
        
        // Time range of data
        const timeRange = db.prepare(`
            SELECT MIN(timestamp) as earliest, MAX(timestamp) as latest
            FROM locations
        `).get();

        return {
            totalLocations: totalLocations.count,
            totalUsers: totalUsers.count,
            last24Hours: last24h.count,
            lastHour: lastHour.count,
            activeUsers: activeUsers,
            timeRange: timeRange
        };
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return null;
    }
}

// Clean up old data (optional - for maintenance)
function cleanupOldData(daysToKeep = 30) {
    try {
        const stmt = db.prepare(`
            DELETE FROM locations 
            WHERE timestamp < datetime('now', '-' || ? || ' days')
        `);
        const result = stmt.run(daysToKeep);
        console.log(`Cleaned up ${result.changes} old location records`);
        return result.changes;
    } catch (error) {
        console.error('Error cleaning up old data:', error);
        return 0;
    }
}

// Close database connection
function closeDatabase() {
    db.close();
}

module.exports = {
    saveLocation,
    getLocationHistory,
    getAllLocationHistory,
    getAnalytics,
    cleanupOldData,
    closeDatabase
};

