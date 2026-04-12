// src/config/database.js — Database Configuration
export const databaseConfig = {
  url: process.env.SUPABASE_URL,
  apiKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  auth: {
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },
};
