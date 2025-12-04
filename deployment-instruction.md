# ZooTube Deployment Instructions

This guide covers deploying ZooTube MVP to a self-hosted server.

## System Requirements

### Minimum Server Specifications
- **OS**: Ubuntu 20.04 LTS or later / Debian 11+ / CentOS 8+
- **CPU**: 2 cores
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB free space
- **Network**: Static IP address or domain name

### Software Requirements
- **Node.js**: v18.17.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **Git**: For cloning the repository
- **Process Manager**: PM2 (recommended) or systemd
- **Reverse Proxy**: Nginx or Apache (recommended for production)

## Pre-Deployment Checklist

Before deployment, ensure you have:
- [ ] Server access with sudo privileges
- [ ] Domain name configured (optional but recommended)
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] Supabase project URL
- [ ] Supabase anon key
- [ ] Supabase service role key
- [ ] YouTube Data API v3 key

## Step 1: Server Setup

### 1.1 Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js

Using NodeSource repository (Ubuntu/Debian):

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

### 1.3 Install PM2 Process Manager

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 1.4 Install Git

```bash
sudo apt install git -y
```

## Step 2: Clone and Setup Application

### 2.1 Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/zootube
sudo chown -R $USER:$USER /var/www/zootube
cd /var/www/zootube
```

### 2.2 Clone Repository

```bash
# Clone your repository
git clone <your-git-repo-url> .

# Or if uploading files directly, skip git clone
```

### 2.3 Install Dependencies

```bash
npm install --production=false
```

**Note**: Use `--production=false` to install all dependencies including devDependencies needed for build.

## Step 3: Configure Environment Variables

### 3.1 Create Production Environment File

```bash
nano .env.local
```

### 3.2 Add Environment Variables

```env
# Node Environment
NODE_ENV=production

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# YouTube Data API v3
YOUTUBE_API_KEY=<your-youtube-api-key>

# Next.js Production Settings
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Important**: Replace all placeholder values with actual credentials provided separately.

### 3.3 Secure Environment File

```bash
chmod 600 .env.local
```

## Step 4: Build Application

### 4.1 Run Production Build

```bash
npm run build
```

This command will:
- Compile TypeScript code
- Optimize React components
- Generate static pages
- Create production bundles
- Generate PWA service worker and manifest

**Expected output**: Build should complete successfully with no errors. You'll see output similar to:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    XXX kB        XXX kB
└ ○ /admin                               XXX kB        XXX kB
...
```

### 4.2 Test Build Locally (Optional)

```bash
npm run start
```

Access `http://localhost:3000` to verify the build works correctly. Press `Ctrl+C` to stop.

## Step 5: Deploy with PM2

### 5.1 Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [{
    name: 'zootube',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/zootube',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/zootube/logs/err.log',
    out_file: '/var/www/zootube/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

### 5.2 Create Log Directory

```bash
mkdir -p /var/www/zootube/logs
```

### 5.3 Start Application with PM2

```bash
pm2 start ecosystem.config.js
```

### 5.4 Verify Application is Running

```bash
pm2 status
pm2 logs zootube --lines 50
```

### 5.5 Configure PM2 Startup Script

```bash
# Generate startup script
pm2 startup

# Execute the command provided by PM2 (will be shown in output)
# Save the current process list
pm2 save
```

This ensures ZooTube automatically restarts after server reboot.

## Step 6: Configure Nginx Reverse Proxy (Recommended)

### 6.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 6.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/zootube
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (update paths after obtaining certificates)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy Settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # PWA Service Worker
    location /sw.js {
        proxy_pass http://localhost:3000/sw.js;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000/_next/static;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Logs
    access_log /var/log/nginx/zootube_access.log;
    error_log /var/log/nginx/zootube_error.log;
}
```

### 6.3 Enable Site Configuration

```bash
sudo ln -s /etc/nginx/sites-available/zootube /etc/nginx/sites-enabled/
```

### 6.4 Test Nginx Configuration

```bash
sudo nginx -t
```

### 6.5 Obtain SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts to complete certificate installation
```

### 6.6 Reload Nginx

```bash
sudo systemctl reload nginx
```

## Step 7: Configure Firewall

```bash
# Allow SSH (if not already allowed)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 8: Update Supabase Settings

### 8.1 Update Redirect URLs

In your Supabase dashboard:
1. Go to **Authentication** > **URL Configuration**
2. Update **Site URL** to `https://yourdomain.com`
3. Add redirect URLs:
   - `https://yourdomain.com/admin`
   - `https://yourdomain.com/admin/login`

## Post-Deployment Verification

### Test Application

1. Visit `https://yourdomain.com`
2. Verify homepage loads correctly
3. Test admin signup/login at `https://yourdomain.com/admin`
4. Add a test video and verify it appears
5. Test video playback
6. Check PWA installation (should see install prompt in browser)

### Monitor Application

```bash
# View real-time logs
pm2 logs zootube

# Check application status
pm2 status

# Check resource usage
pm2 monit

# View Nginx logs
sudo tail -f /var/log/nginx/zootube_access.log
sudo tail -f /var/log/nginx/zootube_error.log
```

## Maintenance Commands

### Update Application

```bash
cd /var/www/zootube

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild application
npm run build

# Restart with PM2
pm2 restart zootube
```

### PM2 Management

```bash
# Restart application
pm2 restart zootube

# Stop application
pm2 stop zootube

# Start application
pm2 start zootube

# Delete from PM2
pm2 delete zootube

# View detailed info
pm2 info zootube

# Flush logs
pm2 flush zootube
```

### Backup Database

Since you're using Supabase, backups are handled by Supabase. However, you can:
1. Use Supabase dashboard to create manual backups
2. Set up automated backups in Supabase settings

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs zootube --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Verify environment variables
cat .env.local
```

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### High Memory Usage

```bash
# Check memory usage
free -h
pm2 monit

# Adjust PM2 memory limit in ecosystem.config.js
# Change max_memory_restart value
```

### 502 Bad Gateway (Nginx)

```bash
# Check if application is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/zootube_error.log

# Verify proxy_pass URL in Nginx config
```

### SSL Certificate Issues

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Force certificate renewal
sudo certbot renew --force-renewal
```

## Performance Optimization

### Enable Nginx Caching

Add to Nginx configuration inside `http` block:

```nginx
# /etc/nginx/nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=zootube_cache:10m max_size=1g inactive=60m use_temp_path=off;
```

### Enable Gzip Compression

Already enabled in default Nginx, but verify in `/etc/nginx/nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

## Security Checklist

- [ ] `.env.local` file has restricted permissions (600)
- [ ] Firewall is enabled and configured
- [ ] SSL certificate is installed and valid
- [ ] Security headers are configured in Nginx
- [ ] Supabase RLS (Row Level Security) policies are enabled
- [ ] API keys are never committed to Git
- [ ] Regular system updates are scheduled
- [ ] PM2 logs are rotated to prevent disk space issues

## Support

For issues related to:
- **Supabase**: Check Supabase dashboard logs and status
- **YouTube API**: Verify API key quotas in Google Cloud Console
- **Application**: Check PM2 logs and Nginx error logs

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Domain**: _____________
**Server IP**: _____________
