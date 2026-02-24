<div align="center">

#  Chuks Kitchen API

### Complete Food Ordering Platform - Authentication, Menu Management & Shopping Cart

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

[Quick Start](#-quick-start) • [API Docs](#-api-documentation) • [Features](#-key-features) • [Architecture](#-architecture)

</div>

---

##  Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-system-architecture)
- [Quick Start](#-quick-start)
- [Modules](#-modules)
  - [Authentication](#1-authentication--authorization)
  - [Food Management](#2-food-management)
  - [Shopping Cart](#3-shopping-cart)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Testing](#-testing)
- [Contributing](#-contributing)

---

##  Overview

**Chuks Kitchen API** is a production-ready, full-stack food ordering platform built with **NestJS**, **MongoDB**, and **Redis**. The system features comprehensive user authentication, dynamic menu management with image uploads, and an intelligent shopping cart system supporting both guest and authenticated users.

### What Makes It Special?

-  **Dual Authentication** - Separate customer and admin access with role-based authorization
-  **Dynamic Menu** - 5 food categories with special Jollof Rice customization (protein choices & extra sides)
-  **Smart Cart** - Guest cart support with automatic merge on login
-  **Image Management** - Cloudinary integration for optimized food images
-  **Referral System** - Built-in user referral and promotional code support
-  **Smart Pricing** - Automatic price calculation with protein and sides add-ons

---

##  Key Features

<table>
<tr>
<td width="50%">

###  Authentication
-  Email/password registration
-  6-digit OTP verification
-  JWT access & refresh tokens
-  Password reset flow
-  Admin authentication (separate)
-  Role-based access control
-  Referral code system

</td>
<td width="50%">

###  Food Management
-  5 food categories
-  CRUD operations (admin)
-  Image upload (Cloudinary)
-  Public menu browsing
-  Search & filters
-  Featured items
-  Availability management

</td>
</tr>
<tr>
<td width="50%">

###  Shopping Cart
-  Guest cart support
-  Authenticated cart
-  Auto-merge on login
-  Protein choices (Jollof Rice)
-  Extra sides selection
-  Customer messages
-  Real-time pricing

</td>
<td width="50%">

###  Security
-  Bcrypt password hashing
-  Redis session management
-  Rate limiting
-  CORS protection
-  Input validation
-  SQL injection prevention
-  XSS protection

</td>
</tr>
</table>

---

##  Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | NestJS 10 | Framework |
| **Language** | TypeScript 5 | Type safety |
| **Database** | MongoDB Atlas | Data storage |
| **ORM** | Prisma 6.19.2 | Database toolkit |
| **Cache** | Redis Cloud | Session management |
| **Auth** | JWT + bcrypt | Authentication |
| **Storage** | Cloudinary | Image hosting |
| **Email** | Nodemailer | Email service |
| **Docs** | Swagger | API documentation |

---

##  System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  (Web App / Mobile App / Admin Dashboard)                      │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                      NestJS API Gateway                         │
│                     (http://localhost:5000)                     │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │     Auth     │  │     Food     │  │     Cart     │        │
│  │    Module    │  │    Module    │  │    Module    │        │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤        │
│  │ • Register   │  │ • Categories │  │ • Add Item   │        │
│  │ • Login      │  │ • Food Items │  │ • Update     │        │
│  │ • OTP        │  │ • Images     │  │ • Remove     │        │
│  │ • Tokens     │  │ • Search     │  │ • Guest Cart │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │    Guards    │  │    Services   │                          │
│  ├──────────────┤  ├──────────────┤                          │
│  │ • JWT Auth   │  │ • Email      │                          │
│  │ • Roles      │  │ • Cloudinary │                          │
│  │ • Throttle   │  │ • OTP        │                          │
│  └──────────────┘  └──────────────┘                          │
└───────────┬────────────────────┬───────────────────┬──────────┘
            │                    │                   │
            ▼                    ▼                   ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │   MongoDB    │    │    Redis     │    │  Cloudinary  │
  │   (Atlas)    │    │   (Cloud)    │    │    (CDN)     │
  ├──────────────┤    ├──────────────┤    ├──────────────┤
  │ • Users      │    │ • Sessions   │    │ • Food       │
  │ • OTPs       │    │ • Tokens     │    │   Images     │
  │ • Categories │    │ • Rate Limit │    │ • Auto       │
  │ • Food Items │    │              │    │   Optimize   │
  │ • Carts      │    │              │    │              │
  └──────────────┘    └──────────────┘    └──────────────┘
```

---

##  Quick Start

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Redis Cloud account
- Cloudinary account
- Gmail (for SMTP)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/chuks-kitchen-api.git
cd chuks-kitchen-api

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 4. Initialize database
npx prisma generate
npx prisma db push

# 5. Seed food categories
npx ts-node prisma/seed-categories.ts

# 6. Start development server
npm run start:dev
```

** API Running at:** `http://localhost:5000/api/v1`

** Swagger Docs:** `http://localhost:5000/api/docs`

---

##  Modules

## 1. Authentication & Authorization

Complete user authentication system with separate customer and admin access.

### Features

-  Email/password authentication
-  6-digit OTP email verification
-  Password reset with OTP
-  Referral code system
-  Customer & admin roles
-  JWT access & refresh tokens

### API Endpoints

<details>
<summary><b>Customer Authentication</b></summary>

#### Register Customer
```http
POST /auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "phoneNumber": "+2348012345678",
  "referralCode": "ABC123XYZ"
}
```

#### Verify Email
```http
POST /auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f...",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "referralCode": "A0AEMLUZXSWW"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

</details>

<details>
<summary><b>Admin Authentication</b></summary>

#### Register Admin
```http
POST /auth/admin/register
Content-Type: application/json

{
  "email": "admin@chukskitchen.com",
  "firstName": "Admin",
  "lastName": "User",
  "password": "AdminPass123!",
  "confirmPassword": "AdminPass123!",
  "adminSecret": "your-admin-secret"
}
```

#### Admin Login
```http
POST /auth/admin/login
Content-Type: application/json

{
  "email": "admin@chukskitchen.com",
  "password": "AdminPass123!"
}
```

**Note:** Customers cannot login through admin endpoint and vice versa.

</details>

<details>
<summary><b>Protected Endpoints</b></summary>

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PATCH /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jonathan",
  "phoneNumber": "+2348098765432"
}
```

#### Change Password
```http
PUT /users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

</details>

### Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt (12 rounds) |
| Token Storage | Redis (hashed) |
| OTP Expiry | 10 minutes |
| Rate Limiting | 3 OTP/hour, 2min cooldown |
| Token Expiry | Access: 15min, Refresh: 7 days |

---

## 2. Food Management

Dynamic menu system with 5 categories and Cloudinary image storage.

### The 5 Food Categories

1. ** Jollof Rice and Entrees** (Special Features)
   - Protein choices: Fried Chicken (default), Grilled Fish (+₦500), Beef (+₦700)
   - Extra sides: Fried Plantain (₦300), Coleslaw (₦200), Extra Pepper Sauce (₦100)
   - Customer message box enabled

2. ** Swallow and Soups**
   - Eba, Fufu, Pounded Yam
   - Egusi, Ogbono, Efo Riro

3. ** Grills and Sides**
   - Suya, Peppered Chicken
   - Grilled Fish, Asun

4. ** Beverages**
   - Chapman, Zobo
   - Fresh Juices

5. ** Desserts**
   - Chin Chin, Puff Puff
   - Plantain Cake

### API Endpoints

<details>
<summary><b>Food Categories (Public + Admin)</b></summary>

#### Get All Categories (Public)
```http
GET /food/categories
GET /food/categories?activeOnly=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "64f...",
        "name": "Jollof Rice and Entrees",
        "slug": "jollof-rice-and-entrees",
        "description": "Delicious Nigerian Jollof rice...",
        "isActive": true,
        "displayOrder": 1,
        "_count": { "foodItems": 5 }
      }
    ],
    "total": 5
  }
}
```

#### Get Single Category (Public)
```http
GET /food/categories/:id
GET /food/categories/jollof-rice-and-entrees
```

#### Create Category (Admin Only)
```http
POST /food/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Jollof Rice and Entrees",
  "description": "Delicious Nigerian Jollof rice...",
  "displayOrder": 1
}
```

#### Update Category (Admin Only)
```http
PATCH /food/categories/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": false
}
```

#### Delete Category (Admin Only)
```http
DELETE /food/categories/:id
Authorization: Bearer <admin-token>
```

</details>

<details>
<summary><b>Food Items (Public + Admin)</b></summary>

#### Get All Food Items (Public)
```http
GET /food/items
GET /food/items?categoryId=64f...
GET /food/items?available=true
GET /food/items?featured=true
GET /food/items?search=jollof
```

#### Get Items by Category (Public)
```http
GET /food/items/category/jollof-rice-and-entrees
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": {
      "name": "Jollof Rice and Entrees",
      "description": "..."
    },
    "foodItems": [
      {
        "id": "64f...",
        "name": "Jollof Rice Special",
        "slug": "jollof-rice-special",
        "description": "Delicious Nigerian Jollof rice...",
        "imageUrl": "https://res.cloudinary.com/...",
        "basePrice": 2500,
        "allowProteinChoice": true,
        "allowExtraSides": true,
        "isAvailable": true,
        "isFeatured": true
      }
    ],
    "total": 1
  }
}
```

#### Create Food Item (Admin Only)
```http
POST /food/items
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Fields:
- categoryId: "64f..."
- name: "Jollof Rice Special"
- description: "Delicious Nigerian Jollof rice..."
- basePrice: 2500
- allowProteinChoice: true
- allowExtraSides: true
- isAvailable: true
- isFeatured: false
- image: <file> (required, max 5MB)
```

**Image Upload:**
- Formats: JPG, PNG
- Max size: 5MB
- Auto-optimization by Cloudinary
- Max dimensions: 800x800
- Auto format conversion (WebP)

#### Update Food Item (Admin Only)
```http
PATCH /food/items/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Fields:
- name: "Updated Name"
- basePrice: 3000
- image: <file> (optional, replaces old image)
```

#### Toggle Availability (Admin Only)
```http
PATCH /food/items/:id/toggle-availability
Authorization: Bearer <admin-token>
```

#### Toggle Featured (Admin Only)
```http
PATCH /food/items/:id/toggle-featured
Authorization: Bearer <admin-token>
```

</details>

### Image Management

- **Storage**: Cloudinary CDN
- **Optimization**: Automatic
- **Formats**: Auto (WebP for supported browsers)
- **Dimensions**: Max 800x800
- **Cleanup**: Old images deleted on update

---

## 3. Shopping Cart

Intelligent cart system supporting both guest and authenticated users with automatic merge on login.

### Features

-  Guest cart (no login required)
-  Authenticated cart (user-specific)
-  Auto-merge cart on login
-  Protein selection (Jollof Rice)
-  Extra sides selection
-  Customer messages
-  Real-time pricing
-  Smart duplicate handling

### Pricing System

**Protein Options (Additional Cost):**
- Fried Chicken: ₦0 (default)
- Grilled Fish: +₦500
- Beef: +₦700

**Extra Sides:**
- Fried Plantain: ₦300
- Coleslaw: ₦200
- Extra Pepper Sauce: ₦100

**Calculation:**
```
Unit Price = Base Price + Protein Price + Sum(Extra Sides)
Line Total = Unit Price × Quantity
Cart Total = Sum(All Line Totals)
```

### API Endpoints

<details>
<summary><b>Cart Operations (Public - Works for Guest & Auth)</b></summary>

#### Add to Cart

**For Guest Users:**
```http
POST /cart/items
Content-Type: application/json

{
  "foodItemId": "64f...",
  "quantity": 2,
  "selectedProtein": "GRILLED_FISH",
  "selectedExtraSides": ["FRIED_PLANTAIN", "COLESLAW"],
  "customerMessage": "Extra spicy please!",
  "guestId": "guest_1708515600000"
}
```

**For Authenticated Users:**
```http
POST /cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "foodItemId": "64f...",
  "quantity": 2,
  "selectedProtein": "GRILLED_FISH",
  "selectedExtraSides": ["FRIED_PLANTAIN", "COLESLAW"],
  "customerMessage": "Extra spicy please!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64f...",
    "items": [
      {
        "id": "64f...",
        "foodItem": {
          "name": "Jollof Rice Special",
          "imageUrl": "https://...",
          "basePrice": 2500
        },
        "quantity": 2,
        "unitPrice": 3200,
        "totalPrice": 6400,
        "selectedProtein": "GRILLED_FISH",
        "selectedExtraSides": ["FRIED_PLANTAIN", "COLESLAW"]
      }
    ],
    "summary": {
      "itemCount": 1,
      "totalQuantity": 2,
      "subtotal": 6400
    }
  }
}
```

**Price Breakdown:**
```
Base Price:        ₦2,500
+ Grilled Fish:    ₦500
+ Fried Plantain:  ₦300
+ Coleslaw:        ₦200
─────────────────────────
Unit Price:        ₦3,200
× Quantity:        2
─────────────────────────
Total:             ₦6,400
```

#### Get Cart

**Guest:**
```http
GET /cart?guestId=guest_1708515600000
```

**Authenticated:**
```http
GET /cart
Authorization: Bearer <token>
```

#### Get Cart Count (for badge)

**Guest:**
```http
GET /cart/count?guestId=guest_1708515600000
```

**Authenticated:**
```http
GET /cart/count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "itemCount": 3,
    "totalQuantity": 7
  }
}
```

#### Update Cart Item

**Guest:**
```http
PATCH /cart/items/:id
Content-Type: application/json

{
  "quantity": 3,
  "selectedProtein": "BEEF",
  "guestId": "guest_1708515600000"
}
```

**Authenticated:**
```http
PATCH /cart/items/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3,
  "selectedProtein": "BEEF"
}
```

#### Remove Item

**Guest:**
```http
DELETE /cart/items/:id?guestId=guest_1708515600000
```

**Authenticated:**
```http
DELETE /cart/items/:id
Authorization: Bearer <token>
```

#### Clear Cart

**Guest:**
```http
DELETE /cart?guestId=guest_1708515600000
```

**Authenticated:**
```http
DELETE /cart
Authorization: Bearer <token>
```

</details>

<details>
<summary><b>Cart Merge (After Login)</b></summary>

#### Merge Guest Cart to User Cart

```http
POST /cart/merge
Authorization: Bearer <token>
Content-Type: application/json

{
  "guestId": "guest_1708515600000"
}
```

**What Happens:**
1. All guest cart items copied to user cart
2. Duplicate items merged (quantities added)
3. Guest cart deleted
4. Returns merged cart

**Use Case:**
```
1. User browses as guest and adds items
2. User proceeds to checkout
3. User logs in
4. Call /cart/merge with guestId
5. Guest cart automatically merged
6. User cart now has all items
```

</details>

### Guest Cart Implementation

**Frontend Example:**
```javascript
// Generate guest ID on app load
let guestId = localStorage.getItem('guestId');
if (!guestId) {
  guestId = `guest_${Date.now()}`;
  localStorage.setItem('guestId', guestId);
}

// Add to cart (guest)
const addToCart = async (foodItemId, quantity) => {
  const response = await fetch('/api/v1/cart/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      foodItemId,
      quantity,
      guestId,
    }),
  });
  return response.json();
};

// After login, merge cart
const mergeCart = async (token) => {
  const guestId = localStorage.getItem('guestId');
  if (guestId) {
    await fetch('/api/v1/cart/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ guestId }),
    });
    localStorage.removeItem('guestId');
  }
};
```

---

##  API Documentation

### Base URL
```
Development: http://localhost:5000/api/v1
```

### Interactive Documentation
```
Swagger UI: http://localhost:5000/api/docs
```

### Authentication Headers

**JWT Token (Authenticated Users):**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Guest ID (Guest Users):**
```
In body: { "guestId": "guest_1708515600000" }
In query: ?guestId=guest_1708515600000
```

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Server Error |

---

##  Security

### Authentication & Authorization

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Separate access & refresh tokens
- **Session Storage**: Redis with automatic expiration
- **Role-Based Access**: Customer and Admin roles
- **Rate Limiting**: 3 OTP requests per hour per user

### API Security

```typescript
// CORS Protection
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
});

// Security Headers
app.use(helmet());

// Rate Limiting
@Throttle(10, 60) // 10 requests per 60 seconds

// Input Validation
@Body() dto: RegisterDto // class-validator
```

### Data Protection

- **OTP**: 6 digits, 10-minute expiry, single-use
- **Passwords**: Never logged, stored as hash only
- **Tokens**: Refresh tokens hashed in Redis
- **File Uploads**: Type and size validation
- **SQL Injection**: Prevented by Prisma ORM

### Best Practices

 Always use HTTPS in production  
 Rotate JWT secrets regularly  
 Keep dependencies updated  
 Use environment variables for secrets  
 Enable 2FA for admin accounts  
 Monitor rate limit violations  
 Regular security audits  

---

##  Testing

### Using Postman

1. **Import Collection**
```bash
curl http://localhost:5000/api-json > api-collection.json
```

2. **Setup Environment**
```json
{
  "base_url": "http://localhost:5000/api/v1",
  "access_token": "",
  "refresh_token": "",
  "admin_token": "",
  "guest_id": ""
}
```

3. **Test Workflows**

**Customer Registration Flow:**
```
1. POST /auth/register
2. Check email for OTP
3. POST /auth/verify-email
4. Save tokens
5. GET /users/profile (with token)
```

**Admin Food Management:**
```
1. POST /auth/admin/login (save admin token)
2. POST /food/categories (create category)
3. POST /food/items (upload food with image)
4. PATCH /food/items/:id/toggle-availability
5. Public GET /food/items (verify visibility)
```

### Using cURL

**Register User:**
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

**Add to Cart (Guest):**
```bash
curl -X POST http://localhost:5000/api/v1/cart/items \
  -H "Content-Type: application/json" \
  -d '{
    "foodItemId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "quantity": 2,
    "guestId": "guest_'$(date +%s)'"
  }'
```

**Get Food Items:**
```bash
curl http://localhost:5000/api/v1/food/items?available=true
```

---

##  Environment Variables

<details>
<summary><b>Complete .env Configuration</b></summary>

```env
# ============================================================================
# SERVER
# ============================================================================
NODE_ENV=development
PORT=5000
API_PREFIX=api/v1

# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true"

# ============================================================================
# JWT
# ============================================================================
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET="your-refresh-secret-different-from-jwt"
JWT_REFRESH_EXPIRATION=7d

# ============================================================================
# REDIS
# ============================================================================
REDIS_URL=redis://default:password@host:port

# ============================================================================
# EMAIL (Gmail SMTP)
# ============================================================================
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=yourapppasswordnospaces
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME="Chuks Kitchen"

# ============================================================================
# CLOUDINARY
# ============================================================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=chuks-kitchen

# ============================================================================
# ADMIN
# ============================================================================
ADMIN_SECRET=your-secure-admin-secret-2026

# ============================================================================
# FRONTEND
# ============================================================================
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:5001
```

</details>

---

### Coding Standards

- Follow NestJS best practices
- Use TypeScript strict mode
- Update documentation
- Follow conventional commits

---

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- **Documentation**: [Full API Docs](http://localhost:5000/api/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/chuks-kitchen-api/issues)
- **Email**: support@chukskitchen.com

---

<div align="center">

##  Quick Links

[![API Docs](https://img.shields.io/badge/API-Documentation-blue?style=for-the-badge)](http://localhost:5000/api/docs)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/yourusername/chuks-kitchen-api)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

**Built with ❤️ for Chuks Kitchen**

Made with [NestJS](https://nestjs.com/) • Powered by [MongoDB](https://www.mongodb.com/) • Secured by [Redis](https://redis.io/)

**[⬆ Back to Top](#-chuks-kitchen-api)**

</div>