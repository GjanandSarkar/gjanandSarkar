"use client";

import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/api/products';
import { Tags, Plus, Pencil, Trash2, Package } from 'lucide-react';

const CATEGORIES = ['Milk', 'Paneer', 'Ghee', 'Buttermilk', 'Curd', 'Lassi'];

export default function AdminCategoriesPage() {
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProducts({ activeOnly: false }).then((products) => {
      const counts: Record<string, number> = {};
      CATEGORIES.forEach(c => counts[c] = 0);
      products.forEach(p => {
        if (counts[p.category] !== undefined) {
          counts[p.category]++;
        }
      });
      setProductCounts(counts);
      setIsLoading(false);
    });
  }, []);

  const handleAction = () => {
    alert("Categories are currently locked to DB schema constraints (Phase 20).");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-6 md:px-10 pt-6 pb-5 flex items-center justify-between"
        style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div>
          <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            Categories
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
            Manage product taxonomy
          </p>
        </div>
        <button onClick={handleAction} className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[13px] text-white transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #3f6530, #577f46)',
            boxShadow: '0 4px 12px rgba(63, 101, 48, 0.25)',
          }}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Category
        </button>
      </div>

      <div className="px-6 md:px-10 py-5">
        <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid rgba(195,201,187,0.3)', background: 'var(--color-surface-container-lowest)' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'var(--color-surface-container-low)' }}>
                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Category Name</th>
                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Products</th>
                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-right" style={{ color: 'var(--color-outline)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat, idx) => (
                <tr key={cat} style={{ borderBottom: idx !== CATEGORIES.length - 1 ? '1px solid rgba(195,201,187,0.3)' : 'none' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-primary/10 text-primary">
                        <Tags className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-[14px]" style={{ color: 'var(--color-on-surface)' }}>{cat}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" style={{ color: 'var(--color-outline)' }} />
                      <span className="font-semibold text-[13px]" style={{ color: 'var(--color-on-surface)' }}>
                        {isLoading ? '...' : (productCounts[cat] || 0)} items
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleAction} className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: 'var(--color-primary)' }}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={handleAction} className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: 'var(--color-error)' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
