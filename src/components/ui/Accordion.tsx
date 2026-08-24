import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  title: string;
  desc?: string;
  content: React.ReactNode;
}

// ponytail: one accordion pattern for every page — chevron rotates, height animates
export const Accordion: React.FC<{ items: AccordionItem[] }> = ({ items }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <div key={item.title} className="rounded-2xl bg-white border border-slate-200/90 shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              aria-expanded={open}
              className="w-full flex items-start justify-between gap-4 p-6 text-left"
            >
              <span>
                <span className="block font-bold text-slate-900">{item.title}</span>
                {item.desc && <span className="block text-sm text-slate-500 mt-1">{item.desc}</span>}
              </span>
              <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 mt-0.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
