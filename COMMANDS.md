# Complete Command Reference

All commands needed to run, deploy, and manage the Real-Time Location Tracker project.

---

## 📦 Project Setup

### Initial Setup
```bash
# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

### Check Node.js and npm versions
```bash
node -v
npm -v
```

---

## 🚀 Running the Project

### Development Mode (Local)
```bash
# Start the server
npm start

# Or directly with Node.js
node app.js

# Server will run on http://localhost:3000
```

### With Environment Variables
```bash
# Set environment variables and run
$env:PORT=3000; $env:ANALYTICS_PASSWORD="your-password"; npm start

# Or create .env file (not tracked in git)
# PORT=3000
# ANALYTICS_PASSWORD=your-secure-password
# SESSION_SECRET=your-secret-key
# ALLOWED_ORIGINS=http://localhost:3000
```

### Check if Server is Running
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing

# Or open in browser
start http://localhost:3000
```

### Stop the Server
```bash
# Find and stop Node.js process
Get-Process -Name node | Stop-Process -Force

# Or press Ctrl+C in the terminal where server is running
```

---

## 🐳 Docker Commands

### Build Docker Image
```bash
# Build the image
docker build -t realtime-tracker .

# Build with specific tag
docker build -t realtime-tracker:v1.0 .

# Build with no cache (fresh build)
docker build --no-cache -t realtime-tracker .
```

### Run Docker Container
```bash
# Run container (basic)
docker run -p 3000:3000 realtime-tracker

# Run in detached mode (background)
docker run -d -p 3000:3000 --name realtime-tracker realtime-tracker

# Run with database persistence (mount volume)
docker run -d -p 3000:3000 -v ${PWD}/data:/app/data --name realtime-tracker realtime-tracker

# Run with environment variables
docker run -d -p 3000:3000 \
  -e PORT=3000 \
  -e ANALYTICS_PASSWORD=admin123 \
  -v ${PWD}/data:/app/data \
  --name realtime-tracker \
  realtime-tracker

# Run with custom port
docker run -d -p 8080:3000 --name realtime-tracker realtime-tracker
```

### Docker Container Management
```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs realtime-tracker

# Follow logs (live)
docker logs -f realtime-tracker

# Stop container
docker stop realtime-tracker

# Start stopped container
docker start realtime-tracker

# Restart container
docker restart realtime-tracker

# Remove container
docker rm realtime-tracker

# Remove container (force, even if running)
docker rm -f realtime-tracker

# Execute command in running container
docker exec -it realtime-tracker sh

# View container details
docker inspect realtime-tracker

# View container resource usage
docker stats realtime-tracker
```

### Docker Image Management
```bash
# List images
docker images

# Remove image
docker rmi realtime-tracker

# Remove image (force)
docker rmi -f realtime-tracker

# Tag image
docker tag realtime-tracker:latest realtime-tracker:v1.0

# Save image to file
docker save realtime-tracker > realtime-tracker.tar

# Load image from file
docker load < realtime-tracker.tar
```

### Docker Cleanup
```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all unused data
docker system prune

# Remove everything (including volumes)
docker system prune -a --volumes
```

---

## 🔧 Jenkins Commands

### Jenkins Pipeline

**Note:** Jenkins typically runs via web UI, but here are related commands:

### Check Jenkins Status
```bash
# Check if Jenkins is running (if installed locally)
Get-Service -Name Jenkins* -ErrorAction SilentlyContinue

# Or check Jenkins URL
Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing
```

### Jenkins Pipeline Stages (from Jenkinsfile)
1. **Checkout** - Gets code from Git
2. **Install** - Runs `npm ci` or `npm install`
3. **Build tests** - Placeholder for tests
4. **Docker Build** - Builds Docker image

### Manual Jenkins Build (if CLI installed)
```bash
# Trigger build via Jenkins CLI (if installed)
java -jar jenkins-cli.jar -s http://localhost:8080 build RealtimeTracker-CI

# Get build status
java -jar jenkins-cli.jar -s http://localhost:8080 get-build RealtimeTracker-CI 1
```

### Jenkins Environment Variables
Set these in Jenkins job configuration:
- `DOCKER_REGISTRY` (optional) - Docker registry URL
- `DOCKER_CREDENTIALS_ID` (optional) - Credentials for registry

---

## 💾 Database Commands

### SQLite Command Line

#### Open Database
```bash
# Open database
sqlite3 data/locations.db

# Open with read-only mode
sqlite3 -readonly data/locations.db
```

#### Basic Queries
```bash
# Show all tables
.tables

# Show schema for all tables
.schema

# Show schema for specific table
.schema locations
.schema sessions

# Show table structure
PRAGMA table_info(locations);
PRAGMA table_info(sessions);

# Count records
SELECT COUNT(*) FROM locations;
SELECT COUNT(*) FROM sessions;

# View all data (first 10 rows)
SELECT * FROM locations LIMIT 10;
SELECT * FROM sessions LIMIT 10;

# Exit SQLite
.quit
```

#### One-Line Commands
```bash
# Quick stats
sqlite3 data/locations.db "SELECT 'Locations' as Table, COUNT(*) as Count FROM locations UNION ALL SELECT 'Sessions', COUNT(*) FROM sessions;"

# Recent locations
sqlite3 data/locations.db "SELECT * FROM locations ORDER BY timestamp DESC LIMIT 5;"

# Unique users
sqlite3 data/locations.db "SELECT COUNT(DISTINCT socket_id) FROM locations;"

# User statistics
sqlite3 data/locations.db "SELECT socket_id, COUNT(*) as count, MAX(timestamp) as last_seen FROM locations GROUP BY socket_id ORDER BY count DESC LIMIT 10;"
```

#### Database Maintenance
```bash
# Backup database
sqlite3 data/locations.db ".backup 'data/locations_backup.db'"

# Vacuum (optimize database)
sqlite3 data/locations.db "VACUUM;"

# Show database file info
sqlite3 data/locations.db "PRAGMA integrity_check;"

# Show database size
sqlite3 data/locations.db "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();"
```

#### Export Data
```bash
# Export to CSV
sqlite3 data/locations.db <<EOF
.headers on
.mode csv
.output locations_export.csv
SELECT * FROM locations;
.quit
EOF

# Export to JSON
sqlite3 data/locations.db <<EOF
.mode json
.output locations_export.json
SELECT * FROM locations;
.quit
EOF
```

#### Database Reset
```bash
# Delete database (will be recreated on server start)
Remove-Item data\locations.db* -Force

# Or manually
rm data/locations.db*
rm data/locations.db-shm
rm data/locations.db-wal
```

### Database GUI Tools

#### DB Browser for SQLite
```bash
# Download from: https://sqlitebrowser.org/
# Then open: data/locations.db
```

---

## 🔍 Testing & Verification

### Health Check
```bash
# Check server health
Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing

# Or use curl
curl http://localhost:3000/health
```

### Test Endpoints
```bash
# Main page
start http://localhost:3000

# Analytics login
start http://localhost:3000/analytics/login

# Analytics (after login)
start http://localhost:3000/analytics

# Health check
start http://localhost:3000/health
```

### Check Server Logs
```bash
# If running with npm start, logs appear in terminal
# If running with Docker
docker logs realtime-tracker

# Follow logs
docker logs -f realtime-tracker

# Last 50 lines
docker logs --tail 50 realtime-tracker
```

---

## 🔐 Authentication

### Analytics Password
```bash
# Default password: admin123
# Change via environment variable:
$env:ANALYTICS_PASSWORD="your-new-password"; npm start

# Or in Docker:
docker run -e ANALYTICS_PASSWORD=your-password ...
```

### Session Management
```bash
# Login URL
http://localhost:3000/analytics/login

# Logout URL
http://localhost:3000/analytics/logout
```

---

## 📊 Git Commands

### Basic Git Operations
```bash
# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull

# View commit history
git log --oneline

# View changes
git diff
```

### Git Workflow for This Project
```bash
# 1. Make changes
# 2. Check status
git status

# 3. Add changes
git add app.js db.js package.json

# 4. Commit
git commit -m "Description of changes"

# 5. Push (triggers Jenkins build)
git push
```

---

## 🛠️ Development Commands

### Install Dependencies
```bash
# Install all dependencies
npm install

# Install specific package
npm install package-name

# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Audit security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Node.js Process Management
```bash
# Find Node.js processes
Get-Process -Name node

# Stop all Node.js processes
Get-Process -Name node | Stop-Process -Force

# Check port usage
netstat -ano | findstr :3000

# Kill process on port 3000 (Windows)
# Find PID first: netstat -ano | findstr :3000
# Then: taskkill /PID <pid> /F
```

---

## 🌐 Deployment Commands

### Render Deployment
```bash
# Render uses Git integration
# 1. Push to GitHub
git push

# 2. Render automatically deploys
# Configure in Render dashboard:
# - Runtime: Node 18+
# - Build Command: (empty)
# - Start Command: npm start
```

### Railway Deployment
```bash
# Railway uses Git integration
# 1. Push to GitHub
git push

# 2. Railway automatically deploys
# Configure in Railway:
# - Start Command: npm start
```

### Manual Server Deployment
```bash
# 1. Clone repository
git clone https://github.com/Vivaswannn/realtime_copy.git
cd realtime_copy

# 2. Install dependencies
npm install

# 3. Set environment variables
export PORT=3000
export ANALYTICS_PASSWORD=your-password

# 4. Start server
npm start

# Or use PM2 for production
npm install -g pm2
pm2 start app.js --name realtime-tracker
pm2 save
pm2 startup
```

---

## 📝 Environment Variables

### Available Environment Variables
```bash
# Server port (default: 3000)
PORT=3000

# Analytics password (default: admin123)
ANALYTICS_PASSWORD=your-secure-password

# Session secret (for encryption)
SESSION_SECRET=your-secret-key-change-this

# CORS allowed origins (comma-separated, default: *)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Set Environment Variables

**Windows PowerShell:**
```powershell
$env:PORT=3000
$env:ANALYTICS_PASSWORD="admin123"
npm start
```

**Windows CMD:**
```cmd
set PORT=3000
set ANALYTICS_PASSWORD=admin123
npm start
```

**Linux/Mac:**
```bash
export PORT=3000
export ANALYTICS_PASSWORD=admin123
npm start
```

**Docker:**
```bash
docker run -e PORT=3000 -e ANALYTICS_PASSWORD=admin123 ...
```

---

## 🔄 Common Workflows

### Complete Development Workflow
```bash
# 1. Start development server
npm start

# 2. Make code changes
# (edit files)

# 3. Test changes
# (open browser, test functionality)

# 4. Commit and push
git add .
git commit -m "Description"
git push

# 5. Jenkins automatically builds
# (check Jenkins dashboard)
```

### Docker Development Workflow
```bash
# 1. Build image
docker build -t realtime-tracker .

# 2. Run container
docker run -d -p 3000:3000 -v ${PWD}/data:/app/data --name realtime-tracker realtime-tracker

# 3. View logs
docker logs -f realtime-tracker

# 4. Stop container
docker stop realtime-tracker

# 5. Remove container
docker rm realtime-tracker
```

### Database Management Workflow
```bash
# 1. Check database
sqlite3 data/locations.db "SELECT COUNT(*) FROM locations;"

# 2. Backup database
sqlite3 data/locations.db ".backup 'data/locations_backup.db'"

# 3. View recent data
sqlite3 data/locations.db "SELECT * FROM locations ORDER BY timestamp DESC LIMIT 10;"

# 4. Export data
sqlite3 data/locations.db ".mode csv" ".output export.csv" "SELECT * FROM locations;"
```

---

## 🐛 Troubleshooting Commands

### Check Server Status
```bash
# Check if server is running
Get-Process -Name node

# Check port 3000
netstat -ano | findstr :3000

# Test server response
Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing
```

### Check Database
```bash
# Verify database exists
Test-Path data\locations.db

# Check database integrity
sqlite3 data/locations.db "PRAGMA integrity_check;"

# View database size
Get-Item data\locations.db | Select-Object Length
```

### Check Dependencies
```bash
# Verify all dependencies installed
npm list --depth=0

# Check for missing dependencies
npm install

# Clear npm cache
npm cache clean --force
```

### Docker Troubleshooting
```bash
# Check Docker is running
docker ps

# View container logs
docker logs realtime-tracker

# Check container status
docker inspect realtime-tracker

# Restart container
docker restart realtime-tracker
```

---

## 📋 Quick Reference

### Most Used Commands
```bash
# Start server
npm start

# Build Docker image
docker build -t realtime-tracker .

# Run Docker container
docker run -d -p 3000:3000 --name realtime-tracker realtime-tracker

# View database
sqlite3 data/locations.db

# Check server health
curl http://localhost:3000/health

# View Docker logs
docker logs -f realtime-tracker

# Stop server
Get-Process -Name node | Stop-Process -Force

# Stop Docker container
docker stop realtime-tracker
```

---

## 🎯 Project-Specific Commands

### Access Application
```bash
# Main tracker
start http://localhost:3000

# Analytics login
start http://localhost:3000/analytics/login
# Password: admin123

# Analytics dashboard
start http://localhost:3000/analytics

# Health check API
start http://localhost:3000/health
```

### Generate Test Data
```bash
# 1. Start server
npm start

# 2. Open http://localhost:3000 in multiple browser tabs
# 3. Enable location in each tab
# 4. Wait for location updates
# 5. Check analytics dashboard
```

### View Analytics Data
```bash
# Via web interface
start http://localhost:3000/analytics

# Via database
sqlite3 data/locations.db "SELECT socket_id, COUNT(*) as count FROM locations GROUP BY socket_id ORDER BY count DESC;"
```

---

## 📚 Additional Resources

- **Project README**: See README.md for project overview
- **Screenshot Guide**: See SCREENSHOT_GUIDE.md for documentation screenshots
- **Database Guide**: See check_database.md for database operations
- **Jenkinsfile**: See Jenkinsfile for CI/CD pipeline configuration

---

## ⚠️ Important Notes

1. **Database Location**: `data/locations.db` (created automatically)
2. **Default Port**: 3000 (change via PORT environment variable)
3. **Default Analytics Password**: admin123 (change via ANALYTICS_PASSWORD)
4. **Docker Volume**: Mount `data/` directory for database persistence
5. **Git**: Don't commit `data/` directory (in .gitignore)

---

## 🆘 Emergency Commands

### Reset Everything
```bash
# Stop server
Get-Process -Name node | Stop-Process -Force

# Stop Docker
docker stop realtime-tracker
docker rm realtime-tracker

# Delete database
Remove-Item data\locations.db* -Force

# Clean npm
npm cache clean --force
rm -rf node_modules
npm install

# Restart fresh
npm start
```

### Quick Health Check
```bash
# All-in-one check
Write-Host "Server: "; try { Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing | Select-Object StatusCode } catch { Write-Host "Not running" }; Write-Host "Database: "; if (Test-Path "data\locations.db") { Write-Host "Exists" } else { Write-Host "Missing" }; Write-Host "Docker: "; docker ps --filter "name=realtime-tracker" --format "{{.Status}}"
```

