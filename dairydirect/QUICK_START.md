# ⚡ Quick Start - Get Running in 5 Minutes

## 1️⃣ Run OTP Schema in Supabase

```sql
-- Copy this entire script and run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS otp_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_otp_phone_expires ON otp_store(phone, expires_at);
CREATE INDEX idx_otp_verified ON otp_store(verified);
CREATE INDEX idx_otp_created ON otp_store(created_at);
```

**Or run file:**

```bash
# File location: database/supabase/otp_schema.sql
```

---

## 2️⃣ Start Backend Server

```bash
cd dairydirect/backend
npm run dev

# Expected output:
# ✅ DairyDirect API is running
# Listening on port 4000
```

---

## 3️⃣ Start Frontend Server (New Terminal)

```bash
cd dairydirect/frontend
npm run dev

# Expected output:
# ▲ Next.js 16.0.0
# - Local: http://localhost:3000
```

---

## 4️⃣ Test OTP Authentication Flow

### Step 1: Go to Login Page

```
Visit: http://localhost:3000/auth/login
```

### Step 2: Enter Phone Number

```
Example: 9876543210
```

### Step 3: Send OTP

- Click "Send OTP" button
- You should see success message ✓

### Step 4: Check Backend Console for OTP

Look at **backend terminal** output:

```
[OTP] Phone: 9876543210, Code: 123456
```

Copy the 6-digit code (in this example: 123456)

### Step 5: Verify OTP

- You'll be redirected to verification page
- Enter the 6-digit OTP you just copied
- Click "Verify OTP"

### Step 6: See Dynamic Profile

- After successful verification
- Redirect to home page
- Visit `/profile` to see your dynamic user data

---

## 📱 What You'll See

### Login Page

```
🌿 DairyDirect
Welcome Back
Enter your phone number to continue

Phone input box [+91 | ______]
[Send OTP] button
```

### OTP Verification Page

```
🔒 Verify OTP
Enter the 6-digit code sent to +91 9876543210

[___] [___] [___] [___] [___] [___]
OTP expires in 4:45

[Verify OTP] button
```

### Profile Page

```
Profile

👤 John Doe
+91 9876543210

Role: CUSTOMER
Active Plans: 1

Account Settings
Orders & Subscriptions
Help & Support
```

---

## 🔍 Verify Everything Works

### Check Login Works

```bash
# Terminal 1: Backend
# Look for: [OTP] Phone: XXX, Code: XXXXXX

# Browser: http://localhost:3000/auth/login
# ✓ Phone input works
# ✓ OTP sends successfully
```

### Check Verification Works

```bash
# Browser: /auth/verify-otp
# ✓ OTP input accepts 6 digits
# ✓ Timer counts down
# ✓ Redirects to home after verification
```

### Check Profile Works

```bash
# Browser: /profile
# ✓ Shows your phone number (from localStorage)
# ✓ Shows your name (from localStorage)
# ✓ Logout button works
```

---

## 🚨 If Something Doesn't Work

### "OTP not sending"

- ✓ Check **backend terminal** for OTP log
- ✓ Look for: `[OTP] Phone: XXX, Code: XXXXXX`
- ✓ Copy code from console

### "Verification page doesn't show"

- ✓ Check browser console (F12) for errors
- ✓ Verify API base URL is correct
- ✓ Check Network tab for failed requests

### "Profile shows static data"

- ✓ Check localStorage has `authToken` and `user`
- ✓ Verify API responds to `/api/users/profile`
- ✓ Check Authorization header includes token

### "CORS error"

- ✓ Verify backend is running on port 4000
- ✓ Check CORS config in `.env`
- ✓ Allowed origins should include `http://localhost:3000`

---

## 📁 Important Files

| File                                       | Purpose             |
| ------------------------------------------ | ------------------- |
| `backend/src/controllers/otpController.js` | OTP logic           |
| `backend/src/utils/otp.js`                 | OTP utilities       |
| `frontend/app/auth/login/page.tsx`         | Login UI            |
| `frontend/app/auth/verify-otp/page.tsx`    | OTP verification UI |
| `frontend/app/(customer)/profile/page.tsx` | Dynamic profile     |
| `database/supabase/otp_schema.sql`         | Database schema     |

---

## 🎯 Test Cases

### ✅ Happy Path

1. Enter valid phone (10 digits)
2. Send OTP
3. Check console for code
4. Enter code on verification page
5. Success! Redirected to home

### ✅ Edge Cases

- Wrong OTP → Error message appears
- OTP expires → "OTP has expired" message
- Resend OTP → Timer resets
- Logout → Redirects to login

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│  ┌───────────────────────────────────┐  │
│  │  Login Page → OTP Verify → Home   │  │
│  │  Dynamic Profile Fetching         │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────────┐
│      Backend (Express.js)               │
│  ┌───────────────────────────────────┐  │
│  │  POST /auth/request-otp           │  │
│  │  POST /auth/verify-otp            │  │
│  │  GET /users/profile (Protected)   │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ SQL/Supabase SDK
┌──────────────▼──────────────────────────┐
│    Database (PostgreSQL via Supabase)   │
│  ┌───────────────────────────────────┐  │
│  │  users → phone, name, role        │  │
│  │  otp_store → phone, otp, expires  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🔐 Security Notes

- OTP valid for **5 minutes only**
- OTP is **6 random digits**
- Previous OTPs **invalidated** on new request
- JWT token **expires in 7 days**
- All protected routes require **valid token**
- Phone is **unique identifier** (can't be changed)

---

## 🎨 UI Color Scheme

```
Green: #3f6530      (Primary)
Green Pale: #c2efac (Light green)
Brown: #8a5025      (Secondary)
White: #ffffff      (Background)
Text: #1a1c18       (Dark text)
Muted: #43493e      (Medium gray)
Error: #ba1a1a      (Red)
```

---

## 📞 Support Commands

### View Backend Logs

```bash
# Terminal should show OTP when generated
tail -f backend.log # if logging to file
```

### Check Frontend Errors

```bash
# Browser F12 → Console tab
# Look for red errors or API failures
```

### Test API Directly

```bash
# Request OTP
curl -X POST http://localhost:4000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

# Get Profile (replace TOKEN with actual token)
curl http://localhost:4000/api/users/profile \
  -H "Authorization: Bearer TOKEN"
```

---

## ✅ Checklist

- [ ] Created OTP table in Supabase
- [ ] Backend running on port 4000
- [ ] Frontend running on port 3000
- [ ] Visit login page: http://localhost:3000/auth/login
- [ ] Enter phone number
- [ ] Check backend console for OTP
- [ ] Enter OTP on verification page
- [ ] Profile shows dynamic data
- [ ] Logout works

---

**Ready to go! 🚀**

If you have issues, check the **AUTHENTICATION_GUIDE.md** troubleshooting section.
