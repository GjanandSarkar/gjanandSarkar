import http from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { getPool, getSupabaseAdmin } from './config/database';

const app = createApp();
const server = http.createServer(app);

const PORT = config.port;

async function startServer(): Promise<void> {
  let isDbConnected = false;

  // 1. Try PostgreSQL Pool if configured
  try {
    const pool = getPool();
    const client = await pool.connect();
    client.release();
    console.log('✅ Connected to PostgreSQL Database (Local / RDS Pool)');
    isDbConnected = true;
  } catch {
    // 2. Fallback to Supabase integration
    const supabase = getSupabaseAdmin();
    if (supabase) {
      console.log('✅ Connected to Supabase Cloud Database (Auth & API Active)');
      isDbConnected = true;
    }
  }

  if (!isDbConnected) {
    console.log('ℹ️ Running in Demo Mode (In-Memory & Offline Fallbacks Active)');
  }

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Graceful Shutdown
function handleShutdown(signal: string): void {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🔌 HTTP server closed.');
    try {
      const pool = getPool();
      await pool.end();
      console.log('🔌 PostgreSQL pool drained.');
    } catch {
      // ignore
    }
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
