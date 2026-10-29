"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  badge?: string;
}

export interface SearchableComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | ComboboxOption)[];
  placeholder?: string;
  error?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableCombobox({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select or type...',
  error,
  allowCustom = true,
  disabled = false,
  className = '',
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync external value to internal query when value prop updates
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Normalize options into consistent ComboboxOption[]
  const normalizedOptions: ComboboxOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(trimmed) ||
        opt.value.toLowerCase().includes(trimmed) ||
        (opt.badge && opt.badge.toLowerCase().includes(trimmed))
    );
  }, [normalizedOptions, query]);

  // Check if current query is already an exact match in options
  const hasExactMatch = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return normalizedOptions.some((opt) => opt.value.toLowerCase() === trimmed || opt.label.toLowerCase() === trimmed);
  }, [normalizedOptions, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If user typed something and custom is allowed, ensure current query is saved
        if (allowCustom && query.trim()) {
          onChange(query.trim());
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [allowCustom, onChange, query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (selectedVal: string) => {
    setQuery(selectedVal);
    onChange(selectedVal);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setQuery(newText);
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (allowCustom) {
      onChange(newText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (allowCustom && query.trim()) {
        handleSelect(query.trim());
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className={`relative flex items-center w-full h-11 bg-surface border rounded-xl transition-all ${
          error
            ? 'border-error focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-error'
            : isOpen
            ? 'border-success ring-2 ring-emerald-500/20 shadow-sm'
            : 'border-border hover:border-border focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-success'
        } ${disabled ? 'opacity-60 bg-surface-muted cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full h-full pl-3.5 pr-10 bg-transparent text-xs font-medium text-foreground placeholder-slate-400 focus:outline-none"
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }
          }}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-foreground-muted hover:text-foreground-muted transition-colors"
          aria-label="Toggle dropdown"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-success' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-surface border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto py-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => {
              const isSelected = opt.value.toLowerCase() === value.toLowerCase();
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={`${opt.value}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-3.5 py-2.5 text-xs font-medium cursor-pointer flex items-center justify-between transition-colors ${
                    isHighlighted
                      ? 'bg-success-bg text-success'
                      : isSelected
                      ? 'bg-success-bg/50 text-success font-semibold'
                      : 'text-foreground hover:bg-surface-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-muted text-foreground-muted">
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-success shrink-0 ml-2" />}
                </li>
              );
            })
          ) : (
            <li className="px-3.5 py-3 text-xs text-foreground-muted italic text-center">
              No exact matches found
            </li>
          )}

          {/* Prompt to use custom entered text if allowCustom is true and not exact match */}
          {allowCustom && query.trim() && !hasExactMatch && (
            <li
              role="option"
              onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
              onClick={() => handleSelect(query.trim())}
              className={`px-3.5 py-2.5 text-xs cursor-pointer border-t border-border flex items-center gap-2 text-success bg-success-bg/60 hover:bg-success-bg font-semibold transition-colors`}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Use custom: &quot;{query.trim()}&quot;</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
