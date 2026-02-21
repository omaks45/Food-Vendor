<div align="center">

#  Authentication & Authorization System


---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [API Endpoints](#-api-endpoints)
  - [Customer Authentication](#1-customer-authentication)
  - [Admin Authentication](#2-admin-authentication)
  - [Protected Endpoints](#3-protected-endpoints-require-authentication)
- [Authentication Flow](#-authentication-flow)
- [Security Features](#-security-features)
- [Testing Guide](#-testing-guide)
- [Error Codes](#-error-codes)

---

##  Overview

A **production-ready**, **scalable**, and **secure** authentication system built with **NestJS** for the Chuks Kitchen food ordering platform. This system provides comprehensive user management, role-based access control, and advanced security features.

### Key Highlights

| Feature | Status | Description |
|---------|--------|-------------|
|  **Authentication** |  Complete | Email/Password with JWT tokens |
|  **Email Verification** |  Complete | 6-digit OTP with rate limiting |
|  **Password Reset** |  Complete | Secure OTP-based flow |
|  **Referral System** |  Complete | User-to-User & Promotional codes |
|  **Admin Panel** |  Complete | Role-based access control |
|  **Security** |  Production-Ready | bcrypt, Redis, rate limiting |
|  **Mobile Ready** |  Complete | RESTful API, token refresh |
|  **Analytics** |  Ready | Referral tracking, activity logs |

---

## ✨ Features

<details open>
<summary><b> Core Authentication</b></summary>
<br>

-  User registration with comprehensive validation
-  Email verification via 6-digit OTP (10-minute expiry)
-  Secure login with email & password
-  JWT access tokens (15 minutes expiry)
-  JWT refresh tokens (7 days expiry, Redis-stored)
-  Password reset flow with OTP
-  Token refresh mechanism
-  Logout with token invalidation
-  Automatic cleanup of unverified accounts (24h)

</details>

<details open>
<summary><b> Security Features</b></summary>
<br>

-  Password hashing with **bcrypt** (12 rounds)
-  Refresh token storage in **Redis** (hashed)
-  OTP rate limiting (3 OTP/hour, 2-minute cooldown)
-  Strong password validation (uppercase, lowercase, number, special char)
-  Email verification required before login
-  CORS protection with whitelist
-  Helmet security headers
-  Request rate limiting
-  SQL injection prevention (Prisma ORM)

</details>

<details open>
<summary><b> Referral System</b></summary>
<br>

-  User-to-user referral codes (auto-generated, 12 characters)
-  Promotional referral codes (admin-created)
-  Referral tracking & analytics
-  Expiration date support
-  Usage limits for promotional codes
-  Discount configuration (percentage or fixed amount)

</details>

<details open>
<summary><b> Admin Features</b></summary>
<br>

-  Admin registration with secret key protection
-  Admin-specific login endpoint
-  Role-based authorization guards
-  Admin activity logging (ready for implementation)
-  Separate admin dashboard access

</details>

<details>
<summary><b> Additional Features</b></summary>
<br>

-  Phone number support (optional)
- Profile management (update name, phone)
-  Password change (authenticated)
-  OAuth ready (Google, Facebook - prepared schema)
-  Multiple address support
-  Last login tracking

</details>

---

## 🛠 Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | NestJS | ^10.0.0 | Backend framework |
| **Language** | TypeScript | ^5.1.0 | Type-safe development |
| **Database** | MongoDB Atlas | Latest | NoSQL database |
| **ORM** | Prisma | 6.19.2 | Database toolkit |
| **Cache** | Redis Cloud | Latest | Session management |
| **Authentication** | JWT | ^10.0.0 | Token-based auth |
| **Validation** | class-validator | ^0.14.0 | DTO validation |
| **Security** | bcrypt | ^5.1.0 | Password hashing |
| **Email** | Nodemailer | ^6.9.0 | Email service |
| **Documentation** | Swagger | ^7.0.0 | API docs |
| **File Upload** | Cloudinary | ^1.41.0 | Image storage |

---

## Architecture

```
┌─────────────────┐
│   Client App    │
│  (Web/Mobile)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         NestJS API Gateway              │
│  ┌───────────────────────────────────┐  │
│  │   Auth Module                     │  │
│  │   ├── Controllers                 │  │
│  │   ├── Services                    │  │
│  │   ├── Guards (JWT, Admin)         │  │
│  │   └── DTOs                        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Notifications Module            │  │
│  │   ├── Email Service               │  │
│  │   └── OTP Service                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │                 │
         ▼                 ▼
┌─────────────┐   ┌──────────────┐
│  MongoDB    │   │    Redis     │
│  (Atlas)    │   │   (Cloud)    │
│   Users     │   │  Sessions    │
│   OTPs      │   │   Tokens     │
└─────────────┘   └──────────────┘
```

---

##  Database Schema

<details>
<summary><b>Click to view complete database schema</b></summary>

### User Model
```prisma
model User {
  id                String      @id @default(auto()) @map("_id") @db.ObjectId
  email             String      @unique
  phoneNumber       String?     @unique
  password          String?
  firstName         String
  lastName          String
  role              UserRole    @default(CUSTOMER)
  isEmailVerified   Boolean     @default(false)
  isPhoneVerified   Boolean     @default(false)
  authProvider      AuthProvider @default(TRADITIONAL)
  googleId          String?     @unique
  facebookId        String?     @unique
  profileImage      String?
  
  // Referral system
  referralCode      String      @unique
  referredBy        String?     @db.ObjectId
  referrer          User?       @relation("Referrals", fields: [referredBy], references: [id])
  referrals         User[]      @relation("Referrals")
  
  // Timestamps
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  lastLogin         DateTime?
  
  // Relations
  addresses         Address[]
  orders            Order[]
  cart              Cart?
  otpCodes          OTPCode[]
}

enum UserRole {
  CUSTOMER
  ADMIN
}

enum AuthProvider {
  TRADITIONAL
  GOOGLE
  FACEBOOK
}
```

### OTP Model
```prisma
model OTPCode {
  id           String      @id @default(auto()) @map("_id") @db.ObjectId
  userId       String      @db.ObjectId
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  code         String
  purpose      OTPPurpose
  expiresAt    DateTime
  isUsed       Boolean     @default(false)
  createdAt    DateTime    @default(now())
}

enum OTPPurpose {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  PHONE_VERIFICATION
}
```

### Referral Code Model
```prisma
model ReferralCode {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  code            String      @unique
  userId          String?     @db.ObjectId
  
  discountType    DiscountType
  discountValue   Float
  
  maxUses         Int?
  currentUses     Int         @default(0)
  
  isActive        Boolean     @default(true)
  expiresAt       DateTime?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

</details>

---

##  Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Redis Cloud account (or local Redis)
- Gmail account (for SMTP) or SendGrid

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/chuks-kitchen-api.git
cd chuks-kitchen-api
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Configuration](#-environment-configuration) section).

### Step 4: Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to MongoDB
npx prisma db push
```

### Step 5: Start the Server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:5000`

**Swagger Documentation**: `http://localhost:5000/api`

---

##  Environment Configuration

<details>
<summary><b>Click to view complete environment variables</b></summary>

```env
# ============================================================================
# SERVER CONFIGURATION
# ============================================================================
NODE_ENV=development
PORT=5000

# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# ============================================================================
# JWT CONFIGURATION
# ============================================================================
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET="your-super-secret-refresh-key-different-from-jwt"
JWT_REFRESH_EXPIRATION=7d

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_URL=redis://default:password@host:port

# ============================================================================
# EMAIL SERVICE (Gmail SMTP)
# ============================================================================
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-no-spaces
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME="Chuks Kitchen"

# ============================================================================
# CLOUDINARY (Image Storage)
# ============================================================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=chuks-kitchen

# ============================================================================
# FRONTEND CONFIGURATION
# ============================================================================

ALLOWED_ORIGINS=http://localhost:5000,http://localhost:5001

# ============================================================================
# ADMIN CONFIGURATION
# ============================================================================
ADMIN_SECRET=your-secure-admin-secret-key-2026
```

###  Gmail SMTP Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**: 
   - Google Account → Security → App Passwords
3. **Copy the 16-character password** (remove all spaces!)
4. **Add to `.env`** as `EMAIL_PASSWORD`

>  **Important**: Remove ALL spaces from the Gmail app password!
> 
>  Wrong: `"ztkq rxae ozxk bxkz"`  
>  Correct: `ztkqrxaeozxkbxkz`

</details>

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### 1. Customer Authentication

<details>
<summary><b>POST /auth/register</b> - Register new customer</summary>

#### Request Body
```json
{
  "email": "john.doe@example.com",
  "phoneNumber": "+2348012345678",
  "firstName": "John",
  "lastName": "Doe",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "referralCode": "ABC123XYZ"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "email": "john.doe@example.com",
    "requiresVerification": true
  }
}
```

#### Validation Rules
-  Email: Valid email format
-  Phone: Optional, E.164 format (+2348012345678)
-  Password: Min 8 chars, uppercase, lowercase, number, special char
-  ConfirmPassword: Must match password
-  First/Last Name: 2-50 characters

</details>

<details>
<summary><b>POST /auth/verify-email</b> - Verify email with OTP</summary>

#### Request Body
```json
{
  "email": "john.doe@example.com",
  "code": "123456"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "isEmailVerified": true,
      "referralCode": "A0AEMLUZXSWW"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

</details>

<details>
<summary><b>POST /auth/resend-otp</b> - Resend OTP code</summary>

#### Request Body
```json
{
  "email": "john.doe@example.com"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "email": "john.doe@example.com"
  }
}
```

**Rate Limiting:**
- Max 3 OTP requests per hour
- 2-minute cooldown between requests

</details>

<details>
<summary><b>POST /auth/login</b> - Customer login</summary>

#### Request Body
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "isEmailVerified": true,
      "referralCode": "A0AEMLUZXSWW",
      "lastLogin": "2026-02-21T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

</details>

<details>
<summary><b>POST /auth/forgot-password</b> - Request password reset</summary>

#### Request Body
```json
{
  "email": "john.doe@example.com"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "If the email exists, a reset code has been sent",
  "data": null
}
```

>  **Security Note**: Response doesn't reveal if email exists

</details>

<details>
<summary><b>POST /auth/reset-password</b> - Reset password with OTP</summary>

#### Request Body
```json
{
  "email": "john.doe@example.com",
  "code": "123456",
  "newPassword": "NewPassword123!"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": null
}
```

</details>

<details>
<summary><b>POST /auth/refresh</b> - Refresh access token</summary>

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

</details>

<details>
<summary><b>POST /auth/logout</b> - Logout user</summary>

#### Headers
```
Authorization: Bearer <accessToken>
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

</details>

---

### 2. Admin Authentication

<details>
<summary><b>POST /auth/admin/register</b> - Register admin user</summary>

#### Request Body
```json
{
  "email": "admin@chukskitchen.com",
  "firstName": "Admin",
  "lastName": "User",
  "password": "AdminPassword123!",
  "confirmPassword": "AdminPassword123!",
  "adminSecret": "your-admin-secret-key"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Admin registration successful. Please verify your email.",
  "data": {
    "email": "admin@chukskitchen.com",
    "role": "ADMIN",
    "requiresVerification": true
  }
}
```

>  **Required**: `ADMIN_SECRET` environment variable

</details>

<details>
<summary><b>POST /auth/admin/login</b> - Admin login</summary>

#### Request Body
```json
{
  "email": "admin@chukskitchen.com",
  "password": "AdminPassword123!"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@chukskitchen.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "isEmailVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

>  **Security**: Customers cannot use this endpoint

</details>

---

### 3. Protected Endpoints (Require Authentication)

All endpoints below require the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

<details>
<summary><b>GET /users/profile</b> - Get current user profile</summary>

#### Success Response (200)
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "phoneNumber": "+2348012345678",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "isEmailVerified": true,
    "isPhoneVerified": false,
    "referralCode": "A0AEMLUZXSWW",
    "profileImage": null,
    "createdAt": "2026-02-20T10:00:00Z",
    "lastLogin": "2026-02-21T10:30:00Z"
  }
}
```

</details>

<details>
<summary><b>PATCH /users/profile</b> - Update user profile</summary>

#### Request Body
```json
{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phoneNumber": "+2348098765432"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "firstName": "Jonathan",
    "lastName": "Doe",
    "phoneNumber": "+2348098765432"
  }
}
```

</details>

<details>
<summary><b>PUT /users/change-password</b> - Change password (authenticated)</summary>

#### Request Body
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

</details>

---

##  Authentication Flow

### Registration & Verification Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant DB
    participant Email

    User->>API: POST /auth/register
    API->>DB: Check if user exists
    DB-->>API: No user found
    API->>DB: Create unverified user
    API->>DB: Generate 6-digit OTP
    API->>Email: Send OTP to user email
    Email-->>User: OTP: 123456
    API-->>User: 201 Registration successful
    
    User->>API: POST /auth/verify-email (OTP)
    API->>DB: Verify OTP
    DB-->>API: OTP valid
    API->>DB: Mark email as verified
    API->>API: Generate JWT tokens
    API-->>User: 200 Tokens + User data
```

### Login Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant DB
    participant Redis

    User->>API: POST /auth/login
    API->>DB: Find user by email
    DB-->>API: User found
    API->>API: Verify password (bcrypt)
    API->>API: Check email verified
    API->>API: Generate JWT tokens
    API->>Redis: Store refresh token hash
    API->>DB: Update lastLogin
    API-->>User: 200 Tokens + User data
```

### Token Refresh Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Redis

    Client->>API: Request with expired token
    API-->>Client: 401 Unauthorized
    Client->>API: POST /auth/refresh (refresh token)
    API->>API: Verify refresh token
    API->>Redis: Check token hash
    Redis-->>API: Token hash valid
    API->>API: Generate new token pair
    API->>Redis: Store new refresh token
    API-->>Client: 200 New tokens
    Client->>API: Retry request with new token
```

### Password Reset Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant DB
    participant Email
    participant Redis

    User->>API: POST /auth/forgot-password
    API->>DB: Find user
    API->>DB: Generate OTP
    API->>Email: Send reset OTP
    Email-->>User: OTP: 654321
    API-->>User: 200 If email exists...
    
    User->>API: POST /auth/reset-password (OTP + new password)
    API->>DB: Verify OTP
    API->>DB: Hash new password
    API->>DB: Update password
    API->>Redis: Invalidate all refresh tokens
    API-->>User: 200 Password reset successful
```

---

##  Security Features

### Password Security

| Feature | Implementation | Details |
|---------|---------------|---------|
| **Hashing Algorithm** | bcrypt | 12 rounds (2^12 iterations) |
| **Minimum Length** | 8 characters | Enforced at DTO level |
| **Complexity** | Multi-requirement | Uppercase, lowercase, number, special char |
| **Storage** | Hashed only | Plain text never stored |
| **Salt** | Random per password | Built into bcrypt |

### Token Security

**Access Token:**
```typescript
{
  sub: userId,
  email: "user@example.com",
  role: "CUSTOMER",
  type: "access",
  iat: 1708515600,
  exp: 1708516500  // 15 minutes
}
```

**Refresh Token:**
```typescript
{
  sub: userId,
  email: "user@example.com",
  role: "CUSTOMER",
  type: "refresh",
  iat: 1708515600,
  exp: 1709120400  // 7 days
}
```

**Security Measures:**
-  Signed with different secrets (JWT_SECRET vs JWT_REFRESH_SECRET)
-  Refresh token stored as hash in Redis
-  Token rotation on refresh (new tokens issued)
-  Single-use refresh tokens
-  All tokens invalidated on password change
-  Logout invalidates all user tokens

### OTP Security

| Feature | Value | Description |
|---------|-------|-------------|
| **Length** | 6 digits | Random number generation |
| **Expiration** | 10 minutes | Automatic cleanup |
| **Rate Limit** | 3 per hour | Per user, per purpose |
| **Cooldown** | 2 minutes | Between requests |
| **Single Use** | Yes | Marked as used after verification |
| **Purpose Isolation** | Yes | Separate OTPs for email, password, phone |

### Session Management

- **Storage**: Redis in-memory database
- **Token Hash**: SHA-256 hash of refresh token
- **TTL**: Automatic expiration (7 days)
- **Invalidation**: On logout, password change, or refresh
- **Concurrent Sessions**: Supported (multiple devices)

### API Security

```typescript
// Helmet - Security headers
app.use(helmet());

// CORS - Whitelist origins
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
});

// Rate Limiting
@UseGuards(ThrottlerGuard)
@Throttle(10, 60) // 10 requests per 60 seconds

// Input Validation
@Body() dto: RegisterDto // class-validator

// Prisma - SQL Injection Prevention
prisma.user.findUnique({ where: { email } })
```

---


### Using Postman

#### 1. Import API Collection

```bash
# Export Swagger JSON
curl http://localhost:5000/api-json > api-collection.json

# Import into Postman
File → Import → api-collection.json
```

#### 2. Setup Environment Variables

Create a Postman environment with:

```json
{
  "base_url": "http://localhost:5000/api/v1",
  "access_token": "",
  "refresh_token": ""
}
```

#### 3. Test Registration Flow

```javascript
// 1. Register
POST {{base_url}}/auth/register
Body: {
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "password": "Test123!",
  "confirmPassword": "Test123!"
}

// 2. Check email for OTP 

// 3. Verify Email
POST {{base_url}}/auth/verify-email
Body: {
  "email": "test@example.com",
  "code": "123456"
}

// 4. Save tokens in Tests tab:
pm.environment.set("access_token", pm.response.json().data.tokens.accessToken);
pm.environment.set("refresh_token", pm.response.json().data.tokens.refreshToken);
```

#### 4. Test Protected Routes

```javascript
GET {{base_url}}/users/profile
Headers: {
  "Authorization": "Bearer {{access_token}}"
}
```

### Using cURL

#### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "Test123!",
    "confirmPassword": "Test123!"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

#### Get Profile
```bash
curl -X GET http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Admin Testing

#### 1. Set Admin Secret

```bash
# Add to .env
ADMIN_SECRET=your-secure-admin-secret-key-2026
```

#### 2. Register Admin

```bash
curl -X POST http://localhost:5000/api/v1/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "firstName": "Admin",
    "lastName": "User",
    "password": "Admin123!",
    "confirmPassword": "Admin123!",
    "adminSecret": "your-secure-admin-secret-key-2026"
  }'
```

#### 3. Verify Admin Email
(Same as customer verification)

#### 4. Admin Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

---

##  Error Codes

| Code | HTTP | Message | Description |
|------|------|---------|-------------|
| `EMAIL_ALREADY_EXISTS` | 409 | User with this email already exists | Email is registered and verified |
| `EMAIL_NOT_VERIFIED` | 400 | Please verify your email | User exists but email not verified |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password | Wrong login credentials |
| `USER_NOT_FOUND` | 404 | User not found | Email doesn't exist |
| `INVALID_OTP` | 401 | Invalid or expired OTP | Wrong or expired verification code |
| `TOO_MANY_OTP_REQUESTS` | 429 | Too many OTP requests | Rate limit exceeded |
| `INVALID_REFERRAL_CODE` | 400 | Invalid or expired referral code | Referral code invalid |
| `INVALID_TOKEN` | 401 | Invalid or expired token | JWT verification failed |
| `TOKEN_EXPIRED` | 401 | Token has expired | Access token expired, use refresh |
| `UNAUTHORIZED` | 401 | Unauthorized access | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions | User lacks required role |
| `SERVER_ERROR` | 500 | Internal server error | Unexpected server error |

### Example Error Response

```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "statusCode": 401,
    "timestamp": "2026-02-21T10:30:00.000Z",
    "path": "/api/v1/auth/login"
  }
}
```

---

## Performance Considerations

### Database Optimization

```prisma
// Indexed fields for fast queries
@@index([email])
@@index([phoneNumber])
@@index([referralCode])
@@index([userId, purpose, expiresAt])
@@index([isActive])
```

### Redis Caching

- Refresh tokens stored in Redis (in-memory)
- O(1) lookup complexity
- Automatic TTL expiration
- Reduces database load

### Rate Limiting

```typescript
// Global rate limit
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 100, // 100 requests per minute
})

// Sensitive endpoints
@Throttle(3, 3600) // 3 OTP requests per hour
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
</div>