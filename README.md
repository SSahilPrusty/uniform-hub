# UNIFORM HUB

> **"Your School. Your Uniform. One Hub."**  
> India's premier multi-vendor school uniform e-commerce marketplace connecting students, parents, schools, authorized franchises, and master tailors.

---

## 🏫 About Uniform Hub

**Uniform Hub** is a full-stack, enterprise-grade e-commerce application built completely from scratch. It solves the chaos of Indian school uniform shopping by allowing parents to discover their child's specific institution, select school-approved uniforms with exact Pantone shade accuracy, specify bespoke measurements for tailoring alterations, and order with pan-India doorstep delivery.

### Official Portals Included:
1. **Public Storefront & School Finder** (`/`, `/schools`, `/products`)
2. **Customer Portal** (`/customer/dashboard`)
3. **School Administration Portal** (`/school/dashboard`)
4. **Franchise Retailer Portal** (`/franchise/dashboard`)
5. **Tailor Alterations Portal** (`/tailor/dashboard`)
6. **Operations Admin Panel** (`/admin/dashboard`)
7. **Super Admin Security & Media Studio** (`/super-admin/dashboard`, `/super-admin/product-images`)

---

## 🛠 Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM, Axios
- **Backend:** Node.js, Express.js, TypeScript, Zod request validation, Centralized error handling
- **Database:** Prisma ORM, PostgreSQL (via Docker Compose / production connection) and SQLite (for instant local zero-dependency development `file:./dev.db`)
- **Authentication:** Bcrypt password hashing, JWT Bearer tokens, Role-Based Access Control (RBAC)
- **Image Storage:** Development file storage adapter (`apps/api/uploads`) with database metadata references
- **Testing:** Vitest, Supertest integration testing

---

## 🚀 Quick Start (Local Setup)

### Prerequisites:
- Node.js >= 18 (Tested on Node.js v24)
- npm >= 9

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Build the Shared Workspace Package
```bash
npm run build --workspace=@uniform-hub/shared
```

### Step 3: Initialize Database & Run Migrations
```bash
# Generate the Prisma Client
npx prisma generate

# Push database schema
npx prisma db push
```

### Step 4: Seed Database with Indian Schools & Demo Accounts
```bash
npx tsx prisma/seed.ts
```

This populates:
- 5 Famous Indian Schools (DPS RK Puram, St. Xavier's Mumbai, Kendriya Vidyalaya Hebbal, DAV Bhubaneswar, Ryan International Gurugram)
- 16 Uniform Categories (Shirts, Trousers, Skirts, Blazers, Track Suits, Canvas Shoes, School Bags)
- Products with variants, sizes, colors, MRP, prices in ₹, and stock counts
- 6 Demo accounts with pre-configured roles

### Step 5: Start Backend API Server
```bash
npm run dev:api
```
The API server will start at `http://localhost:5000` (Uploads served at `/uploads`).

### Step 6: Start Frontend Client (in a separate terminal)
```bash
npm run dev:web
```
Open `http://localhost:5173` in your browser.

---

## 🔑 Demo Accounts & Credentials

For fast review, you can log in at `/login` or use the 1-click switcher inside any dashboard:

| Role | Email | Password | Primary Portal Route |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@uniformhub.in` | `SuperAdmin@123` | `/super-admin/dashboard` & `/super-admin/product-images` |
| **Operations Admin** | `admin@uniformhub.in` | `Admin@123` | `/admin/dashboard` |
| **School Admin (DPS)**| `dps.principal@uniformhub.in`| `School@123` | `/school/dashboard` |
| **Franchise Retailer**| `franchise.delhi@uniformhub.in`| `Franchise@123` | `/franchise/dashboard` |
| **Master Tailor** | `master.tailor@uniformhub.in` | `Tailor@123` | `/tailor/dashboard` |
| **Customer / Parent**| `parent.rahul@uniformhub.in` | `Customer@123` | `/customer/dashboard` |

---

## 📸 Mandatory Product Image Management Studio

The Super Admin has absolute, database-backed control over product photography at:
`/super-admin/product-images`

### Features:
1. **Upload Images:** Supports PNG, JPG, JPEG, WEBP with mime-type validation and 5MB size limits.
2. **Preview & Inspect:** Real-time visual cards displaying thumbnails, alternative text, and sort index.
3. **Product & School Reassignment:** Link or re-assign any image directly to a product or a school's specific uniform catalog.
4. **Primary Image Designation:** Designate which image acts as the primary thumbnail across search results and catalog cards.
5. **Alternative Text (Alt Text):** Edit SEO and accessibility descriptions.
6. **Sort Order Reordering:** Set display order in product gallery.
7. **Deletion:** Permanently removes the physical image file from storage and cleans up database relations.

---

## 💳 Payment Simulation & Sandboxing

Uniform Hub includes an isolated payment abstraction:
- **Test Mode Gateway:** In local development, placing an order initiates a test payment intent. Customers can simulate payment confirmation or decline.
- **Transactional Stock Reservation:** Stock is decremented inside a database transaction (`prisma.$transaction`) upon order placement, preventing overselling.
- **Production Integration:** To connect live Razorpay or Stripe, supply `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`.

---

## 🐳 PostgreSQL with Docker (Optional)

If you have Docker installed and prefer running PostgreSQL:
```bash
docker compose up -d
```
Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/uniform_hub?schema=public"
```
Then copy `prisma/schema.postgresql.prisma` over `prisma/schema.prisma` and run `npx prisma db push`.

---

## 🧪 Running Automated Tests

Run backend unit and integration test suite:
```bash
npm run test --workspace=@uniform-hub/api
```

---

## 📄 License & Attribution

Designed and engineered for school uniform excellence in India.  
Copyright © 2026 UNIFORM HUB. All rights reserved.
