import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { useDoctors } from '../../hooks/queries';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, MapPin, Clock, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../lib/motion';

export const FeaturedDoctors: React.FC = () => {
  const { openBookingModal, navigateToDoctor, setCurrentPage } = useBooking();
  const { data: doctors = [], isLoading } = useDoctors();

  return (
    <section className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Certified Healthcare Specialists</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Top Featured <span className="text-gradient">Physiotherapists</span>
            </h2>
            <p className="text-slate-600 text-base max-w-xl">
              Hand-picked certified physical therapists available for home visits and HD video consultations today.
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('doctors')}
            className="self-start md:self-auto px-5 py-2.5 rounded-xl font-bold text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all"
          >
            <span>View All Doctors</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Doctor Cards Grid */}
        {isLoading ? (
          <div className="text-center py-16 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading therapists...
          </div>
        ) : (
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {doctors.slice(0, 3).map((doctor) => (
            <motion.div
              key={doctor.id}
              variants={fadeUp(24)}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Doctor Photo Header */}
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                  {/* Rating Badge */}
                  <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md border border-slate-200 text-slate-900">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{doctor.rating}</span>
                    <span className="text-[10px] font-medium text-slate-500">({doctor.reviewCount})</span>
                  </div>

                  {/* Verified Doctor Pill */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-900 flex items-center gap-1 border border-slate-200/80 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                    <span>Verified Doctor</span>
                  </div>

                  {/* Overlay Info */}
                  <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={() => navigateToDoctor(doctor.id)}
                        className="text-2xl font-bold hover:text-teal-300 transition-colors cursor-pointer"
                      >
                        {doctor.name}
                      </h3>
                    </div>
                    <p className="text-xs text-teal-300 font-semibold">{doctor.specialty}</p>
                    <p className="text-xs text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {doctor.location.area}, {doctor.location.city}
                    </p>
                  </div>
                </div>

                {/* Key Metrics Bar */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 py-2 px-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <p className="text-slate-500 font-medium">Experience</p>
                      <p className="font-extrabold text-slate-900">{doctor.experienceYears} Years</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Home Consultation</p>
                      <p className="font-extrabold text-blue-600">₹{doctor.fees.home} / Session</p>
                    </div>
                  </div>

                  {/* Next Availability Slot */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-2 rounded-xl border border-teal-200">
                    <Clock className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <span>Next Available: <strong>{doctor.nextAvailable}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigateToDoctor(doctor.id)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  View Profile
                </button>

                <button
                  onClick={() => openBookingModal({ doctor, mode: 'home' })}
                  className="w-full btn-gradient text-white py-3 px-4 rounded-xl font-extrabold text-xs shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  BOOK NOW
                </button>
              </div>

            </motion.div>
          ))}
        </motion.div>
        )}

      </div>
    </section>
  );
};
