# DairyDirect - OTP Authentication & Dynamic Profile Implementation Guide

## Overview

This document outlines the OTP-based authentication system and dynamic profile implementation for the DairyDirect e-commerce platform.

---

## Table of Contents

1. [Backend Implementation](#backend-implementation)
2. [Frontend Implementation](#frontend-implementation)
3. [Database Setup](#database-setup)
4. [API Endpoints](#api-endpoints)
5. [Authentication Flow](#authentication-flow)
6. [Setup Instructions](#setup-instructions)
7. [Testing](#testing)

---

## Backend Implementation

### New Files Created

#### 1. **OTP Utility** (`src/utils/otp.js`)

Handles OTP generation, storage, and verification.

**Functions:**

- `generateOTP()` - Generates 6-digit OTP
- `storeOTP(phone, otp)` - Stores OTP in database with 5-minute expiry
- `verifyOTP(phone, otp)` - Verifies OTP against stored value
- `sendOTPViaSMS(phone, otp)` - SMS delivery (demo: logs to console)
- `invalidateOTPs(phone)` - Invalidates previous OTPs

#### 2. **OTP Controller** (`src/controllers/otpController.js`)

Handles OTP authentication endpoints.

**Functions:**

- `requestOTP()` - POST /api/auth/request-otp
- `verifyOTPAndLogin()` - POST /api/auth/verify-otp
- `resendOTP()` - POST /api/auth/resend-otp

#### 3. **Updated Auth Controller** (`src/controllers/authController.js`)

**Changes:**

- Updated `login()` to return OTP request status instead of password validation
- Kept legacy endpoints for backward compatibility

#### 4. **Updated User Controller** (`src/controllers/userController.js`)

**Changes:**

- Fixed field name `full_name` → `name` to match schema
- Removed address field (addresses in separate table)
- Phone is treated as unique identifier (can't be changed)

#### 5. **Updated Order Controller** (`src/controllers/orderController.js`)

**Changes:**

- Updated field names to match new schema:
  - `total_price` → `total_amount`
  - `shipping_address` → address_id (foreign key)
  - Added required fields: `address_id`, `type`
- Added field validation

### Route Updates

**File:** `src/routes/auth.routes.js`

```javascript
// OTP endpoints
POST / api / auth / request - otp; // Request OTP
POST / api / auth / verify - otp; // Verify OTP & login
POST / api / auth / resend - otp; // Resend OTP

// Legacy endpoints (kept for compatibility)
POST / api / auth / signup; // Legacy signup
POST / api / auth / login; // Legacy login (now returns OTP request)
POST / api / auth / refresh; // Refresh JWT token
```

---

## Frontend Implementation

### New Files Created

#### 1. **Login Page** (`app/auth/login/page.tsx`)

- Phone number input with formatting
- OTP request with UI feedback
- Links to verification page
- Color-coded UI matching DairyDirect theme

#### 2. **OTP Verification Page** (`app/auth/verify-otp/page.tsx`)

- 6-digit OTP input with auto-focus
- Countdown timer (5 minutes)
- Resend OTP with rate limiting
- Security warnings

#### 3. **Auth Layout** (`app/auth/layout.tsx`)

- Shared layout for auth pages
- Consistent styling

#### 4. **Auth API Helper** (`lib/authApi.ts`)

Utility functions for auth operations:

- `requestOTP(phone)` - Request OTP
- `verifyOTPAndLogin(phone, otp, name)` - Verify and login
- `resendOTP(phone)` - Resend OTP
- `storeAuth(authData)` - Store token and user
- `getAuthToken()` - Get stored token
- `isAuthenticated()` - Check auth status
- `clearAuth()` - Logout

### Updated Components

#### 1. **Dynamic Profile Page** (`app/(customer)/profile/page.tsx`)

**Changes:**

- Fetches user data from API instead of hardcoded values
- Displays user name, phone, and role dynamically
- Shows subscription count from context
- Added logout functionality
- Session validation with redirect to login if unauthorized
- Loading and error states

---

## Database Setup

### Create OTP Table

Run this in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS otp_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_otp_phone_expires ON otp_store(phone, expires_at);
CREATE INDEX idx_otp_verified ON otp_store(verified);
CREATE INDEX idx_otp_created ON otp_store(created_at);
```

File: `database/supabase/otp_schema.sql` (included in repo)

---

## API Endpoints

### Authentication Endpoints

#### 1. Request OTP

```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phone": "9876543210"
}

Response (200):
{
  "message": "OTP sent successfully",
  "phone": "9876543210",
  "expiresIn": "5 minutes",
  "isDemoMode": true
}
```

**Demo Mode:** OTP is logged to console and sent via mock SMS.  
**Production:** Configure SMS provider (Twilio, AWS SNS, etc.) in `sendOTPViaSMS()`

#### 2. Verify OTP & Login

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456",
  "name": "John Doe"  // Optional, used for new users
}

Response (200):
{
  "message": "Authentication successful",
  "user": {
    "id": "uuid-here",
    "phone": "9876543210",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "token": "jwt-token-here"
}
```

**Behavior:**

- If phone exists: Logs in existing user
- If phone is new: Creates user automatically with provided name (defaults to "Customer")
- Returns JWT token for subsequent requests

#### 3. Resend OTP

```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "phone": "9876543210"
}

Response (200):
{
  "message": "OTP resent successfully",
  "phone": "9876543210",
  "expiresIn": "5 minutes"
}
```

#### 4. Get User Profile (Protected)

```http
GET /api/users/profile
Authorization: Bearer <jwt-token>

Response (200):
{
  "message": "User profile retrieved",
  "user": {
    "id": "uuid-here",
    "phone": "9876543210",
    "name": "John Doe",
    "role": "CUSTOMER"
  }
}
```

---

## Authentication Flow

### OTP-Based Login Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Enter phone number
       ▼
┌─────────────────────────────┐
│  GET /auth/request-otp      │
│  Request OTP                │
└──────┬──────────────────────┘
       │
       │ 2. Backend generates OTP
       │ 3. OTP stored in database (5-min expiry)
       │ 4. SMS sent (demo: console log)
       │
       ▼
┌─────────────────────────────┐
│  User receives OTP          │
│  (Check console in demo)    │
└──────┬──────────────────────┘
       │
       │ 5. Enter 6-digit OTP
       ▼
┌─────────────────────────────┐
│  POST /auth/verify-otp      │
│  Verify OTP & Login         │
└──────┬──────────────────────┘
       │
       │ 6. Backend validates OTP
       │ 7. OTP marked as verified
       │ 8. User created (if new)
       │ 9. JWT token generated
       │
       ▼
┌─────────────────────────────┐
│  Store JWT token & user     │
│  in localStorage            │
└──────┬──────────────────────┘
       │
       │ 10. Redirect to home
       ▼
┌─────────────┐
│  Home Page  │
└─────────────┘
```

---

## Setup Instructions

### Backend Setup

1. **Install OTP package dependencies**

```bash
cd backend
npm install  # Ensure all dependencies are installed
```

2. **Update environment variables** (`.env`)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
```

3. **Create OTP table in Supabase**
   - Go to Supabase SQL Editor
   - Run `database/supabase/otp_schema.sql`

4. **Start backend**

```bash
npm run dev
# Server running at http://localhost:4000
```

### Frontend Setup

1. **Install dependencies**

```bash
cd frontend
npm install
```

2. **Update environment variables** (`.env.local`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

3. **Start frontend**

```bash
npm run dev
# Client running at http://localhost:3000
```

---

## Testing

### Manual Testing

#### Test OTP Request

```bash
curl -X POST http://localhost:4000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

Expected Response:

```json
{
  "message": "OTP sent successfully",
  "phone": "9876543210",
  "expiresIn": "5 minutes",
  "isDemoMode": true
}
```

**Check console output for OTP code!**

#### Test OTP Verification

```bash
# Replace 123456 with actual OTP from console
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"9876543210",
    "otp":"123456",
    "name":"John Doe"
  }'
```

Expected Response:

```json
{
  "message": "Authentication successful",
  "user": {
    "id": "uuid-here",
    "phone": "9876543210",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "token": "jwt-token-here"
}
```

#### Test Protected Endpoint

```bash
# Use token from verify-otp response
curl http://localhost:4000/api/users/profile \
  -H "Authorization: Bearer <jwt-token-from-above>"
```

### User Journey Testing

1. **Visit login page** → `http://localhost:3000/auth/login`
2. **Enter phone number** (e.g., 9876543210)
3. **Click "Send OTP"**
4. **Check backend console for OTP code**
5. **Enter OTP on verification page**
6. **Should redirect to home page**
7. **Visit profile** → `/profile` to see dynamic user data

---

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js      ✓ Updated
│   │   ├── otpController.js       ✓ New
│   │   ├── userController.js      ✓ Updated
│   │   └── orderController.js     ✓ Updated
│   ├── routes/
│   │   └── auth.routes.js         ✓ Updated
│   └── utils/
│       └── otp.js                 ✓ New
└── database/supabase/
    └── otp_schema.sql             ✓ New

frontend/
├── app/
│   ├── auth/
│   │   ├── layout.tsx             ✓ New
│   │   ├── login/
│   │   │   └── page.tsx           ✓ New
│   │   └── verify-otp/
│   │       └── page.tsx           ✓ New
│   └── (customer)/profile/
│       └── page.tsx               ✓ Updated
└── lib/
    └── authApi.ts                 ✓ New
```

---

## Key Features

✅ **OTP-Based Authentication**

- 6-digit OTP
- 5-minute expiry
- Resend with rate limiting
- Console logging in demo mode

✅ **Dynamic Profile**

- Fetches user data from API
- Session validation
- Logout functionality
- Loading and error states

✅ **Schema Corrections**

- Fixed field names across controllers
- Proper foreign key relationships
- Required field validation

✅ **UI/UX**

- DairyDirect color theme
- Mobile-first responsive design
- Inline validation and feedback
- Security warnings

---

## Production Checklist

- [ ] Configure SMS provider (Twilio, AWS SNS)
- [ ] Update `sendOTPViaSMS()` function
- [ ] Set strong JWT_SECRET (min 32 chars)
- [ ] Enable HTTPS
- [ ] Set appropriate CORS origins
- [ ] Configure rate limiting
- [ ] Add logging/monitoring
- [ ] Test OTP cleanup (expired OTPs)
- [ ] Set up database backups
- [ ] Review security policies

---

## Troubleshooting

### OTP Not Appearing

- **Issue:** OTP not visible after requesting
- **Solution:** Check backend console for log output (demo mode)

### Login Redirect Loop

- **Issue:** Redirects to login even after authentication
- **Solution:** Ensure JWT token is stored in localStorage correctly

### CORS Errors

- **Issue:** Cross-origin requests failing
- **Solution:** Verify ALLOWED_ORIGINS in .env and CORS configuration

### Token Expired

- **Issue:** 401 Unauthorized after session timeout
- **Solution:** Use /api/auth/refresh endpoint to refresh token

---

## Support & Maintenance

For issues or feature requests, refer to:

- Backend logs: Check console and error responses
- Frontend logs: Check browser console (F12)
- Database: Check Supabase dashboard for OTP records

---

**Last Updated:** April 2026  
**Version:** 1.0.0
