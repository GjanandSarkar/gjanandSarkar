import { z } from 'zod';

export const createSellerSchema = z.object({
  body: z.object({
    storeName: z.string().min(2, 'Store name is required'),
    slug: z.string().min(2, 'Slug is required'),
    state: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    plan: z.enum(['starter', 'growth', 'enterprise']).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    fssaiNumber: z.string().optional(),
  }),
});

export const submitInquirySchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    businessName: z.string().min(2, 'Business name is required'),
    phone: z.string().trim().regex(/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit mobile number.'),
    email: z.string().email().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    category: z.string().optional(),
    productRange: z.string().optional(),
    monthlyVolume: z.string().optional(),
    gstin: z.string().optional(),
    fssaiNumber: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateInquirySchema = z.object({
  body: z.object({
    inquiryId: z.string().uuid().optional(),
    id: z.string().uuid().optional(),
    status: z.enum(['pending', 'contacted', 'approved', 'rejected']),
    adminNotes: z.string().optional(),
  }),
});
