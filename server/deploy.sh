#!/bin/bash

# DOA Backend Deployment Script for Hostinger VPS
# Make sure to run this script with sudo privileges

echo "🚀 Starting DOA Backend Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install MongoDB (if not already installed)
if ! command -v mongod &> /dev/null; then
    echo "🍃 Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

# Install PM2 globally (if not already installed)
if ! command -v pm2 &> /dev/null; then
    echo "⚡ Installing PM2..."
    sudo npm install -g pm2
fi

# Install Nginx (if not already installed)
if ! command -v nginx &> /dev/null; then
    echo "🌐 Installing Nginx..."
    sudo apt install -y nginx
fi

# Create application directory
APP_DIR="/var/www/doa-backend"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copy application files
echo "📁 Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create logs directory
mkdir -p logs

# Setup environment file
if [ ! -f .env ]; then
    echo "⚙️ Setting up environment file..."
    cp .env.production .env
    echo "⚠️  Please edit .env file with your production values!"
fi

# Setup MongoDB database
echo "🍃 Setting up MongoDB database..."
chmod +x setup-database.sh
sudo ./setup-database.sh

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Setup Nginx reverse proxy
echo "🌐 Setting up Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/doa-backend > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/doa-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup firewall
echo "🔥 Setting up firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Setup SSL with Let's Encrypt (optional)
echo "🔒 Setting up SSL certificate..."
sudo apt install -y certbot python3-certbot-nginx
echo "Run: sudo certbot --nginx -d your-domain.com -d www.your-domain.com"

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit /var/www/doa-backend/.env with your production values"
echo "2. Update Nginx config with your actual domain name"
echo "3. Run SSL certificate setup: sudo certbot --nginx -d your-domain.com"
echo "4. Check application status: pm2 status"
echo "5. View logs: pm2 logs doa-backend"
echo ""
echo "🌐 Your API will be available at: http://your-domain.com/api/"
