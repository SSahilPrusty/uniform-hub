# UNIFORM HUB - Cloud Hosting & Deployment Guide

This document outlines the cloud deployment configurations for **UNIFORM HUB**, enabling both instant public access and permanent cloud hosting on modern platforms.

---

## 1. Instant Live Public URLs (Active Now)

The application is currently tunneled to the cloud with full SSL HTTPS:

- **Primary Direct Live Cloud Link**:  
  👉 **`https://3ed42e591355ad.lhr.life`**  
  *(Direct access with no passwords or interstitial prompts)*

- **Secondary Live Cloud Link**:  
  👉 **`https://dark-weeks-stick.loca.lt`**  
  *(If prompted for tunnel password/IP, enter: `106.219.132.12`)*

- **Backend Health Check**:  
  👉 `https://3ed42e591355ad.lhr.life/api/health`

---

## 2. Permanent Cloud Deployment Options

The repository includes pre-configured deployment manifests:

### Option A: Render.com (1-Click Blueprint) - Recommended
A pre-configured [`render.yaml`](../render.yaml) blueprint is included in the root directory.

1. Go to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New** → **Blueprint**.
3. Connect your GitHub repository:  
   `https://github.com/SSahilPrusty/uniform-hub`
4. Render will automatically detect `render.yaml` and provision:
   - **`uniformhub-postgres`**: Managed PostgreSQL database.
   - **`uniform-hub-api`**: Node/Express API service with database migrations and seeds.
   - **`uniform-hub-web`**: React + Vite static client with SPA routing rewrites.
5. Click **Apply** to deploy.

---

### Option B: Vercel (Frontend & Serverless)
A pre-configured [`vercel.json`](../vercel.json) is included.

1. Import `https://github.com/SSahilPrusty/uniform-hub` into [Vercel](https://vercel.com/).
2. Set Root Directory to `./`.
3. Framework preset: **Vite**.
4. Set Environment Variable:
   - `VITE_API_URL`: Your deployed backend API URL (e.g. `https://uniform-hub-api.onrender.com/api`).
5. Click **Deploy**.

---

### Option C: Railway.app (Full-Stack Monorepo)
1. Go to [Railway.app](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `SSahilPrusty/uniform-hub`.
4. Add a **PostgreSQL** service plugin.
5. In your project settings, link `DATABASE_URL` from Postgres to the API service.

---

## 3. Demo User Accounts & Roles

Once opened on the live cloud host, you can test all four portals using these pre-seeded accounts:

| Portal | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Operational Admin** | `admin@uniformhub.in` | `Admin@123` | `ADMIN` |
| **Super Admin** | `superadmin@uniformhub.in` | `SuperAdmin@123` | `SUPER_ADMIN` |
| **Tailor Workbench** | `master.tailor@uniformhub.in` | `Tailor@123` | `TAILOR` |
| **Franchise Hub** | `franchise.delhi@uniformhub.in` | `Franchise@123` | `FRANCHISE_ADMIN` |
| **Customer Portal** | `parent.rahul@uniformhub.in` | `Customer@123` | `CUSTOMER` |
