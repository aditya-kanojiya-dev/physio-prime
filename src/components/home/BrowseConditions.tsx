import React from 'react';
import { Link } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { useSymptoms } from '../../hooks/queries';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, ShieldCheck, Loader2, Stethoscope } from 'lucide-react';
import { staggerContainer, fadeUp } from '../../lib/motion';

export const BrowseConditions: React.FC = () => {
  const { setSelectedSymptomSlug } = useBooking();
  const { data: symptoms = [], isLoading } = useSymptoms();

  return (
    <section className="py-16 lg:py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Browse by <span className="text-gradient">Condition</span>
            </h2>
            <p className="mt-2 text-slate-600 text-base max-w-xl">
              Choose your condition for tailored rehabilitation plans designed by certified physiotherapists.
            </p>
          </div>

          <Link
            to="/categories"
            className="self-start md:self-auto px-5 py-2.5 rounded-xl font-bold text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all"
          >
            View All Conditions
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-16 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading conditions...
          </div>
        ) : (
          <motion.div
            variants={staggerContainer(0.06, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {symptoms.slice(0, 6).map((symptom) => {
              const symptomItems = symptom.symptomsList
                ? symptom.symptomsList.split(';').map((s) => s.trim()).filter(Boolean)
                : [];
              return (
                <motion.div key={symptom.id} variants={fadeUp(20)}>
                  <Link
                    to="/doctors"
                    onClick={() => setSelectedSymptomSlug(symptom.slug)}
                    className="group block bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 h-full"
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={symptom.image}
                        alt={symptom.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3 text-teal-500" />
                        {symptom.recoveryEstimate}
                      </div>

                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                          {symptom.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {symptom.description}
                      </p>

                      {symptomItems.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Stethoscope className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Symptoms</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {symptomItems.slice(0, 3).map((item) => (
                              <span key={item} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                                {item}
                              </span>
                            ))}
                            {symptomItems.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                                +{symptomItems.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {symptom.treatment && (
                        <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 italic">
                          {symptom.treatment}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-bold text-teal-600 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified Specialists
                        </span>
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};
