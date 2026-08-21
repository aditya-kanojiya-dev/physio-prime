import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { COMPARISON_ROWS, DISCLAIMER_TEXT } from '../../data/conditions';

export const ComparisonTable: React.FC = () => (
  <section className="max-w-3xl mx-auto">
    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-5">
      In-clinic vs home visit physiotherapy
    </h2>
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            <th className="text-left font-bold text-slate-500 px-5 py-3.5">What to compare</th>
            <th className="text-left font-bold text-blue-700 px-5 py-3.5">In-clinic</th>
            <th className="text-left font-bold text-teal-700 px-5 py-3.5">Home visit</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-0">
              <td className="px-5 py-3.5 font-bold text-slate-900 align-top">{row.label}</td>
              <td className="px-5 py-3.5 text-slate-600 align-top">{row.clinic}</td>
              <td className="px-5 py-3.5 text-slate-600 align-top">{row.home}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export const DisclaimerBlock: React.FC = () => (
  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl mx-auto text-center px-4">
    {DISCLAIMER_TEXT}
  </p>
);

interface UrgentCareProps {
  conditionName: string;
  symptoms: string[];
}

export const UrgentCareCallout: React.FC<UrgentCareProps> = ({ conditionName, symptoms }) => (
  <section className="max-w-3xl mx-auto rounded-2xl border border-amber-300 bg-amber-50 p-6 sm:p-8">
    <div className="flex items-center gap-2.5 mb-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
      <h2 className="text-lg font-extrabold text-amber-900 tracking-tight">When to seek urgent care</h2>
    </div>
    <p className="text-sm text-amber-800 leading-relaxed mb-4">
      Physiotherapy is safe for most people with {conditionName.toLowerCase()}. But if you notice any of the
      red flags below, get urgent medical care first — physiotherapy comes after you are medically cleared.
    </p>
    <ul className="space-y-2 mb-4">
      {symptoms.map((s) => (
        <li key={s} className="flex items-start gap-2.5 text-sm text-amber-900">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
          {s}
        </li>
      ))}
    </ul>
    <p className="text-sm font-semibold text-amber-900">
      If any of these apply, contact emergency services or a doctor immediately.
    </p>
  </section>
);
