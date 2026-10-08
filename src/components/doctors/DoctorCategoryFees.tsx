import React from 'react';
import { Doctor } from '../../types';
import { feeFor } from '../../lib/fees';
import { Wallet } from 'lucide-react';

interface DoctorCategoryFeesProps {
  doctor: Doctor;
  selectedCategoryId: number | null;
  onSelect: (categoryId: number) => void;
}

// Fee-by-speciality table; doubles as the picker that decides which price the
// header buttons, booking panel and the server-side charge all use.
export const DoctorCategoryFees: React.FC<DoctorCategoryFeesProps> = ({
  doctor,
  selectedCategoryId,
  onSelect,
}) => {
  const categories = doctor.categories ?? [];
  if (!categories.length) return null;
  const single = categories.length === 1;

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl bg-white space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-blue-600" />
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Consultation Fee by Speciality</p>
      </div>

      <div className="space-y-2">
        {categories.map((c) => {
          const active = c.categoryId === selectedCategoryId;
          return (
            <button
              key={c.categoryId}
              type="button"
              disabled={single}
              aria-pressed={active}
              onClick={() => onSelect(c.categoryId)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
                active
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-slate-50 hover:border-blue-300'
              } ${single ? 'cursor-default' : ''}`}
            >
              <span className="text-sm font-extrabold text-slate-900">{c.title}</span>
              <span className="text-xs font-bold text-slate-500 tabular-nums whitespace-nowrap">
                Home ₹{feeFor(doctor, 'home', c.categoryId)} · Video ₹{feeFor(doctor, 'online', c.categoryId)}
              </span>
            </button>
          );
        })}
      </div>

      {single && (
        <p className="text-[11px] text-slate-400">
          {doctor.name} offers {categories[0].title} consultations only.
        </p>
      )}
    </div>
  );
};
