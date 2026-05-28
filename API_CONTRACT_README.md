# 🔋 Intelligent BMS API Contract

## Overview

The **Intelligent Battery Management System (BMS) Backend** provides a secure, scalable, and production-ready REST API for managing battery fleets, ingesting real-time telemetry, monitoring battery health, evaluating safety rules, and generating analytics.

Built using **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**, the system follows a strict layered architecture:

```txt
Controller → Service → Repository → Prisma ORM → PostgreSQL
```

The API is designed around multiple bounded domains:

1. **Authentication & Security**
2. **Device Fleet Management**
3. **Telemetry & Historical Analytics**
4. **Real-Time Alert Engine**
5. **Dashboard & Reporting**
6. **Battery Packs & Matrix Visualization**

---

# 🔐 Authentication & Security

The platform provides secure authentication, authorization, validation, and auditability.

## Security Features

* JWT Authentication

  * Access Token (`15 minutes`)
  * Refresh Token (`7 days`)
* Refresh Token Rotation
* Google OAuth
* Microsoft OAuth
* Role-Based Access Control (RBAC)
* Rate Limiting
* Audit Logging
* Password Hashing using Bcrypt
* Strict Request Validation using Zod

---

## Authentication Rules

All protected routes require a JWT access token.

### Authorization Header

```http
Authorization: Bearer <jwt-access-token>
```

### Role-Based Access Control (RBAC)

Endpoints are protected using middleware-based authorization:

```ts
authorize("ADMIN")
authorize("ADMIN", "USER")
```

### Request Validation

All mutation endpoints (`POST`, `PUT`, `PATCH`) use strict **Zod schema validation**.

Validation failures return:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "email",
      "message": "Invalid email address"
    }
  ]
}
```

---

# 📌 API Domains & Endpoints

## 1. Authentication APIs

Handles registration, login, OAuth, password recovery, and token lifecycle management.

| Method | Endpoint                          | Description                                  | Auth Required |
| ------ | --------------------------------- | -------------------------------------------- | ------------- |
| POST   | `/api/v1/auth/register`           | Register a new user                          | ❌             |
| POST   | `/api/v1/auth/login`              | Login using email/password                   | ❌             |
| POST   | `/api/v1/auth/refresh`            | Generate new access token from refresh token | ❌             |
| POST   | `/api/v1/auth/logout`             | Logout and invalidate refresh token          | ✅             |
| POST   | `/api/v1/auth/forgot-password`    | Initiate password reset                      | ❌             |
| POST   | `/api/v1/auth/reset-password`     | Reset password using token                   | ❌             |
| GET    | `/api/v1/auth/google`             | Google OAuth login                           | ❌             |
| GET    | `/api/v1/auth/google/callback`    | Google OAuth callback                        | ❌             |
| GET    | `/api/v1/auth/microsoft`          | Microsoft OAuth login                        | ❌             |
| GET    | `/api/v1/auth/microsoft/callback` | Microsoft OAuth callback                     | ❌             |

### Register Payload

```json
{
  "name": "Ajay Kumar",
  "email": "ajay@gmail.com",
  "phoneNumber": "9701207493",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "agreeToTerms": true
}
```

---

## 2. Device Fleet APIs

Fleet-wide provisioning and lifecycle management for battery devices.

| Method | Endpoint                     | Description                | Role  |
| ------ | ---------------------------- | -------------------------- | ----- |
| GET    | `/api/v1/devices`            | Paginated device listing   | USER  |
| GET    | `/api/v1/devices/:id`        | Get device details         | USER  |
| POST   | `/api/v1/devices`            | Create device              | ADMIN |
| PUT    | `/api/v1/devices/:id`        | Update device              | ADMIN |
| PATCH  | `/api/v1/devices/:id/status` | Update operational status  | ADMIN |
| DELETE | `/api/v1/devices/:id`        | Delete device              | ADMIN |
| GET    | `/api/v1/devices/map`        | Geolocation + SOC map data | USER  |

---

## 3. Telemetry APIs

Real-time telemetry ingestion and historical analytics.

### Supported Features

* Single telemetry ingestion
* Bulk ingestion (**max 1000 records/request**)
* Historical trend queries
* Latest telemetry retrieval
* Thermal summaries
* DB-level aggregation

| Method | Endpoint                              | Description                      | Role  |
| ------ | ------------------------------------- | -------------------------------- | ----- |
| POST   | `/api/v1/telemetry`                   | Single telemetry ingest          | ADMIN |
| POST   | `/api/v1/telemetry/bulk`              | Bulk ingest (≤1000 records)      | ADMIN |
| GET    | `/api/v1/telemetry/:deviceId/latest`  | Latest telemetry                 | USER  |
| GET    | `/api/v1/telemetry/:deviceId/history` | Historical telemetry             | USER  |
| GET    | `/api/v1/telemetry/all/latest`        | Latest telemetry for all devices | USER  |
| GET    | `/api/v1/telemetry/thermal/summary`   | Fleet thermal summary            | USER  |

### Example Historical Query

```http
GET /api/v1/telemetry/:deviceId/history?hours=24&interval=1h
```

---

## 4. Alert Engine APIs

Rule-based safety alert evaluation using live telemetry.

### Supported Rules

* Over Temperature Protection (OTP)
* Under Temperature Protection (UTP) *(future-safe implementation)*
* Cell Imbalance Detection
* Low Battery Detection
* Connection Lost Detection

| Method | Endpoint                     | Description              | Role  |
| ------ | ---------------------------- | ------------------------ | ----- |
| GET    | `/api/v1/alerts`             | Paginated alert history  | USER  |
| GET    | `/api/v1/alerts/recent`      | Latest alerts            | USER  |
| GET    | `/api/v1/alerts/summary`     | Alert counts by severity | USER  |
| POST   | `/api/v1/alerts`             | Create alert             | ADMIN |
| PATCH  | `/api/v1/alerts/:id/resolve` | Resolve alert            | ADMIN |
| DELETE | `/api/v1/alerts/:id`         | Delete alert             | ADMIN |
| POST   | `/api/v1/alerts/auto-check`  | Trigger alert engine     | ADMIN |

---

## 5. Dashboard & Analytics APIs

Fleet-level battery intelligence and time-series analytics.

### Dashboard APIs

| Method | Endpoint                             | Description             | Role |
| ------ | ------------------------------------ | ----------------------- | ---- |
| GET    | `/api/v1/dashboard/summary`          | Fleet summary metrics   | USER |
| GET    | `/api/v1/dashboard/soc-distribution` | SOC bucket distribution | USER |

### Analytics APIs

| Method | Endpoint                              | Description             | Role |
| ------ | ------------------------------------- | ----------------------- | ---- |
| GET    | `/api/v1/analytics/soc-trend`         | SOC trends              | USER |
| GET    | `/api/v1/analytics/temperature-trend` | Temperature trends      | USER |
| GET    | `/api/v1/analytics/fleet-summary`     | Fleet analytics summary | USER |

Supported ranges:

```txt
24h
7d
30d
```

---

## 6. Reports APIs

Generate operational reports and exports.

| Method | Endpoint                 | Description       | Role |
| ------ | ------------------------ | ----------------- | ---- |
| GET    | `/api/v1/reports/daily`  | Daily report data | USER |
| GET    | `/api/v1/reports/export` | Stream CSV export | USER |

---

## 7. Battery Pack & Matrix APIs

Cell-level topology and visualization endpoints.

### Features

* Battery pack creation
* Cell telemetry ingestion
* Battery matrix visualization
* Thermal matrix visualization
* Sparse matrix support

| Method | Endpoint                               | Description            | Role  |
| ------ | -------------------------------------- | ---------------------- | ----- |
| POST   | `/api/v1/packs`                        | Create battery pack    | ADMIN |
| GET    | `/api/v1/packs`                        | Paginated pack listing | USER  |
| GET    | `/api/v1/packs/:packId`                | Get pack details       | USER  |
| POST   | `/api/v1/packs/:packId/cells`          | Cell telemetry ingest  | ADMIN |
| GET    | `/api/v1/packs/:packId/battery-matrix` | Voltage matrix         | USER  |
| GET    | `/api/v1/packs/:packId/thermal-matrix` | Thermal matrix         | USER  |

---

# 📦 Standard Response Format

## Success Response

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

> `meta` exists only for paginated endpoints.

## Error Response

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "password",
      "message": "Password must contain uppercase letter"
    }
  ]
}
```

---

# ⚡ Performance Optimizations

* PostgreSQL `date_trunc` aggregation
* DB-level telemetry downsampling
* Latest-per-device optimized queries
* Indexed telemetry retrieval
* Bulk ingestion (1000 records/request)
* 5MB request payload support
* N+1 query prevention
* Sparse matrix generation
* Prisma query optimization

---

# 🔒 Middleware Stack

* Authentication Middleware
* RBAC Middleware
* Zod Validation Middleware
* Audit Logging Middleware
* Rate Limiting Middleware
* Global Error Handler

---

## API Base URL

```txt
http://localhost:5000/api/v1
```
