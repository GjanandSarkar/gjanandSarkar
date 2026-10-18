"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Plus, Edit3 } from 'lucide-react';
import type { UserAddress, CreateAddressInput } from '@/lib/api/addresses';
import { saveAddressAPI, updateAddressAPI } from '@/lib/api/addresses';
import { AddressFormModal } from '@/components/addresses/AddressFormModal';
import { useStore } from '@/store/useStore';

interface AddressSelectionProps {
  addresses: UserAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  onAddressCreated?: (newAddress: UserAddress) => void;
  onAddressUpdated?: (updatedAddress: UserAddress) => void;
}

export function AddressSelection({
  addresses,
  selectedAddressId,
  onSelectAddress,
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
      <div className="bg-surface rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Delivery Address</h3>
          </div>

          {addresses.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-colors cursor-pointer"
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
            className="w-full p-4 rounded-xl border border-dashed border-border text-foreground hover:border-primary/50 bg-surface-muted/50 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 text-primary" /> Add Delivery Address
          </button>
        ) : (
          <div className="space-y-2.5">
            {addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;

              return (
                <div
                  key={addr.id}
                  onClick={() => onSelectAddress(addr.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-surface hover:border-border/80"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="pt-0.5">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                          isSelected ? "border-primary" : "border-border"
                        )}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-foreground text-xs capitalize">{addr.label || addr.address_type}</span>
                        {addr.is_default && (
                          <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-1.5 py-0.2 rounded">
                            Default
                          </span>
                        )}
                        {addr.full_name && (
                          <span className="text-[11px] text-muted font-medium">• {addr.full_name}</span>
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
                        <p className="text-[11px] text-muted mt-0.5">Phone: +91 {addr.mobile_number}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(addr, e)}
                    className="p-1 text-muted hover:text-foreground transition-colors shrink-0 cursor-pointer"
                    title="Edit address"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
