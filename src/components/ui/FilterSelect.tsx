import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: FilterSelectOption[];
  searchable?: boolean;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({ value, onChange, placeholder, options, searchable = true }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const selected = options.find(o => o.value === value);
  // ponytail: case-insensitive substring filter, good enough for <100 flat options
  const visible = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 bg-white border rounded-xl px-3 py-2.5 text-sm text-left transition-all ${
          open ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className={`truncate ${selected ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/5 p-1.5"
          >
            {searchable && (
              <div className="p-1 pb-1.5 sticky top-0 bg-white">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search ${placeholder.toLowerCase()}...`}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            )}
            <div className="max-h-52 overflow-y-auto">
              {visible.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    o.value === value
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              ))}
              {visible.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">No matches</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};