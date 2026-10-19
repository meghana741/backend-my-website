# 🌿 EcoCycle E-Waste Management - Backend API (Node.js & Microsoft SQL Server)

A robust, enterprise-ready RESTful backend application built with **Node.js**, **Express**, and **Microsoft SQL Server** (`mssql`) for the **EcoCycle E-Waste Management System**.

---

## 🚀 Key Features Implemented

1. **Authentication & Roles (JWT + Bcrypt)**
   - Registration and Login with encrypted passwords (`bcryptjs`).
   - Role-Based Access Control: `user`, `admin`, `agent`, `recycler`.
   - User profile management and JWT token verification.

2. **E-Waste Pickup Requests**
   - E-waste registration with item name, category, quantity, condition, weight, pickup address, and preferred time slot.
   - Unique tracking numbers (e.g. `EW-2026-XXXX`).
   - Complete lifecycle status tracking:
     `Pending` ➔ `Approved` ➔ `Pickup Scheduled` ➔ `Collected` ➔ `Sent for Recycling` ➔ `Recycling Completed`.

3. **User Dashboard APIs**
   - Personal statistics: total requests, pending, approved, scheduled, completed collections, and total weight contributed.
   - Real-time environmental impact counters (CO₂ emissions prevented, equivalent trees saved).
   - Recent requests and unread notification counts.

4. **Public & Real-Time Tracking**
   - Look up any request by tracking number without needing login.
   - Complete chronological timeline of actions with timestamps, statuses, and updates.

5. **Admin Operations & Dispatch**
   - Review and approve/reject pickup requests.
   - Schedule pickups and assign certified collection agents (`Rahul Sharma`, `Priya Patel`).
   - User and role management.

6. **Recycling Management & Segregation**
   - Classification into **Reusable** (refurbish/donate), **Recyclable** (metals/plastics extraction), and **Hazardous** (safe neutralization).
   - Certified recycling centers directory (`EcoMetals Recovery Ltd`, `GreenTech Circuit Solutions`, `HazSafe Plant`).
   - Material recovery rate tracking and hazardous waste neutralization notes.

7. **Notification System**
   - Automated alerts on status changes (approved, scheduled, collected, recycling complete).
   - Unread badge counters, mark as read, and bulk mark all read.

8. **Reports & Analytics Dashboard**
   - Total waste collected (kg and count).
   - Monthly volume trends for charts.
   - Category distribution (percentages and weights).
   - Environmental equivalencies (CO₂ saved, trees preserved, kWh energy saved).

9. **Home Page & Public APIs**
   - Accepted electronic categories catalog.
   - Verified platform-wide environmental statistics.
   - Interactive Eco Impact Calculator.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (v24.x)
- **Framework**: Express.js (v4.x)
- **Database**: Microsoft SQL Server 2022 (Developer Edition / Express / Enterprise)
- **Driver**: `mssql` + `msnodesqlv8` (supports seamless Windows Integrated Authentication and SQL Server Authentication)
- **Security**: `jsonwebtoken` (JWT), `bcryptjs`, `cors`
- **Logging**: `morgan`

---

## 🗄️ Database Setup

The database schema and sample data are located in `src/database/`:
- `src/database/schema.sql` — Creates tables (`Users`, `Categories`, `PickupRequests`, `RequestTrackingHistory`, `RecyclingBatches`, `Notifications`, `RecyclingCenters`) with indices and constraints.
- `src/database/seed.sql` — Populates realistic demo categories, users, pickup requests in various stages, recycling batches, and notifications.

### Running Schema & Seed Scripts:
```powershell
# Recreate tables
npm run db:init

# Populate seed data
npm run db:seed
```

---

## ⚙️ Configuration (`.env`)

```env
PORT=5000
NODE_ENV=development

# SQL Server Configuration
# Leave DB_USER and DB_PASSWORD blank to use Windows Integrated Authentication:
DB_SERVER=localhost
DB_NAME=mywebsite
DB_USER=
DB_PASSWORD=
DB_PORT=1433
DB_TRUST_SERVER_CERTIFICATE=true

# JWT Settings
JWT_SECRET=ecocycle_super_secret_jwt_key_2026_secure
JWT_EXPIRES_IN=7d

# Frontend CORS
FRONTEND_URL=http://localhost:5173
```

---

## 🏃 Running the Application

### 1. Install Dependencies:
```powershell
npm install
```

### 2. Start Development Server (with hot reload):
```powershell
npm run dev
```

### 3. Start Production Server:
```powershell
npm start
```

### 4. Run Automated Integration Tests:
```powershell
npm test
```

---

## 🔑 Demo Accounts (Pre-Seeded)

All demo accounts use password: **`password123`**

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Admin Director | `admin@ecocycle.com` | `password123` |
| **Agent** | Rahul Sharma | `rahul.agent@ecocycle.com` | `password123` |
| **Agent** | Priya Patel | `priya.agent@ecocycle.com` | `password123` |
| **Recycler**| EcoMetals Facility | `facility@ecometals.com` | `password123` |
| **User** | Meghana K | `meghana@example.com` | `password123` |
| **User** | John Doe | `john.doe@example.com` | `password123` |

---

## 📡 API Reference Overview

### 1. Public Endpoints
- `GET /api/health` — SQL Server connection health check
- `GET /api/public/categories` — List all accepted e-waste categories
- `GET /api/public/stats` — Platform impact counters (CO₂ prevented, pickups completed)
- `POST /api/public/calculate-impact` — Calculate eco savings based on weight/category
- `GET /api/requests/track/:trackingNumber` — Public tracking timeline by tracking number (e.g. `EW-2026-1001`)

### 2. Authentication
- `POST /api/auth/register` — Register a new user (`name`, `email`, `phone`, `password`)
- `POST /api/auth/login` — Login with `email` and `password`, returns JWT
- `GET /api/auth/me` — Get current user profile (requires `Bearer <token>`)
- `PUT /api/auth/profile` — Update profile details

### 3. Pickup Requests
- `POST /api/requests` — Submit e-waste pickup request
- `GET /api/requests/my-requests` — Get current user's pickup requests
- `GET /api/requests` — View all requests (Admin/Agent)
- `GET /api/requests/:id` — Request details and tracking timeline
- `PUT /api/requests/:id/status` — Update status (`Approved`, `Collected`, `Sent for Recycling`, etc.)
- `PUT /api/requests/:id/schedule` — Schedule pickup date and assign agent (Admin)
- `DELETE /api/requests/:id` — Cancel pending pickup request

### 4. Recycling Management
- `GET /api/recycling` — List recycling batches (filterable by `itemType`: Reusable, Recyclable, Hazardous)
- `GET /api/recycling/:id` — Batch details
- `POST /api/recycling` — Create new batch / segregation entry
- `PUT /api/recycling/:id` — Update recycling status, recovery rate, or notes
- `GET /api/recycling/centers` — List certified recycling facilities

### 5. Notifications
- `GET /api/notifications` — List notifications with unread count
- `PUT /api/notifications/:id/read` — Mark single notification as read
- `PUT /api/notifications/read-all` — Mark all notifications as read
- `DELETE /api/notifications/:id` — Delete notification

### 6. Reports & Analytics
- `GET /api/reports/summary` — High-level recycling & eco summary
- `GET /api/reports/monthly` — Monthly volume trends
- `GET /api/reports/categories` — Category breakdown
- `GET /api/reports/user-dashboard` — Personalized metrics for user dashboard

### 7. User Management (Admin)
- `GET /api/users` — List users with filters and search
- `GET /api/users/agents` — List collection agents for assignment dropdowns
- `PUT /api/users/:id/role` — Change user role
- `DELETE /api/users/:id` — Delete user account

---

## 🔗 Connecting with React Frontend

In your React frontend (`c:\Users\megha\my-website`):

1. Set the base API URL in your React app (e.g. `.env` or `api/client.js`):
   ```javascript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

2. Pass JWT token in `Authorization` header for protected endpoints:
   ```javascript
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${localStorage.getItem('token')}`
   }
   ```
