import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Doctor } from '../../types';
import { useBooking } from '../../context/BookingContext';
import { Star, MapPin, Clock, Home, Video, CheckCircle2, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface DoctorCardProps {
  doctor: Doctor;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const navigate = useNavigate();
  const { openBookingModal } = useBooking();

  const handleViewProfile = () => {
    navigate(`/doctor/${doctor.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group glass-panel rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl flex flex-col justify-between"
    >
      <div>
        
        {/* Photo Header */}
        <div className="relative h-60 overflow-hidden bg-slate-100">
          <img
            src={doctor.photo}
            alt={doctor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

          {/* Rating Badge */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md border border-slate-200">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{doctor.rating}</span>
            <span className="text-[10px] text-slate-500 font-medium">({doctor.reviewCount})</span>
          </div>

          {/* Verified Checkmark */}
          {doctor.verified && (
            <div className="absolute top-4 right-4 glass-panel border border-slate-200/50 px-2.5 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Verified Doctor</span>
            </div>
          )}

          {/* Bottom Overlay Text */}
          <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
            <h3
              onClick={handleViewProfile}
              className="text-2xl font-bold hover:text-teal-300 transition-colors cursor-pointer"
            >
              {doctor.name}
            </h3>
            <p className="text-xs text-teal-300 font-semibold">{doctor.specialty}</p>
            <p className="text-xs text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {doctor.location.area}, {doctor.location.city}
            </p>
          </div>
        </div>

        {/* Doctor Details Body */}
        <div className="p-6 space-y-4">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Experience</p>
              <p className="font-extrabold text-slate-900">{doctor.experienceYears} Years</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Home Visit Fee</p>
              <p className="font-extrabold text-blue-600">₹{doctor.fees.home} / Session</p>
            </div>
          </div>

          {/* Consultation Modes & Languages */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 flex-wrap">
              <span className="text-slate-400">Available via:</span>
              {doctor.fees.home > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1">
                  <Home className="w-3 h-3 text-blue-600" /> Home Visit
                </span>
              )}
              {doctor.fees.online > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 border border-teal-200 font-bold flex items-center gap-1">
                  <Video className="w-3 h-3 text-teal-500" /> Video
                </span>
              )}
            </div>

            {doctor.homeVisitsEnabled && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Navigation className="w-3 h-3" />
                Home Visit Available
              </div>
            )}

            {doctor.locations && doctor.locations.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 flex-wrap">
                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                {doctor.locations.filter(l => l.active).map(l => l.area).filter(Boolean).join(' · ')}
              </div>
            )}

            <div className="text-xs text-slate-500">
              <strong className="text-slate-600">Languages:</strong> {doctor.languages.join(', ')}
            </div>
          </div>

          {/* Next Available Pill */}
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-2 rounded-xl border border-teal-200">
            <Clock className="w-4 h-4 text-teal-500 flex-shrink-0" />
            <span>Next Available Slot: <strong>{doctor.nextAvailable}</strong></span>
          </div>

        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 pt-0 grid grid-cols-2 gap-3">
        <button
          onClick={handleViewProfile}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          View Full Profile
        </button>

        <button
          onClick={() => openBookingModal({ doctor, mode: 'home' })}
          className="w-full btn-gradient text-white py-3 px-4 rounded-xl font-extrabold text-xs shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          BOOK NOW
        </button>
      </div>

    </motion.div>
  );
};