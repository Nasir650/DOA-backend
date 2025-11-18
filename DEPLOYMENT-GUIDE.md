# DOA Backend Deployment Guide for Hostinger VPS

## 📋 Prerequisites

Before deploying to your Hostinger VPS, ensure you have:

1. **VPS Access**: SSH access to your Hostinger VPS
2. **Domain**: A domain name pointed to your VPS IP
3. **Basic Requirements**: Ubuntu 20.04+ or similar Linux distribution

## 🚀 Quick Deployment

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### Step 2: Upload Your Code

Option A - Using Git (Recommended):
```bash
git clone https://github.com/your-username/DOA-main.git
cd DOA-main/server
```

Option B - Using SCP:
```bash
# From your local machine
scp -r ./DOA-main/server root@your-vps-ip:/var/www/
```

### Step 3: Run Deployment Script

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

## 🔧 Manual Deployment Steps

If you prefer manual setup:

### 1. System Updates

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 18.x

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install MongoDB

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4. Install PM2

```bash
sudo npm install -g pm2
```

### 5. Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/doa-backend
sudo chown -R $USER:$USER /var/www/doa-backend

# Copy files
cp -r . /var/www/doa-backend/
cd /var/www/doa-backend

# Install dependencies
npm install --production

# Setup environment
cp .env.production .env
```

### 6. Configure Environment Variables

Edit `/var/www/doa-backend/.env`:

```bash
nano .env
```

**Important Variables to Update:**
```env
MONGODB_URI=mongodb://localhost:27017/doa-voting-prod
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
CLIENT_URL=https://yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password-change-this
```

### 7. Setup MongoDB Database

```bash
mongosh
```

```javascript
use doa-voting-prod;
db.createUser({
  user: 'doauser',
  pwd: 'secure-password-change-this',
  roles: [{ role: 'readWrite', db: 'doa-voting-prod' }]
});
exit
```

### 8. Start Application with PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 9. Install and Configure Nginx

```bash
sudo apt install -y nginx
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/doa-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/doa-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10. Setup SSL Certificate

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 11. Configure Firewall

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 🔍 API Endpoints Testing

After deployment, test your API endpoints:

### Health Check
```bash
curl https://yourdomain.com/api/health
```

### Authentication Endpoints
```bash
# Register a new user
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "acceptTerms": true
  }'

# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### User Management
```bash
# Get leaderboard (public)
curl https://yourdomain.com/api/users/leaderboard

# Get user profile (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://yourdomain.com/api/auth/me
```

## 📊 Monitoring and Maintenance

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs doa-backend

# Restart application
pm2 restart doa-backend

# Monitor resources
pm2 monit
```

### MongoDB Commands
```bash
# Connect to MongoDB
mongosh

# Check database
use doa-voting-prod;
show collections;
db.users.countDocuments();
```

### Nginx Commands
```bash
# Check status
sudo systemctl status nginx

# Reload configuration
sudo nginx -s reload

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Security Checklist

- [ ] Change default JWT secret
- [ ] Update admin credentials
- [ ] Configure strong MongoDB passwords
- [ ] Enable firewall (UFW)
- [ ] Setup SSL certificate
- [ ] Regular security updates
- [ ] Monitor application logs
- [ ] Backup database regularly

## 🐛 Troubleshooting

### Common Issues

1. **Port 5000 already in use**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 PID
   ```

2. **MongoDB connection failed**
   ```bash
   sudo systemctl status mongod
   sudo systemctl restart mongod
   ```

3. **Nginx configuration error**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **PM2 application not starting**
   ```bash
   pm2 logs doa-backend
   pm2 restart doa-backend
   ```

### Log Locations
- Application logs: `/var/www/doa-backend/logs/`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `/var/log/mongodb/`
- PM2 logs: `~/.pm2/logs/`

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify all environment variables
3. Ensure all services are running
4. Check firewall settings
5. Verify domain DNS settings

## 🔄 Updates and Maintenance

### Updating the Application
```bash
cd /var/www/doa-backend
git pull origin main  # if using git
npm install --production
pm2 restart doa-backend
```

### Database Backup
```bash
mongodump --db doa-voting-prod --out /backup/$(date +%Y%m%d)
```

### Regular Maintenance
- Update system packages monthly
- Monitor disk space and memory usage
- Review application logs weekly
- Update SSL certificates (auto-renewal with certbot)
- Backup database regularly
