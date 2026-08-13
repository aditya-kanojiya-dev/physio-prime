import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, BadgeCheck, Clock } from 'lucide-react';
import { Doctor } from '../../types';

interface DoctorChatCardProps {
  doctor: Doctor;
  mode: 'home' | 'online';
}

const MODE_LABELS: Record<'home' | 'online', string> = {
  home: 'Home Visit',
  online: 'Video Consult',
};

export const DoctorChatCard: React.FC<DoctorChatCardProps> = ({ doctor, mode }) => {
  const handleBook = () => {
    (window as any).handleQuickReply?.(`doctor-${doctor.id}`, doctor.name);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="flex items-start gap-3 p-3">
        <img
          src={doctor.photo}
          alt={doctor.name}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-slate-100"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-slate-900 truncate">{doctor.name}</h4>
            {doctor.verified && <BadgeCheck className="w-4 h-4 text-teal-500 flex-shrink-0" />}
          </div>
          <p className="text-[11px] text-teal-600 font-semibold truncate">{doctor.specialty}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="flex items-center gap-0.5 font-semibold text-slate-700">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {doctor.rating}
            </span>
            <span className="text-slate-300">|</span>
            <span>{doctor.experienceYears} yrs exp</span>
          </div>
          <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            {doctor.location.area}, {doctor.location.city}
          </p>
        </div>
      </div>

      <div className="px-3 pb-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] text-slate-400 font-medium">₹{doctor.fees[mode]}/session · {MODE_LABELS[mode]}</p>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 mt-0.5">
            <Clock className="w-3 h-3 text-teal-500" /> Next: {doctor.nextAvailable}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBook}
          className="btn-gradient text-white text-[11px] font-extrabold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all"
        >
          Book Now
        </motion.button>
      </div>
    </motion.div>
  );
};
