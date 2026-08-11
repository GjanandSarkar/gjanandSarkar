import { query } from '../config/database';
import { Seller, SellerInquiry, InquiryStatus, SellerStatus } from '../models/seller';

export const sellerRepository = {
  async findByUserId(userId: string): Promise<Seller | null> {
    const res = await query<Seller>('SELECT * FROM sellers WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  },

  async findBySlug(slug: string): Promise<Seller | null> {
    const res = await query<Seller>('SELECT * FROM sellers WHERE slug = $1', [slug]);
    return res.rows[0] || null;
  },

  async findById(id: string): Promise<Seller | null> {
    const res = await query<Seller>('SELECT * FROM sellers WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findAll(params: { status?: SellerStatus; limit?: number; offset?: number }): Promise<Seller[]> {
    const { status, limit = 50, offset = 0 } = params;
    let sql = 'SELECT * FROM sellers';
    const values: any[] = [];
    let idx = 1;

    if (status) {
      sql += ` WHERE status = $${idx++}`;
      values.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);

    const res = await query<Seller>(sql, values);
    return res.rows;
  },

  async create(data: {
    userId?: string;
    storeName: string;
    slug: string;
    state?: string;
    category?: string;
    description?: string;
    plan?: 'starter' | 'growth' | 'enterprise';
    commissionRate?: number;
    gstin?: string;
    pan?: string;
    fssaiNumber?: string;
  }): Promise<Seller> {
    const res = await query<Seller>(
      `INSERT INTO sellers (
        user_id, store_name, slug, state, category, description, plan, commission_rate, gstin, pan, fssai_number
      ) VALUES (
        $1, $2, $3, COALESCE($4, 'Gujarat'), COALESCE($5, 'A2 Organic Dairy'), $6, COALESCE($7, 'growth'),
        COALESCE($8, 5.00), $9, $10, $11
      ) RETURNING *`,
      [
        data.userId || null,
        data.storeName,
        data.slug,
        data.state || 'Gujarat',
        data.category || 'A2 Organic Dairy',
        data.description || null,
        data.plan || 'growth',
        data.commissionRate || 5.0,
        data.gstin || null,
        data.pan || null,
        data.fssaiNumber || null,
      ]
    );
    return res.rows[0];
  },

  // Seller Inquiries
  async createInquiry(data: {
    userId?: string;
    fullName: string;
    businessName: string;
    phone: string;
    email?: string;
    city?: string;
    state?: string;
    category?: string;
    productRange?: string;
    monthlyVolume?: string;
    gstin?: string;
    fssaiNumber?: string;
    notes?: string;
  }): Promise<SellerInquiry> {
    const res = await query<SellerInquiry>(
      `INSERT INTO seller_inquiries (
        user_id, full_name, business_name, phone, email, city, state, category, product_range, monthly_volume, gstin, fssai_number, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, COALESCE($7, 'Gujarat'), COALESCE($8, 'A2 Dairy & Ghee'), $9, $10, $11, $12, $13
      ) RETURNING *`,
      [
        data.userId || null,
        data.fullName,
        data.businessName,
        data.phone,
        data.email || null,
        data.city || null,
        data.state || 'Gujarat',
        data.category || 'A2 Dairy & Ghee',
        data.productRange || null,
        data.monthlyVolume || null,
        data.gstin || null,
        data.fssaiNumber || null,
        data.notes || null,
      ]
    );
    return res.rows[0];
  },

  async findInquiries(params: { userId?: string; status?: InquiryStatus }): Promise<SellerInquiry[]> {
    const { userId, status } = params;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (userId) {
      conditions.push(`user_id = $${idx++}`);
      values.push(userId);
    }
    if (status) {
      conditions.push(`status = $${idx++}`);
      values.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await query<SellerInquiry>(
      `SELECT * FROM seller_inquiries ${where} ORDER BY created_at DESC`,
      values
    );
    return res.rows;
  },

  async updateInquiryStatus(id: string, status: InquiryStatus, adminNotes?: string): Promise<SellerInquiry | null> {
    const res = await query<SellerInquiry>(
      `UPDATE seller_inquiries
       SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [status, adminNotes || null, id]
    );
    return res.rows[0] || null;
  },
};
