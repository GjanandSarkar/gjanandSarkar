// scripts/audit_verification_test.js
/**
 * Audit Verification Test Script
 *
 * This script performs the following steps against the staging environment:
 * 1. Resolve a real admin user from the Supabase admin client.
 * 2. Generate a valid admin access JWT using the project's JWT helper.
 * 3. Create a temporary product via the public API using a **valid** payload.
 * 4. Verify the product exists in the database.
 * 5. Verify a matching audit_log entry was written (actor, action, resource).
 * 6. Perform an unauthorized‑audit‑write check.
 * 7. Clean up the temporary product.
 * 8. Verify audit‑log retention according to the actual DB policy.
 * 9. Output a structured JSON report with PASS/FAIL for each check.
 *
 * The script loads the project's TypeScript helpers via ts-node registration
 * (so that .ts files can be required directly). It also dynamically discovers
 * the source root (`frontend/src` or `src`). No secrets are logged.
 */

const path = require('path');
const fetch = require('node-fetch'); // Node >=18 has global fetch, keep for compatibility

// Load environment variables from the project's .env files
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

// Resolve project root (assumes this script lives in <repo>/frontend/scripts)
const repoRoot = path.resolve(__dirname, '..', '..');

// Register ts-node so we can require .ts modules directly
require('ts-node').register({ transpileOnly: true, project: path.join(repoRoot, 'tsconfig.json') });
let srcRoot = path.join(repoRoot, 'frontend', 'src');
// If that directory does not exist, fall back to a top‑level src folder
if (!require('fs').existsSync(srcRoot)) {
  srcRoot = path.join(repoRoot, 'src');
}

// Import project's helpers using absolute paths
// eslint-disable-next-line import/no-dynamic-require
const { signAccessToken } = require(path.join(srcRoot, 'lib', 'auth', 'jwt'));
// eslint-disable-next-line import/no-dynamic-require
const { getAdminSupabase } = require(path.join(srcRoot, 'lib', 'supabase', 'admin'));

function createResult() {
  return {
    checks: {
      env_validation: 'FAIL',
      admin_resolution: 'FAIL',
      jwt_auth_flow: 'FAIL',
      product_creation: 'FAIL',
      product_db_verification: 'FAIL',
      audit_log_presence: 'FAIL',
      audit_actor_match: 'FAIL',
      audit_action_match: 'FAIL',
      audit_resource_match: 'FAIL',
      unauthorized_audit_access: 'FAIL',
      cleanup: 'FAIL',
      audit_retention: 'FAIL',
    },
    overall: 'FAIL',
    details: {}
  };
}

(async () => {
  const result = createResult();

  // ---------- 1. Environment validation (fail fast) ----------
  const requiredEnv = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      result.details[key] = `Missing required environment variable ${key}`;
    }
  }
  if (Object.keys(result.details).length) {
    result.checks.env_validation = 'FAIL';
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  result.checks.env_validation = 'PASS';

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL.replace(/\/*$/, ''); // strip trailing slash

  // ---------- 2. Resolve real admin user ----------
  const adminSupabase = getAdminSupabase();
  let adminUser;
  try {
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('role', 'admin')
      .limit(1)
      .single();
    if (error || !data) throw error || new Error('No admin user found');
    adminUser = data;
    result.checks.admin_resolution = 'PASS';
  } catch (e) {
    result.details.admin_resolution = `Failed to fetch admin user: ${e.message}`;
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  // ---------- 3. Generate admin access token ----------
  let accessToken;
  try {
    accessToken = await signAccessToken({
      userId: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role // use actual role value from DB
    });
    if (!accessToken) throw new Error('Token generation returned falsy value');
    result.checks.jwt_auth_flow = 'PASS';
  } catch (e) {
    result.details.jwt_auth_flow = `Failed to sign access token: ${e.message}`;
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  // ---------- 4. Create temporary product ----------
  const uniqueSuffix = Date.now();
  // Choose a category that is guaranteed to be valid according to the DB enum
  const validCategory = 'Milk';
  const tempProduct = {
    name: `AuditTestProduct-${uniqueSuffix}`,
    category: validCategory,
    description: 'Temporary product for audit verification',
    // optional fields can be omitted; the API defaults them
  };
  let productId;
  try {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(tempProduct)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    // The API returns { success: true, productId }
    productId = body.productId || body.id || body.data?.id;
    if (!productId) throw new Error('Response missing product ID');
    result.checks.product_creation = 'PASS';
  } catch (e) {
    result.details.product_creation = `Failed to create product: ${e.message}`;
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  // ---------- 5. Verify product exists in DB ----------
  try {
    const { data, error } = await adminSupabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();
    if (error || !data) throw error || new Error('Product not found in DB');
    result.checks.product_db_verification = 'PASS';
  } catch (e) {
    result.details.product_db_verification = `DB verification failed: ${e.message}`;
    // continue – cleanup will still be attempted later
  }

  // ---------- 6. Verify audit_logs entry ----------
  let auditEntry;
  try {
    const { data, error } = await adminSupabase
      .from('audit_logs')
      .select('admin_id, action, entity_type, entity_id, created_at')
      .eq('entity_type', 'product')
      .eq('entity_id', productId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Audit entry not found');
    auditEntry = data;
    result.checks.audit_log_presence = 'PASS';
    // Actor match
    if (auditEntry.admin_id === adminUser.id) {
      result.checks.audit_actor_match = 'PASS';
    } else {
      result.details.audit_actor_match = `admin_id ${auditEntry.admin_id} does not match expected ${adminUser.id}`;
    }
    // Action match – exact string from source code
    if (auditEntry.action === 'product.create') {
      result.checks.audit_action_match = 'PASS';
    } else {
      result.details.audit_action_match = `Unexpected action value: ${auditEntry.action}`;
    }
    // Resource match
    if (auditEntry.entity_id === productId && auditEntry.entity_type === 'product') {
      result.checks.audit_resource_match = 'PASS';
    } else {
      result.details.audit_resource_match = `Resource mismatch: ${auditEntry.entity_type}/${auditEntry.entity_id}`;
    }
  } catch (e) {
    result.details.audit_log_presence = `Failed to query audit_logs: ${e.message}`;
    // subsequent audit checks stay FAIL
  }

  // ---------- 7. Unauthorized audit write check ----------
  try {
    const res = await fetch(`${BASE_URL}/api/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test', entity_type: 'product', entity_id: productId })
    });
    if (res.status === 401 || res.status === 403) {
      result.checks.unauthorized_audit_access = 'PASS';
    } else if (res.status === 404) {
      // No client‑facing endpoint – this is expected for a server‑side only audit write
      result.checks.unauthorized_audit_access = 'PASS';
      result.details.unauthorized_audit_access = 'No client‑facing audit write endpoint (server‑side only)';
    } else {
      result.details.unauthorized_audit_access = `Unexpected status ${res.status}`;
    }
  } catch (e) {
    result.details.unauthorized_audit_access = `Request error: ${e.message}`;
  }

  // ---------- 8. Cleanup temporary product ----------
  try {
    const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    result.checks.cleanup = 'PASS';
  } catch (e) {
    result.details.cleanup = `Failed to delete temporary product: ${e.message}`;
  }

  // ---------- 9. Verify audit retention policy ----------
  try {
    const { data, error } = await adminSupabase
      .from('audit_logs')
      .select('id')
      .eq('entity_type', 'product')
      .eq('entity_id', productId)
      .maybeSingle();
    if (error) throw error;
    const stillExists = !!data;
    // According to the schema, audit_logs.admin_id is SET NULL on delete, but there is no cascade on product deletion.
    // Therefore the audit row should still exist.
    if (stillExists) {
      result.checks.audit_retention = 'PASS';
    } else {
      result.details.audit_retention = 'Audit entry disappeared after product deletion – schema indicates it should be retained.';
    }
  } catch (e) {
    result.details.audit_retention = `Error checking audit retention: ${e.message}`;
  }

  // ---------- 10. Compute overall ----------
  const allPass = Object.values(result.checks).every(v => v === 'PASS');
  result.overall = allPass ? 'PASS' : 'FAIL';

  console.log(JSON.stringify(result, null, 2));
})();
