# 🚀 Complete Guide: cPanel + GitHub Actions CI/CD Deployment

This document provides a step-by-step guide to deploying your **FocusTrack Enterprise Application** (Frontend + Node.js Backend + PostgreSQL/MySQL) on **cPanel** using **GitHub Actions CI/CD Pipeline**.

---

## 📋 Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              GitHub Repository               │
                      │               (Push to main)                 │
                      └──────────────────────┬───────────────────────┘
                                             │
                                  GitHub Actions Runner
                                             │
                   ┌─────────────────────────┴────────────────────────┐
                   │                                                  │
         1. Build Frontend (Vite)                           2. Build Backend (TSC)
                   │                                                  │
                   └─────────────────────────┬────────────────────────┘
                                             │
                                      SCP Delivery (SSH)
                                             │
                       ┌─────────────────────▼──────────────────────┐
                       │               cPanel Server                │
                       │                                            │
                       │   Frontend ──> public_html/ (Static)       │
                       │   Backend  ──> ~/nodeapp/ (Node.js App)    │
                       └────────────────────────────────────────────┘
```

---

## 🔑 Phase 1: cPanel Server Setup

### 1. Enable SSH Access in cPanel
1. Log into your cPanel control panel.
2. Search for **SSH Access** under the **Security** section.
3. Generate an SSH Key Pair or import your existing public SSH key.
4. Note your SSH Connection details:
   - **Host / IP**: `yourdomain.com` or server IP address
   - **Username**: Your cPanel username (e.g., `mycpaneluser`)
   - **Port**: `22` (or custom cPanel SSH port like `2222`)

---

### 2. Choose Your Database (PostgreSQL or MySQL)
Both **PostgreSQL** and **MySQL** are fully supported out-of-the-box!

- **For PostgreSQL** (Default):
  - `DATABASE_URL`: `postgresql://db_user:db_pass@localhost:5432/db_name`
  - Build command: `npm run prisma:generate`

- **For MySQL** (cPanel Default):
  - `DATABASE_URL`: `mysql://cpanel_user:cpanel_password@localhost:3306/cpanel_dbname`
  - Build command: `npm run prisma:generate:mysql`

---

### 3. Configure Backend Node.js Application in cPanel
1. In cPanel, search for **Setup Node.js App** (under Software section).
2. Click **Create Application**:
   - **Node.js Version**: Select `20.x` or latest LTS.
   - **Application Mode**: `Production`
   - **Application Root**: `nodeapp` (or your preferred directory name)
   - **Application URL**: `api.yourdomain.com` (or subdirectory `/api`)
   - **Application Startup File**: `dist/server.js`
3. Click **Create**.
4. In the Environment Variables section of Node.js App, add your production environment variables:
   - `PORT`: `5000` (or cPanel assigned PORT)
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `mysql://cpanel_user:cpanel_password@localhost:3306/cpanel_dbname`
   - `JWT_SECRET`: `your_secure_random_jwt_secret`
   - `JWT_REFRESH_SECRET`: `your_secure_random_refresh_secret`
   - `APP_FRONTEND_URL`: `https://yourdomain.com`
   - `APP_BACKEND_URL`: `https://api.yourdomain.com`
   - `SMTP_HOST`: `smtp.yourdomain.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `noreply@yourdomain.com`
   - `SMTP_PASS`: `your_smtp_password`

---

### 3. Frontend `.htaccess` Configuration (Single Page Application Routing)
Ensure that URL routing works for React Router when users refresh pages.
Create or update `public_html/.htaccess` on your cPanel server:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🔒 Phase 2: Configure GitHub Secrets

Go to your GitHub Repository:
`Settings` ➔ `Secrets and variables` ➔ `Actions` ➔ `New repository secret`

Add the following **Secrets**:

| Secret Name | Description / Example Value |
|---|---|
| `CPANEL_SERVER_IP` | `192.168.1.1` or `yourdomain.com` |
| `CPANEL_SSH_USER` | Your cPanel SSH username (e.g. `acmeadmin`) |
| `CPANEL_SSH_PRIVATE_KEY` | Contents of your private SSH key (`-----BEGIN OPENSSH PRIVATE KEY-----...`) |
| `CPANEL_SSH_PORT` | `22` (or your custom cPanel SSH port) |
| `PROD_API_BASE_URL` | `https://api.yourdomain.com/api/v1` |

---

## 🚀 Phase 3: Automated Deployment Workflow

The deployment workflow file is already created at:
[`.github/workflows/deploy-cpanel.yml`](file:///d:/Projects/taskTracky/.github/workflows/deploy-cpanel.yml)

### How It Works:
1. **Push to `main` branch** triggers the pipeline automatically.
2. **Build Stage**:
   - Compiles React frontend static assets into `frontend/dist/`.
   - Compiles TypeScript backend code into `backend/dist/`.
   - Generates Prisma Database Client.
3. **Deploy Stage**:
   - Securely transfers build artifacts to cPanel via SSH (`scp`).
   - Copies frontend assets to `public_html/`.
   - Copies backend code to `~/nodeapp/` and runs production `npm install`.
   - Executes database schema updates (`npx prisma db push`).
   - Restarts Node.js App automatically (`tmp/restart.txt` or `pm2 restart`).

---

## ✅ Phase 4: Verification Checklist

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Configure CI/CD deployment pipeline for cPanel"
   git push origin main
   ```
2. Navigate to your GitHub Repository **Actions** tab to watch the automated build and deployment process.
3. Once completed, visit your live site (`https://yourdomain.com`).
