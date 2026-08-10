import React from 'react';
import { CategoriesGrid } from '../components/home/CategoriesGrid';
import { Layers } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Layers className="w-3.5 h-3.5" />
            <span>Clinical Specialties</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Specialized Therapy <span className="text-gradient">Categories</span>
          </h1>
          <p className="text-slate-600 text-base">
            Browse our clinical divisions to find doctors tailored to your exact physical rehabilitation requirements.
          </p>
        </div>

        <CategoriesGrid />

      </div>
    </div>
  );
};
