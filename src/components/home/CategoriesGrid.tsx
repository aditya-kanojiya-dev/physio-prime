import React from 'react';
import { Link } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { useCategories } from '../../hooks/queries';
import { motion } from 'framer-motion';
import { ArrowRight, Stethoscope, Loader2, Layers } from 'lucide-react';
import { staggerContainer } from '../../lib/motion';

interface CategoriesGridProps {
  showViewAll?: boolean;
  showHeader?: boolean;
}

export const CategoriesGrid: React.FC<CategoriesGridProps> = ({
  showViewAll = true,
  showHeader = true,
}) => {
  const { setSelectedCategorySlug } = useBooking();
  const { data: categories = [], isLoading } = useCategories();

  return (
    <section className="py-12 lg:py-20 bg-slate-50 relative border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {showHeader && (
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                <Layers className="w-3.5 h-3.5" />
                <span>Clinical Specialties</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Specialized Therapy <span className="text-gradient">Categories</span>
              </h2>
              <p className="text-slate-600 text-base max-w-xl">
                Browse our clinical divisions to find doctors tailored to your exact physical rehabilitation requirements.
              </p>
            </div>

            <Link
              to="/doctors"
              className="self-start md:self-auto px-5 py-2.5 rounded-xl font-bold text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all"
            >
              <span>Find Therapists</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {categories.slice(0, showViewAll ? 6 : undefined).map((cat) => (
              <Link
                to="/doctors"
                key={cat.id}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-blue-300 transition-all duration-500 shadow-md hover:shadow-lg cursor-pointer block"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-slate-900 flex items-center gap-1.5 shadow-md border border-slate-200/80">
                    <Stethoscope className="w-3 h-3 text-teal-400" />
                    <span>{cat.doctorCount} Doctors</span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-white space-y-1">
                    <h3 className="text-lg font-bold group-hover:text-teal-300 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {cat.conditions.slice(0, 3).map((cond, i) => (
                        <span key={i} className="text-[9px] font-semibold bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-slate-100">
                          {cond}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-white flex items-center justify-between border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600">
                    Book Specialty Doctors
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};
