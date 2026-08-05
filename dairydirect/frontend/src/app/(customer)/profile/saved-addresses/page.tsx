"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Home, 
  Briefcase, 
  Navigation, 
  Star, 
  Check, 
  MapPin, 
  AlertCircle, 
  Loader2, 
  X,
  Compass,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { 
  UserAddress, 
  getUserAddresses, 
  saveAddressAPI, 
  updateAddressAPI, 
  deleteAddress, 
  setDefaultAddressAPI 
} from '@/lib/api/addresses';
import { 
  getCurrentUserLocation, 
  reverseGeocodeCoords 
} from '@/lib/utils/geolocation';
import OrderTrackingMap from '@/components/shared/OrderTrackingMap';

export default function SavedAddressesPage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [modalLabel, setModalLabel] = useState('Home');
  const [modalCustomLabel, setModalCustomLabel] = useState('');
  const [modalAddress, setModalAddress] = useState('');
  const [modalIsDefault, setModalIsDefault] = useState(false);
  const [modalCoords, setModalCoords] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 });
  const [isLocating, setIsLocating] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
        setAddresses(prev => 
          prev.map(a => ({
            ...a,
            is_default: a.id === addressId
          })).sort((a, b) => (b.id === addressId ? 1 : 0) - (a.id === addressId ? 1 : 0))
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
        const remaining = addresses.filter(a => a.id !== addressId);
        // If the deleted address was default, make the first remaining address default
        const wasDefault = addresses.find(a => a.id === addressId)?.is_default;
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

  // Open Edit Modal
  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    if (['Home', 'Office'].includes(addr.label)) {
      setModalLabel(addr.label);
      setModalCustomLabel('');
    } else {
      setModalLabel('Other');
      setModalCustomLabel(addr.label);
    }
    setModalAddress(addr.address);
    setModalIsDefault(addr.is_default);
    setModalCoords({
      lat: addr.lat ?? 28.6139,
      lng: addr.lng ?? 77.2090
    });
    setModalNotice(null);
    setIsModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAddress(null);
    setModalLabel('Home');
    setModalCustomLabel('');
    setModalAddress('');
    // Default to true only if no addresses exist
    setModalIsDefault(addresses.length === 0);
    setModalCoords({ lat: 28.6139, lng: 77.2090 });
    setModalNotice(null);
    setIsModalOpen(true);
  };

  const handleModalLocationChange = useCallback((newCoords: { lat: number; lng: number }) => {
    setModalCoords(newCoords);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const formatted = await reverseGeocodeCoords(newCoords.lat, newCoords.lng);
      setModalAddress(formatted);
    }, 800);
  }, []);

  const handleModalUseLocation = async () => {
    setIsLocating(true);
    setModalNotice(null);
    try {
      const loc = await getCurrentUserLocation();
      setModalCoords({ lat: loc.lat, lng: loc.lng });
      if (loc.address) {
        setModalAddress(loc.address);
      }
      setModalNotice(loc.source === 'gps' ? 'Location pinpointed via GPS' : 'Approximate location detected via network');
    } catch (err) {
      setModalNotice('Could not detect location. Please enter address manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveModal = async () => {
    const uid = await getActiveUserId();
    if (!uid) {
      alert('Please log in to save addresses.');
      return;
    }
    if (!modalAddress.trim()) {
      alert('Please enter a delivery address.');
      return;
    }

    const finalLabel = modalLabel === 'Other' ? (modalCustomLabel.trim() || 'Other') : modalLabel;
    setIsModalSaving(true);

    try {
      if (editingAddress) {
        // Update existing address
        const res = await updateAddressAPI(uid, editingAddress.id, {
          label: finalLabel,
          address: modalAddress.trim(),
          lat: modalCoords.lat,
          lng: modalCoords.lng,
          isDefault: modalIsDefault
        });

        if (res.success && res.data) {
          setAddresses(prev => {
            const updated = prev.map(a => {
              if (a.id === editingAddress.id) {
                return res.data!;
              }
              return modalIsDefault ? { ...a, is_default: false } : a;
            });
            return updated.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
          });
          showFeedback('Address updated successfully');
          setIsModalOpen(false);
        } else {
          showFeedback(res.error || 'Failed to update address', 'error');
        }
      } else {
        // Create new address
        const res = await saveAddressAPI({
          userId: uid,
          label: finalLabel,
          address: modalAddress.trim(),
          lat: modalCoords.lat,
          lng: modalCoords.lng,
          isDefault: modalIsDefault
        });

        if (res.success && res.data) {
          setAddresses(prev => {
            const list = modalIsDefault 
              ? [res.data!, ...prev.map(a => ({ ...a, is_default: false }))]
              : [...prev, res.data!];
            return list.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
          });
          showFeedback('New address added successfully');
          setIsModalOpen(false);
        } else {
          showFeedback(res.error || 'Failed to save address. Please try again.', 'error');
        }
      }
    } catch (err: any) {
      showFeedback(err.message || 'An error occurred while saving', 'error');
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
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-slate-900"
              aria-label="Back to Profile"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">Saved Addresses</h1>
              <p className="text-xs text-slate-500 mt-1">Manage delivery locations for quick checkout</p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-xs rounded-xl shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New</span>
          </button>
        </div>
      </header>

      {/* Floating Feedback Toast */}
      {feedbackMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-800 text-emerald-50 shadow-emerald-950/20' 
              : 'bg-rose-800 text-rose-50 shadow-rose-950/20'
          }`}>
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
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-semibold text-xs rounded-xl shadow transition-all"
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
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow transition-all active:scale-95"
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
                1 active default address
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => {
                const isDefault = Boolean(addr.is_default);
                const isActionLoading = actionLoadingId === addr.id;

                return (
                  <div
                    key={addr.id}
                    className={`relative bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between group ${
                      isDefault 
                        ? 'border-emerald-500 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/20' 
                        : 'border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {/* Top Row: Label & Default Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl flex items-center justify-center ${
                            addr.label === 'Home' 
                              ? 'bg-blue-50 text-blue-600' 
                              : addr.label === 'Office' 
                              ? 'bg-amber-50 text-amber-600' 
                              : 'bg-purple-50 text-purple-600'
                          }`}>
                            {addr.label === 'Home' ? (
                              <Home className="w-4 h-4" />
                            ) : addr.label === 'Office' ? (
                              <Briefcase className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{addr.label}</h3>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {addr.lat && addr.lng ? `${addr.lat.toFixed(3)}, ${addr.lng.toFixed(3)}` : 'Manual entry'}
                            </span>
                          </div>
                        </div>

                        {/* ONLY ONE CAN BE DEFAULT */}
                        {isDefault ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[11px] font-bold tracking-wide">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            disabled={isActionLoading}
                            className="text-[11px] font-semibold text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      {/* Address String */}
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                        {addr.address}
                      </p>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(addr)}
                          disabled={isActionLoading}
                          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        
                        {deleteConfirmId === addr.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                            <span className="text-[10px] font-bold text-rose-700 px-1">Delete?</span>
                            <button
                              onClick={() => handleDelete(addr.id)}
                              disabled={isActionLoading}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(addr.id)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>

                      {isActionLoading && (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ADD / EDIT ADDRESS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingAddress ? 'Edit Address' : 'Add New Delivery Address'}
                </h3>
                <p className="text-xs text-slate-500">Pin your location on the map or type address</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Map & GPS Auto-Locate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Location Pin
                  </label>
                  <button
                    type="button"
                    onClick={handleModalUseLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200/60 transition-colors disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    <span>{isLocating ? 'Detecting...' : 'Use Current Location'}</span>
                  </button>
                </div>

                {/* Map Display */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-48 bg-slate-100">
                  <OrderTrackingMap
                    customerLocation={modalCoords}
                    interactive={true}
                    showCenterMarker={true}
                    onLocationChange={handleModalLocationChange}
                    height="190px"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm text-[11px] text-slate-600 flex items-center justify-between pointer-events-none">
                    <span className="truncate">Drag map to reposition pin</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {modalCoords.lat.toFixed(4)}, {modalCoords.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                {modalNotice && (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    {modalNotice}
                  </p>
                )}
              </div>

              {/* Address Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Home', 'Office', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setModalLabel(lbl)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        modalLabel === lbl
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {lbl === 'Home' && <Home className="w-3.5 h-3.5" />}
                      {lbl === 'Office' && <Briefcase className="w-3.5 h-3.5" />}
                      {lbl === 'Other' && <Plus className="w-3.5 h-3.5" />}
                      {lbl}
                    </button>
                  ))}
                </div>

                {modalLabel === 'Other' && (
                  <input
                    type="text"
                    placeholder="E.g., Farmhouse, Gym, Friend's house"
                    value={modalCustomLabel}
                    onChange={(e) => setModalCustomLabel(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
                  />
                )}
              </div>

              {/* Address Details Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Complete Address Details *
                </label>
                <textarea
                  rows={3}
                  value={modalAddress}
                  onChange={(e) => setModalAddress(e.target.value)}
                  placeholder="House/Flat number, Building name, Street, Landmark, Area, Pincode"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 resize-none leading-relaxed"
                />
              </div>

              {/* Set as Default Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={modalIsDefault}
                  onChange={(e) => setModalIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">Set as Default Delivery Address</p>
                  <p className="text-[11px] text-slate-500">This address will be auto-selected for future orders</p>
                </div>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={isModalSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-50"
              >
                {isModalSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
