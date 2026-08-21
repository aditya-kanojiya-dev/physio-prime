import React from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/queries';
import { motion } from 'framer-motion';
import { ArrowUpRight, Stethoscope, Loader2, Layers, ShieldCheck } from 'lucide-react';

interface CategoriesGridProps {
  showViewAll?: boolean;
  showHeader?: boolean;
}

export const CategoriesGrid: React.FC<CategoriesGridProps> = ({
  showViewAll = true,
  showHeader = true,
}) => {
  const { data: categories = [], isLoading } = useCategories();

  return (
    <section className="py-10 lg:py-14 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {showHeader && (
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/70 text-teal-700 text-xs font-semibold tracking-wide shadow-sm">
                <Layers className="w-4 h-4 text-teal-500" />
                <span>Clinical Specialties</span>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Specialized Therapy{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                    Categories
                  </span>
                </h2>
                <p className="text-slate-600 text-base max-w-xl mt-3 leading-relaxed">
                  Browse our clinical divisions to find doctors tailored to your exact physical rehabilitation requirements.
                </p>
              </div>
            </div>

            <Link
              to="/doctors"
              className="group self-start md:self-auto px-6 py-3 rounded-xl font-semibold text-sm text-blue-700 bg-blue-50/80 border border-blue-200/60 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md flex items-center gap-2 transition-all duration-200"
            >
              <span>Find Therapists</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Loading specialties...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.slice(0, showViewAll ? 8 : undefined).map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`h-full ${idx >= 4 ? 'hidden lg:block' : ''}`}
              >
                <Link
                  to={`/categories/${cat.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-teal-300 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Image Banner */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={cat.image}
                        alt={cat.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />

                      {/* Doctor Count Pill */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-900 flex items-center gap-1 shadow-sm border border-slate-200/80">
                        <Stethoscope className="w-3 h-3 text-teal-500" />
                        <span>{cat.doctorCount} Doctors</span>
                      </div>

                      {/* Title Overlay */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                          {cat.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Description Content */}
                    <div className="p-5 space-y-2.5">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.conditions.slice(0, 2).map((cond, i) => (
                          <span key={i} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {cond}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 pb-5 pt-3 flex items-center justify-between border-t border-slate-200">
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-500" /> Verified Specialists
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
