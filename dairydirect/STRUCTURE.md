# 📁 DairyDirect — Project Structure

This project follows a monorepo structure designed for production readiness and clear separation of concerns.

## 🏗️ Folder Overview

| Folder | Responsibility | Tech Stack |
| :--- | :--- | :--- |
| **`/frontend`** | User Interface & Web API | Next.js 16+, TypeScript, Tailwind CSS |
| **`/backend`** | Core Business API (Legacy/Separated) | Node.js, Express, JWT |
| **`/database`** | Database Schema & Migrations | Supabase, PostgreSQL |
| **`/docs`** | Documentation & Integration Guides | Markdown, PDF |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+)
- npm / yarn
- Supabase Project

### 2. Installation
From the root directory, run:
```bash
npm run install:all
```

### 3. Environment Variables
- Copy `frontend/.env.local.example` to `frontend/.env.local`
- Copy `backend/.env.example` to `backend/.env`
- Fill in your Supabase and Firebase credentials.

### 4. Running the App
**Start Frontend (Next.js):**
```bash
npm run dev:frontend
```

**Start Backend (Express):**
```bash
npm run dev:backend
```

---

## 🛠️ Development Guidelines

1. **Frontend**: Located in `/frontend`. Uses Next.js App Router. API routes are in `src/app/api`.
2. **Backend**: Located in `/backend`. Use this for logic that needs to be separated from the Next.js server.
3. **Database**: Migrations are in `/database/supabase/migrations`. Use the Supabase CLI or SQL Editor to apply changes.
4. **Scripts**: Use the root `package.json` scripts to manage the entire monorepo.
