"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Check,
  MapPin,
  AlertCircle,
  Loader2,
  Compass,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import {
  type UserAddress,
  type CreateAddressInput,
  getUserAddresses,
  saveAddressAPI,
  updateAddressAPI,
  deleteAddress,
  setDefaultAddressAPI,
} from '@/lib/api/addresses';
import { AddressCard } from '@/components/addresses/AddressCard';
import { AddressFormModal } from '@/components/addresses/AddressFormModal';

export default function SavedAddressesPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isModalSaving, setIsModalSaving] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to get active user ID from store or auth session
  const getActiveUserId = useCallback(async (): Promise<string | null> => {
    if (user?.id) return user.id;
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id ?? null;
    } catch (e) {
      return null;
    }
  }, [user]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      const uid = await getActiveUserId();
      if (!uid) {
        setIsLoading(false);
        return;
      }
      const data = await getUserAddresses(uid);
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getActiveUserId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSetDefault = async (addressId: string) => {
    if (actionLoadingId) return;
    const uid = await getActiveUserId();
    if (!uid) {
      showFeedback('Please log in to manage addresses', 'error');
      return;
    }

    setActionLoadingId(addressId);
    try {
      const res = await setDefaultAddressAPI(uid, addressId);
      if (res.success) {
        setAddresses((prev) =>
          prev
            .map((a) => ({
              ...a,
              is_default: a.id === addressId,
            }))
            .sort((a, b) => (b.id === addressId ? 1 : 0) - (a.id === addressId ? 1 : 0))
        );
        showFeedback('Default delivery address updated');
      } else {
        showFeedback(res.error || 'Failed to update default address', 'error');
      }
    } catch (err: any) {
      showFeedback('An error occurred', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (actionLoadingId) return;
    const uid = await getActiveUserId();
    if (!uid) {
      showFeedback('Please log in to manage addresses', 'error');
      return;
    }

    setActionLoadingId(addressId);
    try {
      const res = await deleteAddress(uid, addressId);
      if (res.success) {
        const remaining = addresses.filter((a) => a.id !== addressId);
        // If the deleted address was default, promote the first remaining
        const wasDefault = addresses.find((a) => a.id === addressId)?.is_default;
        if (wasDefault && remaining.length > 0) {
          remaining[0].is_default = true;
          await setDefaultAddressAPI(uid, remaining[0].id);
        }
        setAddresses(remaining);
        setDeleteConfirmId(null);
        showFeedback('Address removed successfully');
      } else {
        showFeedback(res.error || 'Failed to delete address', 'error');
      }
    } catch (err: any) {
      showFeedback('Failed to delete address', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (addressData: CreateAddressInput): Promise<boolean> => {
    const uid = await getActiveUserId();
    if (!uid) {
      showFeedback('Please log in to save address', 'error');
      return false;
    }

    setIsModalSaving(true);
    try {
      if (editingAddress) {
        const res = await updateAddressAPI(uid, editingAddress.id, addressData);
        if (res.success && res.data) {
          setAddresses((prev) => {
            const updated = prev.map((a) => (a.id === editingAddress.id ? res.data! : addressData.is_default ? { ...a, is_default: false } : a));
            return updated.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
          });
          showFeedback('Address updated successfully');
          return true;
        } else {
          showFeedback(res.error || 'Failed to update address', 'error');
          return false;
        }
      } else {
        const res = await saveAddressAPI({ ...addressData, userId: uid });
        if (res.success && res.data) {
          setAddresses((prev) => {
            const list = res.data!.is_default
              ? [res.data!, ...prev.map((a) => ({ ...a, is_default: false }))]
              : [...prev, res.data!];
            return list.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
          });
          showFeedback('Address added successfully');
          return true;
        } else {
          showFeedback(res.error || 'Failed to save address', 'error');
          return false;
        }
      }
    } catch (err: any) {
      showFeedback(err.message || 'An error occurred while saving', 'error');
      return false;
    } finally {
      setIsModalSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
              aria-label="Back to Profile"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">Saved Addresses</h1>
              <p className="text-xs text-slate-500 mt-1">Manage delivery locations for quick checkout</p>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Feedback Toast */}
      {feedbackMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-800 text-emerald-50 shadow-emerald-950/20'
                : 'bg-rose-800 text-rose-50 shadow-rose-950/20'
            }`}
          >
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Quick Add Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Compass className="w-4 h-4 text-emerald-100" />
              </span>
              <h2 className="font-semibold text-base">Pinpoint Your Exact Delivery Location</h2>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
              Save multiple delivery addresses for your home, office, or relatives to get superfast dairy delivery.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-semibold text-xs rounded-xl shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            Add Address
          </button>
        </div>

        {/* Addresses List Container */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading your saved addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
              <MapPin className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-bold text-slate-800 text-base">No saved addresses yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add your home or office address to start receiving fresh farm-to-table dairy items.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Your Saved Locations ({addresses.length})
              </h2>
              <span className="text-[11px] text-slate-400">
                {addresses.filter((a) => a.is_default).length} active default address
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onEdit={() => handleOpenEdit(addr)}
                  onDelete={() => setDeleteConfirmId(addr.id)}
                  onSetDefault={() => handleSetDefault(addr.id)}
                  isActionLoading={actionLoadingId === addr.id}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Delete this address?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove this delivery address? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Address Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialData={editingAddress}
        isSaving={isModalSaving}
      />
    </div>
  );
}
