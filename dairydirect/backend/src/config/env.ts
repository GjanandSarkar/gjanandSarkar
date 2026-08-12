import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appUrl: process.env.APP_URL || 'http://localhost:4000',
  allowedOrigins: (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),

  // Database
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL,
  dbHost: process.env.DB_HOST || process.env.AWS_RDS_HOST || process.env.SUPABASE_DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || process.env.AWS_RDS_PORT || '5432', 10),
  dbName: process.env.DB_NAME || process.env.AWS_RDS_DATABASE || 'dairydirect',
  dbUser: process.env.DB_USER || process.env.AWS_RDS_USERNAME || 'postgres',
  dbPassword: process.env.DB_PASSWORD || process.env.AWS_RDS_PASSWORD || 'postgres',
  dbSsl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'gjanandsarkar-production-jwt-secret-key-32chars-minimum',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'gjanandsarkar-production-refresh-secret-key-32chars',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Admin access
  adminEmails: (process.env.ADMIN_EMAILS || 'admin@gjanandsarkar.com,patelroshu1218@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase()),
  adminPhones: (process.env.ADMIN_PHONES || '+919876543210,+919000000001')
    .split(',')
    .map((p) => p.trim()),

  // Razorpay
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // ImageKit
  imagekitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
  imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  imagekitUrlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',

  // Demo
  demoMode: process.env.DEMO_MODE !== 'false',
};

