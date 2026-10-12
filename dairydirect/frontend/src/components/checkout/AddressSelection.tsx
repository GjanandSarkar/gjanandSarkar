"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Plus, Clock, Edit3 } from 'lucide-react';
import type { UserAddress, CreateAddressInput } from '@/lib/api/addresses';
import { saveAddressAPI, updateAddressAPI } from '@/lib/api/addresses';
import { AddressFormModal } from '@/components/addresses/AddressFormModal';
import { useStore } from '@/store/useStore';

interface AddressSelectionProps {
  addresses: UserAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  slots: { id: string; time: string; avail: string }[];
  selectedSlot: string;
  onSelectSlot: (id: string) => void;
  onAddressCreated?: (newAddress: UserAddress) => void;
  onAddressUpdated?: (updatedAddress: UserAddress) => void;
}

export function AddressSelection({
  addresses,
  selectedAddressId,
  onSelectAddress,
  slots,
  selectedSlot,
  onSelectSlot,
  onAddressCreated,
  onAddressUpdated,
}: AddressSelectionProps) {
  const user = useStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: UserAddress, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (addressData: CreateAddressInput): Promise<boolean> => {
    if (!user?.id) return false;
    setIsSaving(true);
    try {
      if (editingAddress) {
        const res = await updateAddressAPI(user.id, editingAddress.id, addressData);
        if (res.success && res.data) {
          onAddressUpdated?.(res.data);
          return true;
        }
        return false;
      } else {
        const res = await saveAddressAPI({ ...addressData, userId: user.id });
        if (res.success && res.data) {
          onAddressCreated?.(res.data);
          onSelectAddress(res.data.id);
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error('Error saving address in checkout:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Delivery Address */}
      <div className="bg-white rounded-[20px] p-4 border border-sand shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Delivery Address</h3>
          </div>

          {addresses.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New
            </button>
          )}
        </div>

        {addresses.length === 0 ? (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="w-full p-4 rounded-[16px] border border-dashed border-clay text-clay bg-white hover:bg-clay/5 flex items-center justify-center font-semibold text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Delivery Address
          </button>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;

              return (
                <div
                  key={addr.id}
                  onClick={() => onSelectAddress(addr.id)}
                  className={cn(
                    "p-3.5 rounded-[16px] border transition-all cursor-pointer flex items-start justify-between gap-3",
                    isSelected
                      ? "border-primary bg-mint/10 shadow-sm ring-1 ring-primary/20"
                      : "border-sand bg-white hover:border-sand/80"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="pt-0.5">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                          isSelected ? "border-primary" : "border-sand"
                        )}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-dark text-sm capitalize">{addr.label || addr.address_type}</span>
                        {addr.is_default && (
                          <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">
                            Default
                          </span>
                        )}
                        {addr.full_name && (
                          <span className="text-xs text-muted font-medium">• {addr.full_name}</span>
                        )}
                      </div>

                      <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {[
                          addr.flat_house_building,
                          addr.area_street_sector_village,
                          addr.town_city,
                          addr.pincode
                        ].filter(Boolean).join(', ') || addr.address}
                      </p>

                      {addr.mobile_number && (
                        <p className="text-[11px] text-muted/80 mt-0.5">Phone: +91 {addr.mobile_number}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(addr, e)}
                    className="p-1.5 text-muted hover:text-primary hover:bg-white rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Edit address"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delivery Slot */}
      {addresses.length > 0 && (
        <div className="bg-white rounded-[20px] p-4 border border-sand shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Delivery Slot</h3>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                onClick={() => onSelectSlot(slot.id)}
                className={cn(
                  "p-3 rounded-[12px] border transition-all cursor-pointer flex justify-between items-center",
                  selectedSlot === slot.id
                    ? "border-primary bg-primary text-white shadow-active"
                    : "border-sand bg-white text-dark hover:border-primary/30"
                )}
              >
                <span className="font-bold text-xs tracking-wide">{slot.time}</span>
                <span
                  className={cn(
                    "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                    selectedSlot === slot.id ? "bg-white/20" : "bg-mint/30 text-primary"
                  )}
                >
                  {slot.avail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Address Form Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialData={editingAddress}
        isSaving={isSaving}
      />
    </div>
  );
}
