import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { useCategories } from '../../hooks/queries';
import { motion } from 'framer-motion';
import { ArrowRight, Stethoscope, Loader2, Layers } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../lib/motion';

interface CategoriesGridProps {
  showViewAll?: boolean;
  showHeader?: boolean;
}

export const CategoriesGrid: React.FC<CategoriesGridProps> = ({
  showViewAll = true,
  showHeader = true,
}) => {
  const { navigateToCategory, setCurrentPage } = useBooking();
  const { data: categories = [], isLoading } = useCategories();

  return (
    <section className="py-20 bg-slate-50 relative border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        {showHeader && (
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <Layers className="w-3.5 h-3.5" />
              <span>Clinical Specialties</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Specialized Therapy <span className="text-gradient">Categories</span>
            </h2>
            <p className="text-slate-600 text-base">
              Browse our clinical divisions to find doctors tailored to your exact physical rehabilitation requirements.
            </p>
          </div>
        )}

        {/* Categories Grid */}
        {isLoading ? (
          <div className="text-center py-16 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading specialties...
          </div>
        ) : (
        <motion.div
          variants={staggerContainer(0.06, 0.05)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              variants={fadeUp(24)}
              onClick={() => navigateToCategory(cat.slug)}
              className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200 hover:border-blue-300 transition-all duration-500 shadow-lg hover:shadow-xl cursor-pointer"
            >
              {/* Background Image with Overlay */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                {/* Top Doctors Count Pill */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold text-slate-900 flex items-center gap-1.5 shadow-md border border-slate-200/80">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                  <span>{cat.doctorCount} Certified Doctors</span>
                </div>

                {/* Title & Description */}
                <div className="absolute bottom-4 left-5 right-5 text-white space-y-2">
                  <h3 className="text-2xl font-bold group-hover:text-teal-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>

                  {/* Key Condition Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.conditions.slice(0, 3).map((cond, i) => (
                      <span key={i} className="text-[10px] font-semibold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md text-slate-100">
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover Action Bar */}
              <div className="px-5 py-4 bg-white flex items-center justify-between border-t border-slate-200">
                <span className="text-xs font-bold text-slate-600">
                  Book Specialty Doctors
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>
        )}

        {showViewAll && (
          <div className="text-center mt-12">
            <button
              onClick={() => setCurrentPage('categories')}
              className="btn-gradient text-white px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl shadow-blue-500/25 inline-flex items-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <span>View All Clinical Specialties</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
