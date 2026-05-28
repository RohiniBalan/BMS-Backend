# 🔋 Intelligent Battery Management System (BMS) Backend

A production-grade RESTful backend for an **Intelligent Battery Management System (BMS)** designed to manage fleet-wide battery devices, ingest real-time telemetry, evaluate safety rules, monitor battery health, and deliver scalable analytics for modern EV and energy-storage systems.

Built using **Node.js, Express.js, TypeScript, Prisma ORM, and PostgreSQL**, following a clean **Controller → Service → Repository** architecture.

---

# 🚀 Features & Implemented Modules

## 1. Authentication & Security

Secure authentication and authorization system built with scalability and production-readiness in mind.

### Features

* **Email & Password Authentication**
* **OAuth Login**

  * Google Authentication
  * Microsoft Authentication
* **JWT Authentication**

  * Access Token (`15 min`)
  * Refresh Token (`7 days`)
* **Refresh Token Rotation**
* **Role-Based Access Control (RBAC)**

  * `ADMIN`
  * `USER`
* **Password Security**

  * Bcrypt hashing
  * Strong password validation
* **Forgot Password & Reset Password**
* **Rate Limiting**

  * Protects public endpoints from brute-force attacks
* **Audit Logging**

  * Tracks critical actions and system events

### Security Features

* Zod request validation
* JWT verification middleware
* Route protection middleware
* Role-based authorization
* Request rate limiting
* Audit trail for sensitive actions

---

## 2. Device Management & Telemetry

Manage fleet-wide battery devices and process high-frequency telemetry streams.

### Device Management

* Create, update, retrieve, and delete devices
* Device status management
* Device map API with geolocation
* Pagination and filtering support

### Telemetry Features

* Real-time telemetry ingestion
* Bulk telemetry ingestion (**up to 1000 records/request**)
* Historical telemetry queries
* Latest telemetry retrieval
* Fleet-wide latest telemetry aggregation
* Thermal summary generation

### Performance Optimizations

* Database-level aggregation using **Prisma + PostgreSQL**
* Optimized `latest-per-device` queries
* Indexed telemetry retrieval
* Downsampling using PostgreSQL `date_trunc`
* Chart-friendly API responses
* Bulk ingestion payload support (**5MB limit**)

---

## 3. Real-Time Alert Engine

A rule-based alert engine that continuously evaluates telemetry and battery safety thresholds.

### Alert Types

* High Temperature (OTP)
* Low Battery
* Cell Imbalance
* Connection Lost

### Safety Logic

* **OTP (Over Temperature Protection)**

  * Configurable using `ThermalSafetyConfig`
* **UTP (Under Temperature Protection)**

  * Config-aware future-safe implementation
* **Cell Imbalance Detection**

  * Voltage deviation analysis
* **Connection Lost Detection**

  * Triggered if telemetry stops for > 5 minutes
* **Low Battery Detection**

  * Triggered when SOC < 20%

### Features

* Duplicate unresolved alert prevention
* Alert resolution workflow
* Alert severity handling
* Real-time auto-check endpoint

---

## 4. Dashboard & Analytics

Fleet-wide battery intelligence and visualization-ready analytics.

### Dashboard Features

* Average SOC
* Online devices count
* Total battery capacity
* Alert summary
* Critical & warning alert counts

### Analytics

* SOC Trend Analysis
* Temperature Trend Analysis
* Fleet Summary
* SOC Distribution Buckets

Supported time ranges:

* `24h`
* `7d`
* `30d`

### Optimizations

* PostgreSQL aggregation using `date_trunc`
* Database-level trend computation
* Minimal memory footprint
* Frontend chart-ready responses

---

## 5. Reports System

Reporting APIs for analytics and operational insights.

### Features

* Daily reports
* CSV export support
* Streaming report downloads
* Device filtering
* Date-range filtering

---

## 6. Battery Packs & Matrix System

Advanced cell-level battery pack visualization and monitoring.

### Battery Pack Features

* Pack creation and management
* Configurable pack dimensions

  * `totalRows`
  * `totalColumns`
* Cell telemetry ingestion
* Sparse matrix support

### Matrix APIs

#### Battery Matrix

Provides real-time battery state matrix for frontend visualization.

Example:

```json
{
  "packId": "pack-001",
  "rows": 4,
  "cols": 4,
  "batteryMatrix": []
}
```

#### Thermal Matrix

Provides cell-level thermal heatmap data.

Example:

```json
{
  "packId": "pack-001",
  "rows": 4,
  "cols": 4,
  "thermalMatrix": []
}
```

### Performance Design

* Avoids N+1 database queries
* Batched latest-cell telemetry fetching
* Optimized joins using PostgreSQL
* Sparse matrix handling for missing cells

---

# 🏗️ Backend Architecture

The backend follows a scalable layered architecture:

```txt
Controller → Service → Repository → Prisma ORM → PostgreSQL
```

### Responsibilities

#### Controllers

* Handle request/response
* Call services
* Return standardized API responses

#### Services

* Business logic
* Rules and validations
* Application orchestration

#### Repositories

* Database interaction
* Prisma query management

#### Middleware

* Authentication
* RBAC
* Rate limiting
* Audit logging
* Validation
* Error handling

---

# 🛠️ Tech Stack

| Technology         | Purpose             |
| ------------------ | ------------------- |
| Node.js            | Runtime Environment |
| Express.js         | REST API Framework  |
| TypeScript         | Static Type Safety  |
| Prisma ORM         | Database ORM        |
| PostgreSQL         | Relational Database |
| Zod                | Request Validation  |
| JWT                | Authentication      |
| Bcrypt             | Password Hashing    |
| Express Rate Limit | API Security        |
| Helmet             | HTTP Security       |
| CORS               | Cross-Origin Access |
| Morgan             | API Logging         |

---

# ⚙️ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/GADDAMAJAYKUMAR/bms_backend.git
cd bms_backend
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/battery_management"

PORT=5000

JWT_SECRET="your_secret"
JWT_REFRESH_SECRET="your_refresh_secret"

JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL="http://localhost:3000"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL=""

MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
MICROSOFT_CALLBACK_URL=""
```

## 4. Database Setup

```bash
npx prisma generate
npx prisma migrate deploy
```

## 5. Run Development Server

```bash
npm run dev
```

Server URL:

```txt
http://localhost:5000/api/v1
```

## 6. Production Build

```bash
npm run build
npm start
```

Compiled output is generated into:

```txt
dist/
```

No compiled files pollute the `src/` directory.

---

# 📌 API Highlights

### Authentication

* Register
* Login
* Refresh Token
* Logout
* Forgot Password
* Reset Password
* OAuth (Google & Microsoft)

### Devices

* CRUD operations
* Device status management
* Device mapping

### Telemetry

* Single ingest
* Bulk ingest
* Latest telemetry
* Historical telemetry
* Thermal summaries

### Alerts

* Auto-check
* Alert resolution
* Alert summaries

### Analytics

* Dashboard summary
* SOC trends
* Temperature trends
* Fleet analytics

### Reports

* Daily reports
* CSV export

### Battery Packs

* Pack creation
* Battery matrix
* Thermal matrix

---

# 👨‍💻 Author

**Ajay Kumar**
GitHub: https://github.com/GADDAMAJAYKUMAR
