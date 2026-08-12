import http from 'http';
import { createApp } from '../../src/app';
import { signAccessToken } from '../../src/utils/jwt';

let server: http.Server;
let baseUrl: string;

function makeRequest(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const method = options.method || 'GET';
    const bodyStr = options.body ? JSON.stringify(options.body) : undefined;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let data: any = rawData;
          try {
            data = JSON.parse(rawData);
          } catch {
            // Raw text (e.g. CSV)
          }
          resolve({
            status: res.statusCode || 500,
            data,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', reject);

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

export async function runE2ETests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Setup server on ephemeral port
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}`;
      resolve();
    });
  });

  const customerToken = signAccessToken({
    userId: '11111111-1111-1111-1111-111111111111',
    role: 'customer',
    phone: '9876543210',
    name: 'Ravi Patel',
  });

  const adminToken = signAccessToken({
    userId: '99999999-9999-9999-9999-999999999999',
    role: 'admin',
    email: 'admin@gjanandsarkar.com',
    name: 'Admin User',
  });

  try {
    // ─── 1. Health & Root ─────────────────────────────────────────
    try {
      const res = await makeRequest('/health');
      if (res.status !== 200 || res.data.status !== 'ok') {
        throw new Error(`Expected 200 ok, got ${res.status}`);
      }
      results.push({ name: 'HTTP E2E: GET /health', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /health', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/health');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/health', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/health', passed: false, error: err.message });
    }

    // ─── 2. Auth Endpoints ────────────────────────────────────────
    try {
      const res = await makeRequest('/api/auth/send-otp', {
        method: 'POST',
        body: { phone: '9876543210' },
      });
      if (res.status !== 200 || !res.data.success) throw new Error(`Expected 200 success, got ${res.status}`);
      results.push({ name: 'HTTP E2E: POST /api/auth/send-otp', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/auth/send-otp', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: { phone: '9876543210', otp: '123456' },
      });
      if (res.status !== 200 || !res.data.token) throw new Error(`Expected 200 with JWT, got ${res.status}`);
      results.push({ name: 'HTTP E2E: POST /api/auth/verify-otp', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/auth/verify-otp', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/auth/session', {
        method: 'GET',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (res.status !== 200 || !res.data.user) throw new Error(`Expected 200 with user session, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/auth/session', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/auth/session', passed: false, error: err.message });
    }

    // ─── 3. Products Catalog ──────────────────────────────────────
    try {
      const res = await makeRequest('/api/products?category=Milk&activeOnly=true');
      if (res.status !== 200 || !Array.isArray(res.data.products)) throw new Error(`Expected 200 products, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/products (filter category & active)', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/products (filter category & active)', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/products/a0000000-0000-0000-0000-000000000001');
      if (res.status !== 200 || !res.data.product) throw new Error(`Expected 200 product detail, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/products/:id', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/products/:id', passed: false, error: err.message });
    }

    // ─── 4. Cart Endpoints ────────────────────────────────────────
    try {
      const res = await makeRequest('/api/cart', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.cart)) throw new Error(`Expected 200 cart array, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/cart', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/cart', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/cart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          productId: 'a0000000-0000-0000-0000-000000000001',
          variantId: 'b0000000-0000-0000-0000-000000000001',
          quantity: 2,
        },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      results.push({ name: 'HTTP E2E: POST /api/cart (add item)', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/cart (add item)', passed: false, error: err.message });
    }

    // ─── 5. Orders & Placement ────────────────────────────────────
    try {
      const res = await makeRequest('/api/orders/place', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          orderData: {
            addressId: 'a1111111-1111-1111-1111-111111111111',
            shippingAddress: '14 Shyamal Cross Road, Satellite, Ahmedabad',
            paymentMethod: 'COD',
            items: [{ variantId: 'b0000000-0000-0000-0000-000000000001', quantity: 2 }],
          },
        },
      });
      if (res.status !== 201 || !res.data.orderId) throw new Error(`Expected 201 order placed, got ${res.status}`);
      results.push({ name: 'HTTP E2E: POST /api/orders/place (atomic placement)', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/orders/place (atomic placement)', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/orders', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.orders)) throw new Error(`Expected 200 orders list, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/orders', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/orders', passed: false, error: err.message });
    }

    // ─── 6. Payments (Razorpay) ───────────────────────────────────
    try {
      const res = await makeRequest('/api/create-order', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: { orderId: 'c0000000-0000-0000-0000-000000000001' },
      });
      if (res.status !== 200 || !res.data.razorpayOrderId) throw new Error(`Expected 200 with razorpayOrderId, got ${res.status}`);
      results.push({ name: 'HTTP E2E: POST /api/create-order', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/create-order', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/verify-payment', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          razorpayOrderId: 'order_mock_123',
          razorpayPaymentId: 'pay_mock_456',
          razorpaySignature: 'mock_sig_valid',
          orderId: 'c0000000-0000-0000-0000-000000000001',
        },
      });
      if (res.status !== 200 || !res.data.success) throw new Error(`Expected 200 payment verified, got ${res.status}`);
      results.push({ name: 'HTTP E2E: POST /api/verify-payment', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/verify-payment', passed: false, error: err.message });
    }

    // ─── 7. Subscriptions ─────────────────────────────────────────
    try {
      const res = await makeRequest('/api/subscriptions', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.subscriptions)) throw new Error(`Expected 200 subscriptions, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/subscriptions', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/subscriptions', passed: false, error: err.message });
    }

    // ─── 8. Addresses ─────────────────────────────────────────────
    try {
      const res = await makeRequest('/api/addresses', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.addresses)) throw new Error(`Expected 200 addresses, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/addresses', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/addresses', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/addresses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          label: 'Office',
          address: 'Palanpur GIDC, Banaskantha',
          isDefault: false,
        },
      });
      if (res.status !== 201 || !res.data.address) throw new Error(`Expected 201 address created, got ${res.status}`);
      results.push({ name: 'HTTP E2E: POST /api/addresses', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/addresses', passed: false, error: err.message });
    }

    // ─── 9. Coupons ───────────────────────────────────────────────
    try {
      const res = await makeRequest('/api/coupons/validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: { code: 'FRESH10', subtotal: 200 },
      });
      if (res.status !== 200 || !res.data.valid) throw new Error(`Expected 200 coupon valid, got ${res.status}`);
      results.push({ name: 'HTTP E2E: POST /api/coupons/validate', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/coupons/validate', passed: false, error: err.message });
    }

    // ─── 10. Sellers & Marketplace ────────────────────────────────
    try {
      const res = await makeRequest('/api/sellers');
      if (res.status !== 200 || !Array.isArray(res.data.sellers)) throw new Error(`Expected 200 sellers, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/sellers', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/sellers', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/sellers/inquiries', {
        method: 'POST',
        body: {
          fullName: 'Suresh Bhai',
          businessName: 'Surya Dairy',
          phone: '9876543219',
          city: 'Deesa',
          category: 'A2 Dairy & Ghee',
        },
      });
      if (res.status !== 201 || !res.data.inquiry) throw new Error(`Expected 201 inquiry submitted, got ${res.status}`);
      results.push({ name: 'HTTP E2E: POST /api/sellers/inquiries', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/sellers/inquiries', passed: false, error: err.message });
    }

    // ─── 11. Freshness Guarantee Returns ──────────────────────────
    try {
      const res = await makeRequest('/api/returns', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.returns)) throw new Error(`Expected 200 returns list, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/returns', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/returns', passed: false, error: err.message });
    }

    // ─── 12. Admin Suite ──────────────────────────────────────────
    try {
      const res = await makeRequest('/api/admin/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !res.data.stats) throw new Error(`Expected 200 stats, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/admin/stats (Admin only)', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/admin/stats (Admin only)', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/admin/reports?period=daily', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.reports)) throw new Error(`Expected 200 reports, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/admin/reports', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/admin/reports', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/admin/inventory', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.inventory)) throw new Error(`Expected 200 inventory, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/admin/inventory', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/admin/inventory', passed: false, error: err.message });
    }

    try {
      const res = await makeRequest('/api/admin/settings', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !res.data.settings) throw new Error(`Expected 200 settings, got ${res.status}`);
      results.push({ name: 'HTTP E2E: GET /api/admin/settings', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/admin/settings', passed: false, error: err.message });
    }

    // ─── 12b. ImageKit Upload Endpoints E2E Tests ─────────────────
    try {
      const res = await makeRequest('/api/upload/auth');
      if (res.status !== 200 || !res.data.token) {
        throw new Error(`Expected 200 with token, got ${res.status}`);
      }
      results.push({ name: 'HTTP E2E: GET /api/upload/auth', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: GET /api/upload/auth', passed: false, error: err.message });
    }

    try {
      const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = await makeRequest('/api/upload/image', {
        method: 'POST',
        body: { image: dummyBase64, fileName: 'e2e_test_image.png', folder: '/test' },
      });
      if (res.status !== 201 || !res.data.url) {
        throw new Error(`Expected 201 with url, got ${res.status}`);
      }
      results.push({ name: 'HTTP E2E: POST /api/upload/image (JSON Base64)', passed: true });
    } catch (err: any) {
      results.push({ name: 'HTTP E2E: POST /api/upload/image (JSON Base64)', passed: false, error: err.message });
    }


    // ─── 13. Security & RBAC Protection Tests ─────────────────────
    try {
      // Non-admin customer attempting to access /api/admin/stats
      const res = await makeRequest('/api/admin/stats', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      results.push({ name: 'Security RBAC: Customer blocked from /api/admin/stats with 403 Forbidden', passed: true });
    } catch (err: any) {
      results.push({ name: 'Security RBAC: Customer blocked from /api/admin/stats with 403 Forbidden', passed: false, error: err.message });
    }

    try {
      // Unauthenticated request to /api/admin/stats
      const res = await makeRequest('/api/admin/stats');
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      results.push({ name: 'Security RBAC: Unauthenticated access blocked with 401 Unauthorized', passed: true });
    } catch (err: any) {
      results.push({ name: 'Security RBAC: Unauthenticated access blocked with 401 Unauthorized', passed: false, error: err.message });
    }

    try {
      // Invalid input triggering Zod 400 validation error
      const res = await makeRequest('/api/auth/send-otp', {
        method: 'POST',
        body: { phone: '123' }, // Invalid phone (<10 digits)
      });
      if (res.status !== 400 || res.data.error?.code !== 'VALIDATION_ERROR') {
        throw new Error(`Expected 400 VALIDATION_ERROR, got ${res.status}`);
      }
      results.push({ name: 'Security Validation: Invalid request payload returns 400 VALIDATION_ERROR', passed: true });
    } catch (err: any) {
      results.push({ name: 'Security Validation: Invalid request payload returns 400 VALIDATION_ERROR', passed: false, error: err.message });
    }

    try {
      // Non-existent route triggering 404
      const res = await makeRequest('/api/non-existent-endpoint-xyz');
      if (res.status !== 404) throw new Error(`Expected 404 Not Found, got ${res.status}`);
      results.push({ name: 'Security Routing: Non-existent route returns 404 Not Found', passed: true });
    } catch (err: any) {
      results.push({ name: 'Security Routing: Non-existent route returns 404 Not Found', passed: false, error: err.message });
    }
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  return results;
}
