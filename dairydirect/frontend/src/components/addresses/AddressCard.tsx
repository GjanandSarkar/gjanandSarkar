"use client";

import React from 'react';
import {
  Home,
  Building2,
  Briefcase,
  Layers,
  Edit3,
  Trash2,
  CheckCircle2,
  CalendarCheck,
  CalendarX,
  Phone,
  User,
  ShieldCheck,
} from 'lucide-react';
import type { UserAddress, AddressType } from '@/lib/api/addresses';

interface AddressCardProps {
  address: UserAddress;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  isActionLoading?: boolean;
  selectable?: boolean;
}

const TYPE_CONFIG: Record<AddressType, { label: string; icon: React.ElementType; color: string }> = {
  house: { label: 'House', icon: Home, color: 'text-info bg-info-bg border-info/20' },
  apartment: { label: 'Apartment', icon: Building2, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  business: { label: 'Business', icon: Briefcase, color: 'text-warning bg-warning-bg border-warning/20' },
  other: { label: 'Other', icon: Layers, color: 'text-foreground bg-surface-muted border-border' },
};

export function AddressCard({
  address,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  isActionLoading = false,
  selectable = false,
}: AddressCardProps) {
  const typeKey = (address.address_type || 'house') as AddressType;
  const typeConfig = TYPE_CONFIG[typeKey] || TYPE_CONFIG.house;
  const TypeIcon = typeConfig.icon;

  const isDefault = Boolean(address.is_default);

  return (
    <div
      onClick={selectable && onSelect ? onSelect : undefined}
      className={`relative bg-surface rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between group ${
        selectable ? 'cursor-pointer hover:border-success' : ''
      } ${
        isSelected
          ? 'border-success bg-success-bg/20 shadow-sm ring-2 ring-emerald-600/30'
          : isDefault
          ? 'border-success shadow-sm ring-1 ring-emerald-500/20'
          : 'border-border hover:border-border shadow-sm'
      }`}
    >
      <div>
        {/* Top Header: Address Type, Default Badge, Select Radio */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${typeConfig.color}`}
            >
              <TypeIcon className="w-3.5 h-3.5" />
              {typeConfig.label}
            </span>

            {address.label && address.label.toLowerCase() !== typeConfig.label.toLowerCase() && (
              <span className="text-xs font-semibold text-foreground-muted">
                • {address.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDefault ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-success-bg text-success border border-success rounded-full text-[11px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-success" />
                Default
              </span>
            ) : onSetDefault ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault();
                }}
                disabled={isActionLoading}
                className="text-[11px] font-semibold text-foreground-muted hover:text-success hover:bg-success-bg px-2 py-0.5 rounded-md transition-colors"
              >
                Set as Default
              </button>
            ) : null}

            {selectable && (
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-success bg-success text-white' : 'border-border bg-surface'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </div>
            )}
          </div>
        </div>

        {/* Recipient Details */}
        <div className="space-y-1 mb-3">
          {address.full_name && (
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <User className="w-3.5 h-3.5 text-foreground-muted" />
              <span>{address.full_name}</span>
            </div>
          )}

          {address.mobile_number && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted">
              <Phone className="w-3.5 h-3.5 text-foreground-muted" />
              <span>+91 {address.mobile_number}</span>
            </div>
          )}
        </div>

        {/* Formatted Address Lines */}
        <div className="text-xs text-foreground space-y-0.5 leading-relaxed mb-3">
          {address.flat_house_building && (
            <p className="font-semibold text-foreground">{address.flat_house_building}</p>
          )}

          {address.area_street_sector_village && (
            <p>{address.area_street_sector_village}</p>
          )}

          {address.landmark && (
            <p className="text-foreground-muted">Near {address.landmark}</p>
          )}

          <p className="font-medium text-foreground">
            {[address.town_city, address.state].filter(Boolean).join(', ')}
            {address.pincode ? ` - ${address.pincode}` : ''}
          </p>

          <p className="text-foreground-muted">{address.country || 'India'}</p>
        </div>

        {/* Weekend Delivery Availability Badges */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-border/80 mb-3 text-[11px]">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
              address.saturday_delivery
                ? 'bg-surface-muted text-foreground'
                : 'bg-error-bg text-error'
            }`}
          >
            {address.saturday_delivery ? (
              <CalendarCheck className="w-3 h-3 text-success" />
            ) : (
              <CalendarX className="w-3 h-3 text-error" />
            )}
            Sat Delivery: {address.saturday_delivery ? 'Yes' : 'No'}
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
              address.sunday_delivery
                ? 'bg-surface-muted text-foreground'
                : 'bg-error-bg text-error'
            }`}
          >
            {address.sunday_delivery ? (
              <CalendarCheck className="w-3 h-3 text-success" />
            ) : (
              <CalendarX className="w-3 h-3 text-error" />
            )}
            Sun Delivery: {address.sunday_delivery ? 'Yes' : 'No'}
          </span>
        </div>

        {/* Instructions preview if present */}
        {address.delivery_instructions && (
          <p className="text-[11px] text-foreground-muted italic bg-surface-muted p-2 rounded-lg mb-3">
            "{address.delivery_instructions}"
          </p>
        )}
      </div>

      {/* Action Buttons: Edit & Delete */}
      {(onEdit || onDelete) && (
        <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                disabled={isActionLoading}
                className="flex items-center gap-1 text-xs font-semibold text-foreground-muted hover:text-foreground bg-surface-muted hover:bg-border/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={isActionLoading}
                className="flex items-center gap-1 text-xs font-semibold text-error hover:text-error hover:bg-error-bg px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
