"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Users, Loader2, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminCustomersPage() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });
      setCustomers(profiles ?? []);
      setIsLoading(false);
    };
    fetchCustomers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 md:px-10 pt-6 pb-5" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
          Customers
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
          {customers.length} registered customers
        </p>
      </div>

      <div className="px-6 md:px-10 py-5">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="w-12 h-12 mb-4" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
            <p className="font-bold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>No customers yet</p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-outline)' }}>
              Customers will appear here after they sign up.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {customers.map((customer, i) => (
              <motion.div key={customer.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="rounded-[14px] p-4 flex items-center gap-4"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #3f6530, #577f46)' }}>
                  {(customer.name || customer.email || 'C')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px] truncate" style={{ color: 'var(--color-on-surface)' }}>
                    {customer.name || customer.email || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {customer.email && (
                      <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-outline)' }}>
                        <Mail className="w-3 h-3" /> {customer.email}
                      </span>
                    )}
                    {customer.phone && (
                      <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-outline)' }}>
                        <Phone className="w-3 h-3" /> +91 {customer.phone}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
