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
  ShieldCheck,
  Search,
  Camera,
  BellOff,
  PhoneOff,
  DoorClosed,
  UserCheck
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

  // Modal & 2-Step Location Flow State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [modalLabel, setModalLabel] = useState('Home');
  const [modalCustomLabel, setModalCustomLabel] = useState('');
  const [modalBuilding, setModalBuilding] = useState('');
  const [modalStreet, setModalStreet] = useState('');
  const [modalLandmark, setModalLandmark] = useState('');
  const [selectedInstructionTags, setSelectedInstructionTags] = useState<string[]>([]);
  const [modalInstructions, setModalInstructions] = useState('');
  const [modalPhotoUrl, setModalPhotoUrl] = useState('');
  const [modalAddress, setModalAddress] = useState('');
  const [modalIsDefault, setModalIsDefault] = useState(false);
  const [modalCoords, setModalCoords] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 });
  const [mapSearchTerm, setMapSearchTerm] = useState('');
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

  const DELIVERY_PRESETS = [
    'Leave at door',
    'Leave with guard',
    'Avoid calling',
    "Don't ring the bell"
  ];

  const extractAreaFromFullAddress = (
    fullAddr: string,
    building?: string | null,
    street?: string | null,
    landmark?: string | null
  ): string => {
    let area = (fullAddr || '').trim();
    if (!area) return '';

    const bldg = (building || '').trim();
    const strt = (street || '').trim();
    const lndmrk = (landmark || '').trim();
    const lndmrkNear = lndmrk ? `Near ${lndmrk}` : '';

    const removePrefix = (prefix: string) => {
      if (!prefix) return;
      const lowerArea = area.toLowerCase();
      const lowerPrefix = prefix.toLowerCase();
      if (lowerArea.startsWith(lowerPrefix)) {
        area = area.slice(prefix.length).replace(/^[\s,]+/, '').trim();
      }
    };

    removePrefix(bldg);
    removePrefix(strt);
    if (lndmrkNear) removePrefix(lndmrkNear);
    removePrefix(lndmrk);
    removePrefix(bldg);
    removePrefix(strt);

    return area;
  };

  // Open Edit Modal
  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    setModalStep(2);
    if (['Home', 'Office'].includes(addr.label)) {
      setModalLabel(addr.label);
      setModalCustomLabel('');
    } else {
      setModalLabel('Other');
      setModalCustomLabel(addr.label);
    }
    setModalBuilding(addr.building || '');
    setModalStreet(addr.street || '');
    setModalLandmark(addr.landmark || '');

    // Parse instruction tags vs custom note
    const rawInst = addr.instructions || '';
    const matchedTags: string[] = [];
    DELIVERY_PRESETS.forEach(tag => {
      if (rawInst.includes(tag)) matchedTags.push(tag);
    });
    setSelectedInstructionTags(matchedTags);
    let customNote = rawInst;
    matchedTags.forEach(t => {
      customNote = customNote.replace(t, '').replace(/^,\s*/, '').replace(/,\s*$/, '');
    });
    setModalInstructions(customNote.trim());

    setModalPhotoUrl(addr.photo_url || '');

    // Extract area only (prevent building and street from prepending into Area field)
    const cleanArea = extractAreaFromFullAddress(
      addr.address || '',
      addr.building,
      addr.street,
      addr.landmark
    );
    setModalAddress(cleanArea);

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
    setModalStep(1);
    setModalLabel('Home');
    setModalCustomLabel('');
    setModalBuilding('');
    setModalStreet('');
    setModalLandmark('');
    setSelectedInstructionTags([]);
    setModalInstructions('');
    setModalPhotoUrl('');
    setModalAddress('');
    setMapSearchTerm('');
    // Default to true only if no addresses exist
    setModalIsDefault(addresses.length === 0);
    setModalCoords({ lat: 28.6139, lng: 77.2090 });
    setModalNotice(null);
    setIsModalOpen(true);

    // Auto-locate GPS on opening Step 1
    handleModalUseLocation();
  };

  const handleModalLocationChange = useCallback((newCoords: { lat: number; lng: number }) => {
    setModalCoords(newCoords);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const formatted = await reverseGeocodeCoords(newCoords.lat, newCoords.lng);
      setModalAddress(extractAreaFromFullAddress(formatted, modalBuilding, modalStreet, modalLandmark));
    }, 800);
  }, [modalBuilding, modalStreet, modalLandmark]);

  const handleModalUseLocation = async () => {
    setIsLocating(true);
    setModalNotice(null);
    try {
      const loc = await getCurrentUserLocation();
      setModalCoords({ lat: loc.lat, lng: loc.lng });
      if (loc.address) {
        setModalAddress(extractAreaFromFullAddress(loc.address, modalBuilding, modalStreet, modalLandmark));
      }
      setModalNotice(loc.source === 'gps' ? 'Location pinpointed via GPS' : 'Approximate location detected via network');
    } catch (err) {
      setModalNotice('Could not detect location. Please enter address manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchTerm.trim()) return;
    try {
      setIsLocating(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchTerm.trim())}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newCoords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
        setModalCoords(newCoords);
        setModalAddress(extractAreaFromFullAddress(item.display_name, modalBuilding, modalStreet, modalLandmark));
      }
    } catch (err) {
      console.warn('Geocoding search failed:', err);
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

    const bldg = modalBuilding.trim();
    const strt = modalStreet.trim();
    const lndmrk = modalLandmark.trim();
    const combinedInstructions = [
      ...selectedInstructionTags,
      modalInstructions.trim()
    ].filter(Boolean).join(', ');

    const cleanArea = extractAreaFromFullAddress(modalAddress, bldg, strt, lndmrk);

    // Construct full address text
    const fullAddress = [
      bldg,
      strt,
      lndmrk ? `Near ${lndmrk}` : '',
      cleanArea
    ].filter(Boolean).join(', ');

    if (!fullAddress.trim()) {
      alert('Please enter complete address details.');
      return;
    }

    const finalLabel = modalLabel === 'Other' ? (modalCustomLabel.trim() || 'Other') : modalLabel;
    setIsModalSaving(true);

    try {
      if (editingAddress) {
        // Update existing address
        const res = await updateAddressAPI(uid, editingAddress.id, {
          label: finalLabel,
          address: cleanArea,
          building: bldg,
          street: strt,
          landmark: lndmrk,
          instructions: combinedInstructions,
          photo_url: modalPhotoUrl,
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
          address: cleanArea,
          building: bldg,
          street: strt,
          landmark: lndmrk,
          instructions: combinedInstructions,
          photo_url: modalPhotoUrl,
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

                      {/* Building & Street if present */}
                      {(addr.building || addr.street || addr.landmark) && (
                        <p className="text-xs font-semibold text-slate-800 mb-0.5">
                          {[addr.building, addr.street, addr.landmark ? `Near ${addr.landmark}` : ''].filter(Boolean).join(', ')}
                        </p>
                      )}

                      {/* Area String */}
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                        {extractAreaFromFullAddress(addr.address, addr.building, addr.street, addr.landmark)}
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
                        
                        <button
                          onClick={() => setDeleteConfirmId(addr.id)}
                          disabled={isActionLoading}
                          className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
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

      {/* ── 2-STEP ADD / EDIT ADDRESS MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 animate-in zoom-in-95 duration-200">
            
            {/* ── STEP 1: INTERACTIVE MAP PIN SELECTION ── */}
            {modalStep === 1 ? (
              <div className="flex flex-col h-[82vh] max-h-[660px]">
                {/* Step 1 Header: Search + GPS */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2.5 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Search Bar */}
                  <form onSubmit={handleMapSearch} className="flex-1 relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={mapSearchTerm}
                      onChange={(e) => setMapSearchTerm(e.target.value)}
                      placeholder="Search area, landmark or address..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100/90 border border-slate-200/80 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </form>

                  {/* Current Location GPS Button */}
                  <button
                    type="button"
                    onClick={handleModalUseLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200/80 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'GPS'}</span>
                  </button>
                </div>

                {/* Step 1 Center Pin Map Container */}
                <div className="relative flex-1 bg-slate-100 overflow-hidden">
                  <OrderTrackingMap
                    customerLocation={modalCoords}
                    interactive={true}
                    showCenterMarker={true}
                    onLocationChange={handleModalLocationChange}
                    height="100%"
                  />

                  {modalNotice && (
                    <div className="absolute top-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-slate-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 pointer-events-none z-10">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{modalNotice}</span>
                    </div>
                  )}
                </div>

                {/* Step 1 Bottom Sheet Preview & Confirm Button */}
                <div className="p-5 bg-white border-t border-slate-100 shrink-0 shadow-lg space-y-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Place the pin at exact delivery location
                  </p>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                      <MapPin className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">
                        {modalAddress ? modalAddress.split(',')[0] : 'Locating pin address...'}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-0.5 font-medium">
                        {modalAddress || 'Drag map to position exact location pin'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="w-full py-3 bg-[#0f3e26] hover:bg-black active:scale-98 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Confirm & proceed</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* ── STEP 2: DETAILED LOCATION FORM ── */
              <div className="flex flex-col max-h-[85vh]">
                {/* Step 2 Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                      aria-label="Back to Map"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-none">
                        Enter Location Details
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Complete info for delivery partner efficiency</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step 2 Form Body */}
                <div className="p-5 sm:p-6 space-y-5 overflow-y-auto bg-[#f8f9fa]">
                  
                  {/* Selected Area Banner + Change Pin Action */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                        <MapPin className="w-4 h-4 fill-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {modalAddress ? modalAddress.split(',')[0] : 'Pinned Location'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {modalAddress}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors shrink-0 cursor-pointer"
                    >
                      Change Pin
                    </button>
                  </div>

                  {/* Location Details Container */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                    
                    {/* Address Type Selector Pills */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Address Type *
                      </label>
                      <div className="bg-[#eeedf2] p-1.5 rounded-full flex items-center gap-1">
                        {[
                          { key: 'Home', label: 'House', icon: Home },
                          { key: 'Office', label: 'Office', icon: Briefcase },
                          { key: 'Other', label: 'Other', icon: Navigation }
                        ].map(item => {
                          const IconComp = item.icon;
                          const isSelected = modalLabel === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setModalLabel(item.key)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#0f3e26] text-white shadow-md' 
                                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
                              }`}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {modalLabel === 'Other' && (
                      <div>
                        <input
                          type="text"
                          placeholder="Save address as * (e.g. Farmhouse, Gym)"
                          value={modalCustomLabel}
                          onChange={(e) => setModalCustomLabel(e.target.value)}
                          className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white placeholder:text-slate-400 font-medium"
                        />
                      </div>
                    )}

                    {/* Building / Flat / Floor * */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Building / Flat / Floor / House No. *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Flat 402, Block B, Royal Palms"
                        value={modalBuilding}
                        onChange={(e) => setModalBuilding(e.target.value)}
                        className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white placeholder:text-slate-400 font-medium"
                      />
                    </div>

                    {/* Street / Road / Area */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Street / Road / Area / Landmark
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Opp. City Mall, S.G. Highway"
                        value={modalStreet}
                        onChange={(e) => setModalStreet(e.target.value)}
                        className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white placeholder:text-slate-400 font-medium"
                      />
                    </div>

                    {/* Area / City Geocoded String */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Area / City / Pincode
                      </label>
                      <textarea
                        rows={2}
                        value={modalAddress}
                        onChange={(e) => setModalAddress(e.target.value)}
                        placeholder="Area, City, Pincode"
                        className="w-full px-4 py-2.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 resize-none leading-relaxed placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Delivery Instructions (Recommended) */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">Delivery Instructions (Recommended)</h4>
                      <span className="text-[10px] text-slate-400 font-medium">Select all that apply</span>
                    </div>

                    {/* Checkbox Instruction Options */}
                    <div className="space-y-2">
                      {[
                        { tag: 'Leave at door', icon: DoorClosed },
                        { tag: 'Leave with guard', icon: UserCheck },
                        { tag: 'Avoid calling', icon: PhoneOff },
                        { tag: "Don't ring the bell", icon: BellOff }
                      ].map(item => {
                        const IconComp = item.icon;
                        const isChecked = selectedInstructionTags.includes(item.tag);
                        return (
                          <div
                            key={item.tag}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedInstructionTags(prev => prev.filter(t => t !== item.tag));
                              } else {
                                setSelectedInstructionTags(prev => [...prev, item.tag]);
                              }
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-medium transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-emerald-50/70 border-emerald-600 text-emerald-950 shadow-2xs'
                                : 'bg-slate-50/50 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <IconComp className={`w-4 h-4 ${isChecked ? 'text-emerald-700' : 'text-slate-600'}`} />
                              <span className="text-xs font-semibold">{item.tag}</span>
                            </div>

                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-emerald-600/70 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Additional Custom Instructions */}
                    <input
                      type="text"
                      placeholder="Other custom instructions (e.g. Ring bell twice)"
                      value={modalInstructions}
                      onChange={(e) => setModalInstructions(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  {/* Set as Default Checkbox */}
                  <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200/80 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={modalIsDefault}
                      onChange={(e) => setModalIsDefault(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Set as Default Delivery Address</p>
                      <p className="text-[11px] text-slate-500">Auto-select for faster checkout on future orders</p>
                    </div>
                  </label>
                </div>

                {/* Step 2 Modal Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                  {(!modalBuilding.trim() || (modalLabel === 'Other' && !modalCustomLabel.trim())) ? (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50/90 px-3 py-1 rounded-lg border border-amber-200/60">
                      * Enter building / flat no. to save
                    </span>
                  ) : <div />}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveModal}
                      disabled={!modalBuilding.trim() || !modalAddress.trim() || (modalLabel === 'Other' && !modalCustomLabel.trim()) || isModalSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#0f3e26] hover:bg-black active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
                    >
                      {isModalSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Address...</span>
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
        </div>
      )}

      {/* Delete Confirmation Modal Pop-up */}
      {deleteConfirmId && (() => {
        const targetAddress = addresses.find(a => a.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 p-6 text-center animate-in zoom-in-95 duration-200 relative">
              {/* Top Close Button */}
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Danger Trash Icon Header */}
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>

              {/* Modal Title & Description */}
              <h3 className="text-base font-bold text-slate-900 mb-1">Delete Address?</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>

              {/* Address Target Card Snippet */}
              {targetAddress && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-5 text-left">
                  <p className="text-xs font-bold text-slate-800 mb-0.5">{targetAddress.label}</p>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{targetAddress.address}</p>
                </div>
              )}

              {/* Modal Action Buttons (No / Yes) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoadingId === deleteConfirmId}
                  onClick={async () => {
                    await handleDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-semibold text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === deleteConfirmId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Yes, Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
