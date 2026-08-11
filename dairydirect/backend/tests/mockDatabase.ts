import { QueryResult, QueryResultRow } from 'pg';
import { setMockQueryHandler } from '../src/config/database';

export function setupMockDatabase(): void {
  const store = {
    profiles: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        phone: '9876543210',
        email: 'customer@gjanandsarkar.com',
        name: 'Ravi Patel',
        role: 'customer',
        loyalty_points: 100,
        referral_code: 'RAVI1234',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '99999999-9999-9999-9999-999999999999',
        phone: '+919000000001',
        email: 'admin@gjanandsarkar.com',
        name: 'Admin User',
        role: 'admin',
        loyalty_points: 0,
        referral_code: 'ADMIN99',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    user_addresses: [
      {
        id: 'a1111111-1111-1111-1111-111111111111',
        user_id: '11111111-1111-1111-1111-111111111111',
        label: 'Home',
        address: '14 Shyamal Cross Road, Satellite',
        apartment: 'B-402',
        pincode: '380015',
        city: 'Ahmedabad',
        state: 'Gujarat',
        lat: 23.0225,
        lng: 72.5714,
        is_default: true,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    otp_store: [] as any[],
    products: [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'A2 Gir Cow Milk',
        category: 'Milk',
        description: 'Farm-fresh raw whole milk',
        image_url: 'https://example.com/milk.jpg',
        is_active: true,
        is_freshness_guarantee: true,
        state_origin: 'Gujarat',
        brand: 'Gjanand Farm',
        rating: 4.9,
        reviews_count: 120,
        is_deal_of_the_day: false,
        discount_pct: 0,
        tags: ['Pure', 'Organic'],
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    product_variants: [
      {
        id: 'b0000000-0000-0000-0000-000000000001',
        product_id: 'a0000000-0000-0000-0000-000000000001',
        weight: '1 Litre',
        price: 80.0,
        original_price: 90.0,
        cost_price: 60.0,
        stock: 100,
        low_stock_threshold: 10,
        is_active: true,
      },
    ],
    cart_items: [] as any[],
    orders: [
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        order_number: 'ORD-TEST1234',
        user_id: '11111111-1111-1111-1111-111111111111',
        status: 'delivered',
        subtotal: 160.0,
        delivery_fee: 0.0,
        discount_amount: 0.0,
        total_amount: 160.0,
        payment_method: 'COD',
        payment_status: 'paid',
        loyalty_earned: 160,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    order_items: [
      {
        id: 'd0000000-0000-0000-0000-000000000001',
        order_id: 'c0000000-0000-0000-0000-000000000001',
        product_id: 'a0000000-0000-0000-0000-000000000001',
        variant_id: 'b0000000-0000-0000-0000-000000000001',
        product_name: 'A2 Gir Cow Milk',
        variant_weight: '1 Litre',
        quantity: 2,
        price: 80.0,
        cost_price: 60.0,
        created_at: new Date().toISOString(),
      },
    ],
    subscriptions: [
      {
        id: 'e0000000-0000-0000-0000-000000000001',
        user_id: '11111111-1111-1111-1111-111111111111',
        product_id: 'a0000000-0000-0000-0000-000000000001',
        variant_id: 'b0000000-0000-0000-0000-000000000001',
        volume: 2,
        plan: 'daily',
        delivery_slot: 'Early Morning (5:00 AM - 7:00 AM)',
        status: 'active',
        start_date: '2026-08-01',
        next_delivery_date: '2026-08-10',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    coupons: [
      {
        id: 'f0000000-0000-0000-0000-000000000001',
        code: 'FRESH10',
        type: 'percentage',
        value: 10,
        min_order_value: 100,
        max_discount: 50,
        max_uses: 1000,
        used_count: 5,
        is_active: true,
        expiry_date: '2028-12-31T23:59:59Z',
        created_at: new Date().toISOString(),
      },
    ],
    return_requests: [
      {
        id: '10000000-0000-0000-0000-000000000001',
        order_id: 'c0000000-0000-0000-0000-000000000001',
        user_id: '11111111-1111-1111-1111-111111111111',
        reason: 'Packaging Damaged',
        description: 'Bottle was cracked on arrival',
        images: ['https://example.com/dmg.jpg'],
        status: 'pending',
        refund_amount: 160.0,
        admin_notes: null,
        created_at: new Date().toISOString(),
        resolved_at: null,
      },
    ],
    sellers: [
      {
        id: '20000000-0000-0000-0000-000000000001',
        user_id: '11111111-1111-1111-1111-111111111111',
        store_name: 'Gjanand Organic Farm',
        slug: 'gjanand-organic-farm',
        state: 'Gujarat',
        category: 'A2 Organic Dairy',
        description: 'Direct from dairy farms in Banaskantha',
        plan: 'growth',
        commission_rate: 5.0,
        status: 'active',
        gstin: '24ABCDE1234F1Z5',
        total_sales: 154000.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    seller_inquiries: [
      {
        id: '30000000-0000-0000-0000-000000000001',
        user_id: '11111111-1111-1111-1111-111111111111',
        full_name: 'Mukesh Patel',
        business_name: 'Patan Dairy Works',
        phone: '9898989898',
        email: 'mukesh@patandairy.com',
        city: 'Patan',
        state: 'Gujarat',
        category: 'A2 Dairy & Ghee',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    notifications: [
      {
        id: '40000000-0000-0000-0000-000000000001',
        user_id: '11111111-1111-1111-1111-111111111111',
        role_target: 'customer',
        title: 'Order Confirmed',
        message: 'Your order #ORD-TEST1234 has been confirmed.',
        type: 'order',
        related_id: 'c0000000-0000-0000-0000-000000000001',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ],
    reviews: [
      {
        id: '50000000-0000-0000-0000-000000000001',
        product_id: 'a0000000-0000-0000-0000-000000000001',
        user_id: '11111111-1111-1111-1111-111111111111',
        user_name: 'Ravi Patel',
        rating: 5,
        title: 'Authentic pure taste',
        comment: 'Best Gir cow milk in Gujarat!',
        state_origin: 'Gujarat',
        is_verified_buyer: true,
        helpful_count: 12,
        created_at: new Date().toISOString(),
      },
    ],
    wishlists: [
      {
        id: '60000000-0000-0000-0000-000000000001',
        user_id: '11111111-1111-1111-1111-111111111111',
        product_id: 'a0000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
      },
    ],
    delivery_slots: [
      {
        id: '70000000-0000-0000-0000-000000000001',
        slot_name: 'Early Morning (5:00 AM - 7:00 AM)',
        start_time: '05:00:00',
        end_time: '07:00:00',
        max_orders_capacity: 100,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ],
    translations: [
      { language: 'en', key: 'welcome', value: 'Welcome to DairyDirect' },
      { language: 'gu', key: 'welcome', value: 'ડેરીડાયરેક્ટમાં આપનું સ્વાગત છે' },
    ],
    business_settings: {
      id: '00000000-0000-0000-0000-000000000001',
      min_order_value: 50.0,
      standard_delivery_fee: 25.0,
      delivery_cost: 25.0,
      free_delivery_threshold: 299.0,
      min_profit_margin_percent: 20.0,
      max_discount_percent: 30.0,
      freshness_guarantee_hours: 24,
      is_store_open: true,
      support_phone: '+91 98765 43210',
      support_email: 'care@gjanandsarkar.com',
      razorpay_enabled: true,
      cod_enabled: true,
      gst_rate_percent: 0.0,
      updated_at: new Date().toISOString(),
    },
  };

  setMockQueryHandler(async <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
    const q = text.trim();

    // 1. Business settings
    if (q.includes('FROM business_settings')) {
      return { rows: [store.business_settings as any], rowCount: 1 } as QueryResult<T>;
    }
    if (q.startsWith('UPDATE business_settings')) {
      return { rows: [store.business_settings as any], rowCount: 1 } as QueryResult<T>;
    }

    // 2. OTP Store
    if (q.startsWith('INSERT INTO otp_store')) {
      const rec = {
        id: `80000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`,
        phone: params?.[0],
        otp: params?.[1],
        expires_at: params?.[2],
        verified: false,
      };
      store.otp_store.push(rec);
      return { rows: [rec as any], rowCount: 1 } as QueryResult<T>;
    }
    if (q.includes('FROM otp_store')) {
      const phone = params?.[0];
      const otp = params?.[1];
      const found = store.otp_store.find((o) => o.phone === phone && o.otp === otp) || {
        id: '80000000-0000-0000-0000-000000000001',
        phone,
        otp,
        verified: false,
      };
      return { rows: [found as any], rowCount: 1 } as QueryResult<T>;
    }

    // 3. Profiles
    if (q.includes('FROM profiles WHERE phone = $1')) {
      const phone = params?.[0];
      const found = store.profiles.find((p) => p.phone === phone);
      return { rows: found ? [found as any] : [], rowCount: found ? 1 : 0 } as QueryResult<T>;
    }
    if (q.includes('FROM profiles WHERE id = $1')) {
      const id = params?.[0];
      const found = store.profiles.find((p) => p.id === id);
      return { rows: found ? [found as any] : [], rowCount: found ? 1 : 0 } as QueryResult<T>;
    }
    if (q.includes('FROM profiles WHERE LOWER(email) = LOWER($1)')) {
      const email = params?.[0];
      const found = store.profiles.find((p) => p.email?.toLowerCase() === email?.toLowerCase());
      return { rows: found ? [found as any] : [], rowCount: found ? 1 : 0 } as QueryResult<T>;
    }
    if (q.startsWith('INSERT INTO profiles')) {
      const newProfile = {
        id: params?.[0] || '11111111-1111-1111-1111-111111111111',
        phone: params?.[1] || null,
        email: params?.[2] || null,
        name: params?.[3] || 'Customer',
        avatar_url: params?.[4] || null,
        role: params?.[5] || 'customer',
        loyalty_points: 0,
        referral_code: `REF_${Date.now().toString().slice(-4)}`,
        referred_by: params?.[6] || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.profiles.push(newProfile);
      return { rows: [newProfile as any], rowCount: 1 } as QueryResult<T>;
    }
    if (q.startsWith('UPDATE profiles')) {
      const id = params?.[params.length - 1];
      let p = store.profiles.find((item) => item.id === id) || store.profiles[0];
      if (p && params && params.length >= 2) {
        p.role = params[0] || p.role;
      }
      return { rows: [p as any], rowCount: 1 } as QueryResult<T>;
    }
    if (q.includes('SELECT COUNT(*) FROM profiles')) {
      return { rows: [{ count: store.profiles.length.toString() } as any], rowCount: 1 } as QueryResult<T>;
    }
    if (q.includes('SELECT * FROM profiles')) {
      return { rows: store.profiles as any, rowCount: store.profiles.length } as QueryResult<T>;
    }

    // 4. Addresses
    if (q.includes('FROM user_addresses WHERE id = $1')) {
      const id = params?.[0];
      const found = store.user_addresses.find((a) => a.id === id);
      return { rows: found ? [found as any] : [], rowCount: found ? 1 : 0 } as QueryResult<T>;
    }
    if (q.includes('FROM user_addresses WHERE user_id = $1')) {
      return { rows: store.user_addresses as any, rowCount: store.user_addresses.length } as QueryResult<T>;
    }
    if (q.startsWith('INSERT INTO user_addresses')) {
      const newAddr = {
        id: `a1111111-1111-1111-1111-111111111112`,
        user_id: params?.[0],
        label: params?.[1],
        address: params?.[2],
        apartment: params?.[3] || null,
        pincode: params?.[4] || null,
        city: params?.[5] || 'Ahmedabad',
        state: params?.[6] || 'Gujarat',
        lat: params?.[7] || null,
        lng: params?.[8] || null,
        is_default: Boolean(params?.[9]),
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.user_addresses.push(newAddr);
      return { rows: [newAddr as any], rowCount: 1 } as QueryResult<T>;
    }

    // 5. Products & Variants
    if (q.includes('SELECT COUNT(*) FROM products')) {
      return { rows: [{ count: store.products.length.toString() } as any], rowCount: 1 } as QueryResult<T>;
    }
    if (q.includes('FROM products p WHERE p.id = $1') || q.includes('FROM products p')) {
      const mapped = store.products.map((p) => ({
        ...p,
        variants: store.product_variants.filter((v) => v.product_id === p.id),
      }));
      return { rows: mapped as any, rowCount: mapped.length } as QueryResult<T>;
    }
    if (q.includes('FROM product_variants pv WHERE pv.id = $1') || q.includes('FROM product_variants pv')) {
      const varId = params?.[0];
      const v = store.product_variants.find((item) => item.id === varId);
      if (v) {
        return {
          rows: [{ ...v, product_name: 'A2 Gir Cow Milk', product_active: true } as any],
          rowCount: 1,
        } as QueryResult<T>;
      }
      return { rows: [], rowCount: 0 } as QueryResult<T>;
    }
    if (q.includes('SELECT COUNT(*) FROM product_variants WHERE stock <= low_stock_threshold')) {
      return { rows: [{ count: '2' } as any], rowCount: 1 } as QueryResult<T>;
    }

    // 6. Cart Items
    if (q.includes('FROM cart_items ci')) {
      return {
        rows: [
          {
            id: 'd1111111-1111-1111-1111-111111111111',
            user_id: '11111111-1111-1111-1111-111111111111',
            product_id: 'a0000000-0000-0000-0000-000000000001',
            variant_id: 'b0000000-0000-0000-0000-000000000001',
            quantity: 2,
            product_name: 'A2 Gir Cow Milk',
            category: 'Milk',
            image_url: 'https://example.com/milk.jpg',
            variant_weight: '1 Litre',
            price: 80.0,
            stock: 100,
          } as any,
        ],
        rowCount: 1,
      } as QueryResult<T>;
    }

    // 7. Orders & Order Items
    if (q.includes('FROM orders o WHERE o.id = $1')) {
      const order = { ...store.orders[0], items: store.order_items };
      return { rows: [order as any], rowCount: 1 } as QueryResult<T>;
    }
    if (q.includes('SELECT COUNT(*) AS total_orders') || q.includes('SELECT COUNT(*) FROM orders')) {
      return {
        rows: [
          {
            total_orders: '10',
            delivered_orders: '8',
            pending_orders: '2',
            total_revenue: '2540.00',
            count: '10',
          } as any,
        ],
        rowCount: 1,
      } as QueryResult<T>;
    }
    if (q.includes('FROM orders o')) {
      return { rows: store.orders as any, rowCount: store.orders.length } as QueryResult<T>;
    }
    if (q.startsWith('INSERT INTO orders')) {
      const newOrder = {
        ...store.orders[0],
        id: 'c0000000-0000-0000-0000-000000000001',
        order_number: params?.[0] || 'ORD-NEW001',
      };
      return { rows: [newOrder as any], rowCount: 1 } as QueryResult<T>;
    }
    if (q.startsWith('INSERT INTO order_items')) {
      return { rows: [store.order_items[0] as any], rowCount: 1 } as QueryResult<T>;
    }
    if (q.startsWith('UPDATE orders')) {
      const updatedOrder = {
        ...store.orders[0],
        payment_status: 'paid',
        status: 'confirmed',
      };
      return { rows: [updatedOrder as any], rowCount: 1 } as QueryResult<T>;
    }

    // 8. Subscriptions
    if (q.includes('FROM subscriptions s WHERE s.id = $1') || q.includes('FROM subscriptions s')) {
      return {
        rows: store.subscriptions.map((s) => ({
          ...s,
          product_name: 'A2 Gir Cow Milk',
          product_image: 'https://example.com/milk.jpg',
          variant_weight: '1 Litre',
          price: 80.0,
          user_name: 'Ravi Patel',
          user_phone: '9876543210',
          active_subs: '15',
          mrr: '36000.00',
        })) as any,
        rowCount: store.subscriptions.length,
      } as QueryResult<T>;
    }
    if (q.startsWith('INSERT INTO subscriptions')) {
      const newSub = {
        ...store.subscriptions[0],
        id: 'e0000000-0000-0000-0000-000000000001',
      };
      return { rows: [newSub as any], rowCount: 1 } as QueryResult<T>;
    }

    // 9. Coupons
    if (q.includes('FROM coupons WHERE UPPER(code) = UPPER($1)')) {
      const code = params?.[0];
      const coupon = store.coupons.find((c) => c.code.toUpperCase() === code?.toUpperCase());
      return { rows: coupon ? [coupon as any] : [], rowCount: coupon ? 1 : 0 } as QueryResult<T>;
    }
    if (q.includes('FROM coupons')) {
      return { rows: store.coupons as any, rowCount: store.coupons.length } as QueryResult<T>;
    }

    // 10. Returns
    if (q.includes('FROM return_requests')) {
      return { rows: store.return_requests as any, rowCount: store.return_requests.length } as QueryResult<T>;
    }
    if (q.startsWith('INSERT INTO return_requests')) {
      const newRet = {
        ...store.return_requests[0],
        id: '10000000-0000-0000-0000-000000000001',
      };
      return { rows: [newRet as any], rowCount: 1 } as QueryResult<T>;
    }

    // 11. Sellers & Inquiries
    if (q.includes('FROM sellers')) {
      return { rows: store.sellers as any, rowCount: store.sellers.length } as QueryResult<T>;
    }
    if (q.includes('FROM seller_inquiries')) {
      return { rows: store.seller_inquiries as any, rowCount: store.seller_inquiries.length } as QueryResult<T>;
    }
    if (q.startsWith('INSERT INTO seller_inquiries')) {
      const inq = { ...store.seller_inquiries[0], id: '30000000-0000-0000-0000-000000000001' };
      return { rows: [inq as any], rowCount: 1 } as QueryResult<T>;
    }

    // 12. Delivery Slots
    if (q.includes('FROM delivery_slots')) {
      return { rows: store.delivery_slots as any, rowCount: store.delivery_slots.length } as QueryResult<T>;
    }

    // 13. Notifications
    if (q.includes('FROM notifications')) {
      return { rows: store.notifications as any, rowCount: store.notifications.length } as QueryResult<T>;
    }
    if (q.startsWith('INSERT INTO notifications')) {
      const notif = { ...store.notifications[0], id: '40000000-0000-0000-0000-000000000001' };
      return { rows: [notif as any], rowCount: 1 } as QueryResult<T>;
    }

    // 14. Reviews
    if (q.includes('FROM reviews')) {
      return { rows: store.reviews as any, rowCount: store.reviews.length } as QueryResult<T>;
    }
    if (q.startsWith('INSERT INTO reviews')) {
      const rev = { ...store.reviews[0], id: '50000000-0000-0000-0000-000000000001' };
      return { rows: [rev as any], rowCount: 1 } as QueryResult<T>;
    }

    // 15. Wishlists
    if (q.includes('FROM wishlists')) {
      return { rows: store.wishlists as any, rowCount: store.wishlists.length } as QueryResult<T>;
    }

    // 16. Translations
    if (q.includes('FROM translations')) {
      return { rows: store.translations as any, rowCount: store.translations.length } as QueryResult<T>;
    }

    // 17. Reports by day
    if (q.includes('TO_CHAR(DATE_TRUNC') || q.includes('DATE_TRUNC')) {
      return {
        rows: [
          {
            date: '2026-08-01',
            orders_count: '5',
            revenue: '1200.00',
            avg_order_value: '240.00',
          } as any,
          {
            date: '2026-08-02',
            orders_count: '8',
            revenue: '1850.00',
            avg_order_value: '231.25',
          } as any,
        ],
        rowCount: 2,
      } as QueryResult<T>;
    }

    // Generic fallback
    return { rows: [] as any, rowCount: 1 } as QueryResult<T>;
  });
}
