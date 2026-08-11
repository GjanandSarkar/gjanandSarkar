import { addressRepository } from '../repositories/addressRepository';
import { UserAddress } from '../models/address';
import { NotFoundError } from '../errors/AppError';

export const addressService = {
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    return addressRepository.findByUserId(userId);
  },

  async getAddressById(id: string): Promise<UserAddress> {
    const address = await addressRepository.findById(id);
    if (!address) {
      throw new NotFoundError('Address not found');
    }
    return address;
  },

  async saveAddress(data: {
    userId: string;
    label: string;
    address: string;
    apartment?: string;
    pincode?: string;
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
    isDefault?: boolean;
  }): Promise<UserAddress> {
    return addressRepository.create(data);
  },

  async updateAddress(
    id: string,
    userId: string,
    data: Partial<UserAddress>
  ): Promise<UserAddress> {
    const updated = await addressRepository.update(id, userId, data);
    if (!updated) {
      throw new NotFoundError('Address not found');
    }
    return updated;
  },

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const deleted = await addressRepository.softDelete(id, userId);
    if (!deleted) {
      throw new NotFoundError('Address not found');
    }
    return true;
  },
};
