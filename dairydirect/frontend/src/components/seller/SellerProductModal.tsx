"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  UploadCloud,
  Package,
  Layers,
  HelpCircle,
  Info,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Check,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitSellerProduct, updateSellerProduct, uploadProductImage } from '@/lib/api/products';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

interface SellerProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any | null; // null for new product, object for edit / resubmit
  defaultStoreName?: string;
  onSuccess: (product: any, isEdit: boolean) => void;
}

const CATEGORIES_CONFIG: Record<string, { subcategories: string[]; attributes: Array<{ key: string; label: string; placeholder: string }> }> = {
  'Dairy': {
    subcategories: ['Pure Desi Ghee', 'Fresh Milk', 'A2 Gir Cow Milk', 'Paneer & Cottage Cheese', 'Curd & Dahi', 'White Butter (Makhan)', 'Cheese & Chhena', 'Chaas & Buttermilk'],
    attributes: [
      { key: 'fat_content', label: 'Fat Content (%)', placeholder: 'e.g. 99.7% or 6.5%' },
      { key: 'shelf_life', label: 'Shelf Life (Days / Months)', placeholder: 'e.g. 12 Months' },
      { key: 'storage_temp', label: 'Storage Temperature', placeholder: 'e.g. Cool and dry place away from direct sunlight' },
      { key: 'packaging_type', label: 'Packaging Type', placeholder: 'e.g. Food-grade glass jar / Tetra Pak' },
      { key: 'organic_a2_cert', label: 'Organic / A2 Certified', placeholder: 'e.g. Yes (A2 Certified)' },
    ],
  },
  'Sweets & Mithai': {
    subcategories: ['Mathura Peda', 'Kaju Katli', 'Gulab Jamun', 'Rasgulla', 'Besan Ladoo', 'Milk Cake', 'Kalakand'],
    attributes: [
      { key: 'fat_content', label: 'Fat Content (%)', placeholder: 'e.g. 18%' },
      { key: 'shelf_life', label: 'Shelf Life (Days / Months)', placeholder: 'e.g. 7 Days' },
      { key: 'storage_temp', label: 'Storage Temperature', placeholder: 'e.g. Keep refrigerated 2°C - 4°C' },
      { key: 'packaging_type', label: 'Packaging Type', placeholder: 'e.g. Sealed Sweet Box' },
      { key: 'organic_a2_cert', label: 'Pure Desi Ghee Certified', placeholder: 'e.g. Yes (100% Pure Ghee)' },
    ],
  },
  'Bakery & Breads': {
    subcategories: ['Khakhra & Thepla', 'Whole Wheat Cookies', 'Artisan Bread', 'Namkeen & Farsan'],
    attributes: [
      { key: 'shelf_life', label: 'Shelf Life (Days / Months)', placeholder: 'e.g. 30 Days' },
      { key: 'storage_temp', label: 'Storage Temperature', placeholder: 'e.g. Dry ambient temperature' },
      { key: 'packaging_type', label: 'Packaging Type', placeholder: 'e.g. Nitrogen-flushed pouch' },
      { key: 'organic_a2_cert', label: 'Dietary / Organic Info', placeholder: 'e.g. 100% Whole Wheat, No Palm Oil' },
    ],
  },
  'Organic Groceries': {
    subcategories: ['Organic Basmati Rice', 'Sharbati Wheat Flour', 'Pulses & Dals', 'Raw Honey', 'Natural Jaggery (Gud)'],
    attributes: [
      { key: 'shelf_life', label: 'Shelf Life (Days / Months)', placeholder: 'e.g. 12 Months' },
      { key: 'storage_temp', label: 'Storage Temperature', placeholder: 'e.g. Store in airtight container' },
      { key: 'packaging_type', label: 'Packaging Type', placeholder: 'e.g. Food-grade vacuum pack' },
      { key: 'organic_a2_cert', label: 'Organic Certification', placeholder: 'e.g. NPOP / Jaivik Bharat Certified' },
    ],
  },
  'Beverages': {
    subcategories: ['A2 Badam Milk', 'Fresh Chaas & Buttermilk', 'Thandai', 'Cold-Pressed Juices'],
    attributes: [
      { key: 'fat_content', label: 'Fat Content (%)', placeholder: 'e.g. 3.5%' },
      { key: 'shelf_life', label: 'Shelf Life (Days / Months)', placeholder: 'e.g. 3 Days' },
      { key: 'storage_temp', label: 'Storage Temperature', placeholder: 'e.g. Keep Chilled (2°C - 4°C)' },
      { key: 'packaging_type', label: 'Packaging Type', placeholder: 'e.g. Glass Bottle' },
      { key: 'organic_a2_cert', label: 'Natural / No Preservatives', placeholder: 'e.g. 100% Natural, No Added Preservatives' },
    ],
  },
  'Spices & Condiments': {
    subcategories: ['Whole Spices', 'Ground Spices', 'Organic Turmeric', 'Garam Masala', 'Himalayan Rock Salt'],
    attributes: [
      { key: 'shelf_life', label: 'Shelf Life (Days / Months)', placeholder: 'e.g. 18 Months' },
      { key: 'storage_temp', label: 'Storage Temperature', placeholder: 'e.g. Cool and dry pantry' },
      { key: 'packaging_type', label: 'Packaging Type', placeholder: 'e.g. Zip-lock pouch / Glass bottle' },
      { key: 'organic_a2_cert', label: 'Organic Certification', placeholder: 'e.g. Certified Organic' },
    ],
  },
};

export function SellerProductModal({
  isOpen,
  onClose,
  product,
  defaultStoreName = 'Gjanand Sarkar Seller',
  onSuccess,
}: SellerProductModalProps) {
  const isEdit = Boolean(product && product.id);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Dairy');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');

  // Primary Image State (Device Upload vs URL)
  const [primaryUploadMode, setPrimaryUploadMode] = useState<'device' | 'url'>('device');
  const [imageUrl, setImageUrl] = useState('');
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false);
  const [primaryUploadSuccess, setPrimaryUploadSuccess] = useState(false);
  const [isDraggingPrimary, setIsDraggingPrimary] = useState(false);
  const primaryFileInputRef = useRef<HTMLInputElement>(null);

  // Gallery Images State
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Pricing & Inventory
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [weight, setWeight] = useState('500g');
  const [taxRate, setTaxRate] = useState('5');

  // Logistics & Policies
  const [shippingDetails, setShippingDetails] = useState('Standard delivery within 24-48 hours. Fresh cold chain packaging.');
  const [returnPolicy, setReturnPolicy] = useState('Replacement guarantee within 24 hours of delivery for damaged or spoiled items.');

  // Category Attributes & Compliance
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [labReportUrl, setLabReportUrl] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ show: boolean; message: string } | null>(null);
  const [submittedSuccessData, setSubmittedSuccessData] = useState<{
    id?: string;
    name: string;
    category: string;
    sku: string;
    price: number;
    stock: number;
    imageUrl?: string;
    isEdit: boolean;
  } | null>(null);

  // Populate on open / change
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(product.category || 'Dairy');
      setSubcategory(product.subcategory || '');
      setBrand(product.brand || defaultStoreName);
      setSku(product.sku || '');
      setDescription(product.description || '');

      // Existing image
      const existingImg = product.image_url || '';
      setImageUrl(existingImg);
      setPrimaryPreview(existingImg || null);
      setPrimaryFile(null);
      setPrimaryUploadSuccess(Boolean(existingImg));
      setPrimaryUploadMode('device');

      setGalleryImages(Array.isArray(product.gallery_images) ? product.gallery_images : []);

      const primaryVariant = product.product_variants?.[0];
      setPrice(primaryVariant?.price ? String(primaryVariant.price) : (product.price ? String(product.price) : ''));
      setOriginalPrice(primaryVariant?.original_price || primaryVariant?.compare_at_price ? String(primaryVariant.original_price || primaryVariant.compare_at_price) : (product.original_price ? String(product.original_price) : ''));
      setCostPrice(primaryVariant?.cost_price ? String(primaryVariant.cost_price) : (product.cost_price ? String(product.cost_price) : ''));
      setStock(primaryVariant?.stock !== undefined ? String(primaryVariant.stock) : (product.stock !== undefined ? String(product.stock) : '50'));
      setWeight(primaryVariant?.weight || product.weight || '500g');
      setTaxRate(product.tax_rate !== undefined ? String(product.tax_rate) : '5');

      setShippingDetails(product.shipping_details || 'Standard delivery within 24-48 hours. Fresh cold chain packaging.');
      setReturnPolicy(product.return_policy || 'Replacement guarantee within 24 hours of delivery for damaged or spoiled items.');

      setAttributes(product.attributes || {});

      // Extract compliance docs
      if (Array.isArray(product.compliance_documents)) {
        const fssai = product.compliance_documents.find((d: any) => d.type === 'fssai' || d.name?.includes('FSSAI'));
        const lab = product.compliance_documents.find((d: any) => d.type === 'lab_report' || d.name?.includes('Lab'));
        if (fssai) setFssaiLicense(fssai.url || '');
        if (lab) setLabReportUrl(lab.url || '');
      }
    } else {
      // Reset defaults for new
      setName('');
      setCategory('Dairy');
      setSubcategory(CATEGORIES_CONFIG['Dairy']?.subcategories[0] || '');
      setBrand(defaultStoreName);
      setSku(`SKU-DAI-${Date.now().toString(36).toUpperCase()}`);
      setDescription('');
      setImageUrl('');
      setPrimaryPreview(null);
      setPrimaryFile(null);
      setPrimaryUploadSuccess(false);
      setPrimaryUploadMode('device');
      setGalleryImages([]);
      setPrice('');
      setOriginalPrice('');
      setCostPrice('');
      setStock('50');
      setWeight('500g');
      setTaxRate('5');
      setShippingDetails('Standard delivery within 24-48 hours. Fresh cold chain packaging.');
      setReturnPolicy('Replacement guarantee within 24 hours of delivery for damaged or spoiled items.');
      setAttributes({});
      setFssaiLicense('');
      setLabReportUrl('');
    }
    setError('');
    setSuccessInfo(null);
    setSubmittedSuccessData(null);
  }, [product, defaultStoreName, isOpen]);

  const handleResetNewForm = () => {
    setName('');
    setCategory('Dairy');
    setSubcategory(CATEGORIES_CONFIG['Dairy']?.subcategories[0] || '');
    setBrand(defaultStoreName);
    setSku(`SKU-DAI-${Date.now().toString(36).toUpperCase()}`);
    setDescription('');
    setImageUrl('');
    setPrimaryPreview(null);
    setPrimaryFile(null);
    setPrimaryUploadSuccess(false);
    setPrimaryUploadMode('device');
    setGalleryImages([]);
    setPrice('');
    setOriginalPrice('');
    setCostPrice('');
    setStock('50');
    setWeight('500g');
    setTaxRate('5');
    setShippingDetails('Standard delivery within 24-48 hours. Fresh cold chain packaging.');
    setReturnPolicy('Replacement guarantee within 24 hours of delivery for damaged or spoiled items.');
    setAttributes({});
    setFssaiLicense('');
    setLabReportUrl('');
    setError('');
    setSuccessInfo(null);
    setSubmittedSuccessData(null);
  };

  // Update default subcategory when category changes
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const subcats = CATEGORIES_CONFIG[newCat]?.subcategories || [];
    setSubcategory(subcats[0] || '');
  };

  const handleGenerateSku = () => {
    const prefix = category.slice(0, 3).toUpperCase();
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    setSku(`SKU-${prefix}-${randomCode}`);
  };

  // ─── Primary Image Device Upload Handlers ───
  const processPrimaryImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size exceeds 10MB limit. Please select a smaller photo.');
      return;
    }

    setError('');
    setPrimaryFile(file);
    const localUrl = URL.createObjectURL(file);
    setPrimaryPreview(localUrl);
    setIsUploadingPrimary(true);
    setPrimaryUploadSuccess(false);

    try {
      const uploadRes = await uploadProductImage(file);
      if (uploadRes.error || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Failed to upload image to cloud CDN');
      }

      setImageUrl(uploadRes.url);
      setPrimaryUploadSuccess(true);
    } catch (uploadErr: any) {
      console.warn('Image upload error:', uploadErr);
      setError(`Image upload warning: ${uploadErr.message}. You can still proceed or provide an image link.`);
    } finally {
      setIsUploadingPrimary(false);
    }
  };

  const handlePrimaryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPrimaryImageFile(file);
    }
  };

  const handlePrimaryDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPrimary(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processPrimaryImageFile(file);
    }
  };

  const handleRemovePrimaryImage = () => {
    setPrimaryFile(null);
    setPrimaryPreview(null);
    setImageUrl('');
    setPrimaryUploadSuccess(false);
    if (primaryFileInputRef.current) {
      primaryFileInputRef.current.value = '';
    }
  };

  // ─── Gallery Images Device Upload Handlers ───
  const handleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    setError('');

    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) continue;
        const uploadRes = await uploadProductImage(file);
        if (uploadRes.url) {
          setGalleryImages(prev => [...prev, uploadRes.url!]);
        }
      }
    } catch (err: any) {
      setError(`Gallery upload error: ${err.message}`);
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleAddGalleryUrl = () => {
    if (newGalleryInput.trim()) {
      setGalleryImages(prev => [...prev, newGalleryInput.trim()]);
      setNewGalleryInput('');
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Form Submission ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a product name.');
      return;
    }
    if (!category.trim()) {
      setError('Please select a category.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid selling price greater than ₹0.');
      return;
    }
    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      setError('Available stock must be a non-negative number.');
      return;
    }

    if (isUploadingPrimary) {
      setError('Please wait for the primary product image to finish uploading.');
      return;
    }

    // Determine final image URL
    let finalImageUrl = imageUrl.trim();
    if (!finalImageUrl && primaryFile) {
      // If file was selected but not finished uploading yet
      setIsSubmitting(true);
      try {
        const uploadRes = await uploadProductImage(primaryFile);
        if (uploadRes.url) {
          finalImageUrl = uploadRes.url;
        } else {
          throw new Error('Image upload failed');
        }
      } catch (upErr: any) {
        setError(`Failed to upload product image: ${upErr.message}`);
        setIsSubmitting(false);
        return;
      }
    }

    if (!finalImageUrl) {
      finalImageUrl = PLACEHOLDER_PRODUCT_IMAGE;
    }

    setIsSubmitting(true);

    try {
      // Build compliance docs array
      const complianceDocuments: Array<{ name: string; url: string; type: string }> = [];
      if (fssaiLicense.trim()) {
        complianceDocuments.push({
          name: 'FSSAI License / Number',
          url: fssaiLicense.trim(),
          type: 'fssai',
        });
      }
      if (labReportUrl.trim()) {
        complianceDocuments.push({
          name: 'Quality Lab Test Certificate',
          url: labReportUrl.trim(),
          type: 'lab_report',
        });
      }

      const payload: any = {
        name: name.trim(),
        category: category.trim(),
        subcategory: subcategory?.trim() || null,
        description: description.trim(),
        brand: brand.trim() || defaultStoreName,
        sku: sku.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`,
        imageUrl: finalImageUrl,
        galleryImages,
        price: numPrice,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: numStock,
        weight: weight.trim() || 'Standard',
        taxRate: parseFloat(taxRate) || 0,
        shippingDetails: shippingDetails.trim(),
        returnPolicy: returnPolicy.trim(),
        attributes,
        complianceDocuments,
      };

      let result;
      if (isEdit) {
        result = await updateSellerProduct(product.id, payload);
      } else {
        result = await submitSellerProduct(payload);
      }

      const createdItem = result?.approvalRequest || result?.product || payload;

      setSubmittedSuccessData({
        id: createdItem.id,
        name: payload.name,
        category: payload.category,
        sku: payload.sku,
        price: payload.price,
        stock: payload.stock,
        imageUrl: payload.imageUrl,
        isEdit,
      });

      // Notify parent to refresh seller products list in background
      onSuccess(createdItem, isEdit);
    } catch (err: any) {
      setError(err.message || 'Failed to submit product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategoryConfig = CATEGORIES_CONFIG[category] || { subcategories: [], attributes: [] };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col border border-gray-100"
      >
        {submittedSuccessData ? (
          <div className="p-8 sm:p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Top Close Button */}
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Glowing Icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50 shadow-inner">
                <CheckCircle2 className="w-10 h-10" strokeWidth={2.2} />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-xs">
                <Clock className="w-4 h-4" />
              </span>
            </div>

            {/* Header Text */}
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Product Approval Status: Pending Review</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {submittedSuccessData.isEdit ? 'Product Resubmitted for Approval!' : 'Product Submitted for Approval!'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Your product <strong className="text-gray-900">"{submittedSuccessData.name}"</strong> has been successfully registered and queued for verification. It will go live once verified by our quality assurance team.
              </p>
            </div>

            {/* Product Summary Card */}
            <div className="w-full max-w-lg bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left flex items-center gap-4 shadow-2xs">
              <img
                src={submittedSuccessData.imageUrl || PLACEHOLDER_PRODUCT_IMAGE}
                alt={submittedSuccessData.name}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200 bg-white shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">{submittedSuccessData.name}</h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 mt-0.5">
                  <span>Category: <strong className="text-gray-700">{submittedSuccessData.category}</strong></span>
                  <span>•</span>
                  <span>SKU: <code className="text-gray-700 bg-gray-200/70 px-1 py-0.2 rounded font-mono">{submittedSuccessData.sku}</code></span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black text-emerald-700">₹{submittedSuccessData.price.toLocaleString('en-IN')}</span>
                  <span className="text-[11px] text-gray-400">•</span>
                  <span className="text-[11px] text-gray-600 font-medium">Initial Stock: {submittedSuccessData.stock} units</span>
                </div>
              </div>
            </div>

            {/* Steps & Next Timeline */}
            <div className="w-full max-w-lg bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>What happens next?</span>
              </div>
              <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside">
                <li>Quality review turnaround: Usually completed within <strong>24 to 48 business hours</strong>.</li>
                <li>Once approved, this product automatically goes live in the customer marketplace catalogue.</li>
                <li>You can track the live status anytime in your <strong>"My Products"</strong> tab.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg pt-2">
              <button
                type="button"
                onClick={() => {
                  handleResetNewForm();
                }}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Product</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                }}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-[#0c3c26] hover:bg-[#092b1b] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Package className="w-4 h-4" />
                <span>Done & View Products</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0c3c26]" />
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    {isEdit ? 'Edit & Resubmit Product' : 'Add New Product for Approval'}
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isEdit
                    ? 'Update your product details. Price & stock updates remain live; core spec changes require reapproval.'
                    : 'All new marketplace products undergo admin verification before going live to customers.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Notification / Error / Success Alert */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successInfo?.show && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successInfo.message}</span>
            </div>
          )}

          {/* Section 1: Basic Product Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#0c3c26]" />
              <span>1. Basic Product Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Pure Vedic A2 Gir Cow Desi Ghee"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20 focus:border-[#0c3c26] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20 focus:border-[#0c3c26] bg-white cursor-pointer"
                >
                  {Object.keys(CATEGORIES_CONFIG).map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Subcategory</label>
                <select
                  value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20 focus:border-[#0c3c26] bg-white cursor-pointer"
                >
                  <option value="">Select subcategory (optional)</option>
                  {currentCategoryConfig.subcategories.map(sub => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Brand / Manufacturer</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Gjanand Farm Organics"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">SKU / Product Code</label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] font-bold text-[#0c3c26] hover:underline cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="e.g. SKU-DAI-8921"
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Detailed Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your product's purity, source farm, processing method, and benefits..."
                  className="w-full p-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0c3c26]" />
              <span>2. Pricing & Inventory</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="1450"
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm font-bold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  MRP / Original Price (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                    placeholder="1650"
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Cost / Purchase Price (₹) <span className="text-gray-400 font-normal">(Internal)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    placeholder="1100"
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Available Stock Qty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  placeholder="45"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Unit Weight / Volume <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="e.g. 1 Liter / 500g / 1 kg"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">GST / Tax Rate (%)</label>
                <select
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20 bg-white cursor-pointer"
                >
                  <option value="0">0% (Exempt / Fresh Milk)</option>
                  <option value="5">5% (Packaged Dairy / Fresh Food)</option>
                  <option value="12">12% (Ghee / Processed Dairy / Sweets)</option>
                  <option value="18">18% (Standard Rate)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── Section 3: Media & Images (Upload from Device) ─── */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-[#0c3c26]" />
                <span>3. Product Images (Upload from Device)</span>
              </h3>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPrimaryUploadMode('device')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    primaryUploadMode === 'device'
                      ? 'bg-white text-[#0c3c26] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Device Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrimaryUploadMode('url')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    primaryUploadMode === 'url'
                      ? 'bg-white text-[#0c3c26] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Image URL</span>
                </button>
              </div>
            </div>

            {/* Hidden Input for Primary Device File */}
            <input
              ref={primaryFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handlePrimaryFileChange}
              className="hidden"
            />

            {/* PRIMARY IMAGE UPLOAD CONTAINER */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                Primary Product Photo <span className="text-rose-500">*</span>
              </label>

              {primaryUploadMode === 'device' ? (
                <div>
                  {primaryPreview ? (
                    /* Preview Box with Change/Remove */
                    <div className="relative p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 flex items-center gap-4">
                      <div className="w-24 h-24 rounded-xl border border-emerald-200 overflow-hidden bg-white shrink-0 shadow-xs relative flex items-center justify-center">
                        <img
                          src={primaryPreview}
                          alt="Primary Preview"
                          className="w-full h-full object-cover"
                        />
                        {isUploadingPrimary && (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-[9px] font-bold mt-1">Uploading...</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {primaryFile?.name || 'Selected Product Photo'}
                          </span>
                          {primaryUploadSuccess && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" /> Uploaded to CDN
                            </span>
                          )}
                        </div>

                        {primaryFile && (
                          <p className="text-[11px] text-gray-400">
                            Size: {(primaryFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => primaryFileInputRef.current?.click()}
                            className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Change Photo
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePrimaryImage}
                            className="px-3 py-1 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Drag & Drop Upload Zone */
                    <div
                      onDragOver={e => {
                        e.preventDefault();
                        setIsDraggingPrimary(true);
                      }}
                      onDragLeave={() => setIsDraggingPrimary(false)}
                      onDrop={handlePrimaryDrop}
                      onClick={() => primaryFileInputRef.current?.click()}
                      className={`p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                        isDraggingPrimary
                          ? 'border-[#0c3c26] bg-emerald-50/60'
                          : 'border-gray-300 hover:border-[#0c3c26] bg-gray-50/50 hover:bg-emerald-50/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white text-[#0c3c26] shadow-xs border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {isUploadingPrimary ? (
                          <Loader2 className="w-6 h-6 animate-spin text-[#0c3c26]" />
                        ) : (
                          <UploadCloud className="w-6 h-6 text-[#0c3c26]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-800">
                          Click to upload from device <span className="font-normal text-gray-500">or drag and drop</span>
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          PNG, JPG, JPEG, WEBP up to 10MB • High resolution product photos
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Direct URL Input Mode */
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => {
                      setImageUrl(e.target.value);
                      setPrimaryPreview(e.target.value || null);
                      setPrimaryUploadSuccess(Boolean(e.target.value));
                    }}
                    placeholder="https://images.unsplash.com/... or hosted image link"
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                  />
                  {imageUrl && (
                    <div className="w-11 h-11 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ADDITIONAL GALLERY PHOTOS SECTION */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-gray-700">
                    Additional Gallery Angles & Nutrition Labels
                  </label>
                  <p className="text-[11px] text-gray-400">
                    Upload side views, pack back, or certification photos
                  </p>
                </div>

                {/* Upload Gallery Button from Device */}
                <div>
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleGalleryFilesChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingGallery}
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingGallery ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload from Device</span>
                  </button>
                </div>
              </div>

              {/* Gallery Thumbnails List */}
              {galleryImages.length > 0 && (
                <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200/80">
                  {galleryImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative group w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-2xs shrink-0"
                    >
                      <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(i)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4 text-rose-300" />
                      </button>
                      <span className="absolute bottom-1 right-1 px-1 rounded bg-black/60 text-[9px] text-white font-mono">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick URL Fallback Input for Gallery */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newGalleryInput}
                  onChange={e => setNewGalleryInput(e.target.value)}
                  placeholder="Or paste an extra image URL..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Add URL
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Category Specifications */}
          {currentCategoryConfig.attributes.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0c3c26]" />
                <span>4. {category} Specifications</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentCategoryConfig.attributes.map(attr => (
                  <div key={attr.key}>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{attr.label}</label>
                    <input
                      type="text"
                      value={attributes[attr.key] || ''}
                      onChange={e => setAttributes(prev => ({ ...prev, [attr.key]: e.target.value }))}
                      placeholder={attr.placeholder}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Shipping & Return Policy */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0c3c26]" />
              <span>5. Shipping & Return Policy</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Delivery / Shipping Info</label>
                <input
                  type="text"
                  value={shippingDetails}
                  onChange={e => setShippingDetails(e.target.value)}
                  placeholder="e.g. Standard delivery within 24-48 hours. Safe protective bubble box."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Return & Replacement</label>
                <input
                  type="text"
                  value={returnPolicy}
                  onChange={e => setReturnPolicy(e.target.value)}
                  placeholder="e.g. 24-hour replacement guarantee for damaged seal or broken jar."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Regulatory & Compliance */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#0c3c26]" />
              <span>6. Regulatory & Compliance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  FSSAI License / Reg No.
                </label>
                <input
                  type="text"
                  value={fssaiLicense}
                  onChange={e => setFssaiLicense(e.target.value)}
                  placeholder="e.g. 10022021000184"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Lab Test Certificate Link (Optional)
                </label>
                <input
                  type="url"
                  value={labReportUrl}
                  onChange={e => setLabReportUrl(e.target.value)}
                  placeholder="e.g. https://drive.google.com/file/d/sample-lab-report"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between sticky bottom-0 bg-white">
            <span className="text-[11px] text-gray-400">
              * Required fields. Uploaded photos are stored on cloud CDN.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting || isUploadingPrimary || isUploadingGallery}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingPrimary || isUploadingGallery}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0c3c26] hover:bg-[#114e32] text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting || isUploadingPrimary || isUploadingGallery ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isUploadingPrimary || isUploadingGallery ? 'Uploading Photos...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEdit ? 'Save & Resubmit Product' : 'Submit Product for Review'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
