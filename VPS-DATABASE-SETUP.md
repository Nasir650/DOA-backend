# DOA VPS Database Setup Guide

## 🗄️ MongoDB Database Setup for Hostinger VPS

This guide will help you set up a secure MongoDB database on your Hostinger VPS for the DOA backend.

## 🚀 Quick Setup (Automated)

### Step 1: Upload Database Setup Script

The database setup script is already included in your repository. After cloning your code:

```bash
# On your VPS
git clone https://github.com/Nasir650/DOA-backend.git
cd DOA-backend/server
```

### Step 2: Run Database Setup

```bash
# Make script executable
chmod +x setup-database.sh

# Run database setup (requires sudo)
sudo ./setup-database.sh
```

This script will:
- ✅ Install MongoDB 6.0
- ✅ Configure security settings
- ✅ Create database and users
- ✅ Set up indexes for performance
- ✅ Configure automatic backups
- ✅ Set up monitoring scripts

## 📋 Database Configuration Details

### Database Information
- **Database Name**: `doa-voting-prod`
- **Host**: `localhost` (127.0.0.1)
- **Port**: `27017`
- **Application User**: `doauser`
- **Application Password**: `DOASecurePass123!`

### Admin Access
- **Admin User**: `admin`
- **Admin Password**: `SecureAdminPass123!`

### Connection String
```
mongodb://doauser:DOASecurePass123!@localhost:27017/doa-voting-prod
```

## 🔧 Manual Setup (Alternative)

If you prefer manual setup:

### 1. Install MongoDB

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update packages and install
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 2. Start MongoDB Service

```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Create Database Users

```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "SecureAdminPass123!",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]
})

# Create application database and user
use doa-voting-prod
db.createUser({
  user: "doauser",
  pwd: "DOASecurePass123!",
  roles: [
    { role: "readWrite", db: "doa-voting-prod" }
  ]
})
```

### 4. Enable Authentication

Edit MongoDB config:
```bash
sudo nano /etc/mongod.conf
```

Add security section:
```yaml
security:
  authorization: enabled
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

## 🏗️ Database Collections

Your DOA application will create these collections:

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String, // "user" or "admin"
  points: Number,
  votingRights: Number,
  isActive: Boolean,
  stats: {
    totalVotes: Number,
    totalContributions: Number,
    contributionAmount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Contributions Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId, // Reference to users
  coin: ObjectId, // Reference to coins
  amount: Number,
  currency: String,
  walletAddress: String,
  transactionHash: String,
  receipt: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  },
  status: String, // "pending", "approved", "rejected"
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Coins Collection
```javascript
{
  _id: ObjectId,
  name: String,
  symbol: String (unique),
  isActive: Boolean,
  walletInfo: {
    address: String,
    network: String
  },
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Votes Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  voteType: String,
  decision: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Features

### Authentication & Authorization
- ✅ **User authentication** enabled
- ✅ **Role-based access** control
- ✅ **Secure passwords** with bcrypt hashing
- ✅ **JWT token** authentication

### Network Security
- ✅ **Local binding** only (127.0.0.1)
- ✅ **Firewall rules** configured
- ✅ **No external access** to database

### Data Protection
- ✅ **Input validation** with Mongoose schemas
- ✅ **Unique constraints** on critical fields
- ✅ **Indexes** for performance and integrity

## 💾 Backup & Recovery

### Automatic Backups
The setup script configures daily backups at 2 AM:

```bash
# Backup location
/var/backups/mongodb/

# Backup retention: 7 days
# Backup format: compressed tar.gz files
```

### Manual Backup
```bash
# Create backup
sudo /usr/local/bin/mongodb-backup.sh

# Restore from backup
mongorestore --db doa-voting-prod /var/backups/mongodb/YYYYMMDD_HHMMSS/doa-voting-prod/
```

## 📊 Monitoring & Maintenance

### Health Check
```bash
# Run health check
sudo /usr/local/bin/mongodb-monitor.sh
```

### View Database Stats
```bash
# Connect to database
mongosh mongodb://doauser:DOASecurePass123!@localhost:27017/doa-voting-prod

# Check collections
show collections

# Count documents
db.users.countDocuments()
db.contributions.countDocuments()
```

### View Logs
```bash
# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Backup logs
sudo tail -f /var/log/mongodb-backup.log
```

## 🔧 Troubleshooting

### MongoDB Won't Start
```bash
# Check status
sudo systemctl status mongod

# Check logs
sudo journalctl -u mongod

# Check disk space
df -h /var/lib/mongodb
```

### Connection Issues
```bash
# Test connection
mongosh --host localhost --port 27017

# Check if port is open
sudo netstat -tlnp | grep 27017

# Check firewall
sudo ufw status
```

### Performance Issues
```bash
# Check slow queries
mongosh --eval "db.setProfilingLevel(2, {slowms: 100})"

# View profiling data
mongosh --eval "db.system.profile.find().limit(5).sort({ts:-1}).pretty()"
```

## ⚙️ Environment Configuration

Update your `.env` file with VPS database settings:

```env
# Copy from .env.vps
MONGODB_URI=mongodb://doauser:DOASecurePass123!@localhost:27017/doa-voting-prod
```

## 🚀 Next Steps

1. **Run database setup script**: `sudo ./setup-database.sh`
2. **Update .env file** with database connection string
3. **Test connection** with your application
4. **Deploy your backend** with `sudo ./deploy.sh`
5. **Verify database** is working with API calls

## 📞 Support Commands

```bash
# Service management
sudo systemctl start mongod
sudo systemctl stop mongod
sudo systemctl restart mongod
sudo systemctl status mongod

# Database management
mongosh mongodb://admin:SecureAdminPass123!@localhost:27017/admin
mongosh mongodb://doauser:DOASecurePass123!@localhost:27017/doa-voting-prod

# Backup management
sudo /usr/local/bin/mongodb-backup.sh
ls -la /var/backups/mongodb/

# Health monitoring
sudo /usr/local/bin/mongodb-monitor.sh
```

Your VPS database is now ready for production use! 🎉
