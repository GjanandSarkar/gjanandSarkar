import { sellerRepository } from '../repositories/sellerRepository';
import { Seller, SellerInquiry, InquiryStatus, SellerStatus } from '../models/seller';
import { NotFoundError, ValidationError } from '../errors/AppError';

export const sellerService = {
  async getSellerByUserId(userId: string): Promise<Seller | null> {
    return sellerRepository.findByUserId(userId);
  },

  async getSellerBySlug(slug: string): Promise<Seller> {
    const seller = await sellerRepository.findBySlug(slug);
    if (!seller) {
      throw new NotFoundError('Seller store not found');
    }
    return seller;
  },

  async listSellers(params: { status?: SellerStatus; limit?: number; offset?: number }): Promise<Seller[]> {
    return sellerRepository.findAll(params);
  },

  async createSellerProfile(data: {
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
    const existing = await sellerRepository.findBySlug(data.slug);
    if (existing) {
      throw new ValidationError('A store with this slug/URL already exists');
    }
    return sellerRepository.create(data);
  },

  async submitInquiry(data: {
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
    return sellerRepository.createInquiry(data);
  },

  async getInquiries(params: { userId?: string; status?: InquiryStatus }): Promise<SellerInquiry[]> {
    return sellerRepository.findInquiries(params);
  },

  async updateInquiryStatus(id: string, status: InquiryStatus, adminNotes?: string): Promise<SellerInquiry> {
    const inquiry = await sellerRepository.updateInquiryStatus(id, status, adminNotes);
    if (!inquiry) {
      throw new NotFoundError('Inquiry not found');
    }
    return inquiry;
  },
};
