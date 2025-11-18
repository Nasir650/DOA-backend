#!/bin/bash

# DOA Database Setup Script for VPS
# This script sets up MongoDB on your Hostinger VPS

echo "🗄️  Setting up MongoDB Database on VPS..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install MongoDB 6.0
echo "🍃 Installing MongoDB 6.0..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
echo "🚀 Starting MongoDB service..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Check if MongoDB is running
if sudo systemctl is-active --quiet mongod; then
    echo "✅ MongoDB is running successfully!"
else
    echo "❌ MongoDB failed to start. Checking logs..."
    sudo journalctl -u mongod --no-pager -l
    exit 1
fi

# Configure MongoDB for production
echo "⚙️  Configuring MongoDB for production..."

# Create MongoDB configuration backup
sudo cp /etc/mongod.conf /etc/mongod.conf.backup

# Update MongoDB configuration
sudo tee /etc/mongod.conf > /dev/null <<EOF
# mongod.conf - DOA Production Configuration

# Where to store data
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# Where to write logging data
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1

# Process management
processManagement:
  timeZoneInfo: /usr/share/zoneinfo

# Security
security:
  authorization: enabled

# Operation profiling
operationProfiling:
  slowOpThresholdMs: 100

# Replication (optional for single server)
#replication:
#  replSetName: "rs0"
EOF

# Restart MongoDB with new configuration
echo "🔄 Restarting MongoDB with new configuration..."
sudo systemctl restart mongod

# Wait for MongoDB to start
sleep 5

# Create admin user
echo "👤 Creating MongoDB admin user..."
mongosh --eval "
db = db.getSiblingDB('admin');
db.createUser({
  user: 'admin',
  pwd: 'SecureAdminPass123!',
  roles: [
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' },
    { role: 'dbAdminAnyDatabase', db: 'admin' }
  ]
});
print('✅ Admin user created successfully');
"

# Create DOA database and user
echo "🏗️  Creating DOA database and user..."
mongosh --eval "
db = db.getSiblingDB('doa-voting-prod');
db.createUser({
  user: 'doauser',
  pwd: 'DOASecurePass123!',
  roles: [
    { role: 'readWrite', db: 'doa-voting-prod' }
  ]
});

// Create initial collections with indexes
db.createCollection('users');
db.createCollection('contributions');
db.createCollection('coins');
db.createCollection('votes');

// Create indexes for better performance
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'points': -1 });
db.users.createIndex({ 'createdAt': -1 });
db.users.createIndex({ 'role': 1 });

db.contributions.createIndex({ 'user': 1 });
db.contributions.createIndex({ 'status': 1 });
db.contributions.createIndex({ 'createdAt': -1 });

db.coins.createIndex({ 'symbol': 1 }, { unique: true });

db.votes.createIndex({ 'user': 1 });
db.votes.createIndex({ 'createdAt': -1 });

print('✅ DOA database and collections created successfully');
"

# Set up MongoDB log rotation
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/mongodb > /dev/null <<EOF
/var/log/mongodb/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 mongodb mongodb
    postrotate
        /bin/kill -SIGUSR1 \$(cat /var/lib/mongodb/mongod.lock 2>/dev/null) 2>/dev/null || true
    endscript
}
EOF

# Create backup directory
echo "💾 Setting up backup directory..."
sudo mkdir -p /var/backups/mongodb
sudo chown mongodb:mongodb /var/backups/mongodb

# Create backup script
sudo tee /usr/local/bin/mongodb-backup.sh > /dev/null <<'EOF'
#!/bin/bash
# MongoDB Backup Script for DOA

BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="doa-voting-prod"

echo "Starting MongoDB backup at $(date)"

# Create backup
mongodump --db $DB_NAME --out $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/doa_backup_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "doa_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: doa_backup_$DATE.tar.gz"
EOF

sudo chmod +x /usr/local/bin/mongodb-backup.sh

# Set up daily backup cron job
echo "⏰ Setting up daily backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/mongodb-backup.sh >> /var/log/mongodb-backup.log 2>&1") | crontab -

# Configure firewall for MongoDB (only local access)
echo "🔥 Configuring firewall..."
sudo ufw allow from 127.0.0.1 to any port 27017

# Create MongoDB monitoring script
sudo tee /usr/local/bin/mongodb-monitor.sh > /dev/null <<'EOF'
#!/bin/bash
# MongoDB Health Check Script

echo "=== MongoDB Health Check ==="
echo "Date: $(date)"
echo ""

# Check if MongoDB is running
if sudo systemctl is-active --quiet mongod; then
    echo "✅ MongoDB Service: Running"
else
    echo "❌ MongoDB Service: Not Running"
    sudo systemctl status mongod
    exit 1
fi

# Check MongoDB connection
if mongosh --quiet --eval "db.runCommand('ping')" >/dev/null 2>&1; then
    echo "✅ MongoDB Connection: OK"
else
    echo "❌ MongoDB Connection: Failed"
    exit 1
fi

# Check database stats
echo ""
echo "📊 Database Statistics:"
mongosh --quiet --eval "
db = db.getSiblingDB('doa-voting-prod');
print('Users: ' + db.users.countDocuments());
print('Contributions: ' + db.contributions.countDocuments());
print('Coins: ' + db.coins.countDocuments());
print('Votes: ' + db.votes.countDocuments());
"

# Check disk usage
echo ""
echo "💾 Disk Usage:"
df -h /var/lib/mongodb

echo ""
echo "✅ MongoDB health check completed successfully"
EOF

sudo chmod +x /usr/local/bin/mongodb-monitor.sh

# Display connection information
echo ""
echo "🎉 MongoDB Database Setup Complete!"
echo "=================================="
echo ""
echo "📋 Database Information:"
echo "  Database Name: doa-voting-prod"
echo "  Host: localhost"
echo "  Port: 27017"
echo "  Username: doauser"
echo "  Password: DOASecurePass123!"
echo ""
echo "🔗 Connection String:"
echo "  mongodb://doauser:DOASecurePass123!@localhost:27017/doa-voting-prod"
echo ""
echo "👤 Admin User:"
echo "  Username: admin"
echo "  Password: SecureAdminPass123!"
echo ""
echo "📁 Important Paths:"
echo "  Data Directory: /var/lib/mongodb"
echo "  Log File: /var/log/mongodb/mongod.log"
echo "  Config File: /etc/mongod.conf"
echo "  Backup Directory: /var/backups/mongodb"
echo ""
echo "🛠️  Useful Commands:"
echo "  Check Status: sudo systemctl status mongod"
echo "  View Logs: sudo tail -f /var/log/mongodb/mongod.log"
echo "  Connect: mongosh mongodb://doauser:DOASecurePass123!@localhost:27017/doa-voting-prod"
echo "  Health Check: sudo /usr/local/bin/mongodb-monitor.sh"
echo "  Manual Backup: sudo /usr/local/bin/mongodb-backup.sh"
echo ""
echo "⚠️  IMPORTANT: Update your .env file with the connection string above!"
echo ""
