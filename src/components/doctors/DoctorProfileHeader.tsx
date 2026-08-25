import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Doctor } from '../../types';
import { Star, ShieldCheck, MapPin, CheckCircle2, Home, Video } from 'lucide-react';
import primeBadge from '../../assets/prime-badge.png';

interface DoctorProfileHeaderProps {
  doctor: Doctor;
}

export const DoctorProfileHeader: React.FC<DoctorProfileHeaderProps> = ({ doctor }) => {
  const navigate = useNavigate();

  return (
    <div className="relative glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl bg-white overflow-hidden">
      
      {/* Background Decorative Blob */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Doctor Photo */}
        <div className="lg:col-span-4 relative flex justify-center">
          <div className="relative w-56 sm:w-64 h-64 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" />
            {doctor.featured && (
              <div className="absolute top-3 left-3 drop-shadow-md">
                <img src={primeBadge} alt="Prime Physiotherapist" className="h-10 w-auto" />
              </div>
            )}
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900 shadow-sm">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-teal-500" /> Verified Doctor
              </span>
              <span className="text-teal-600 font-semibold">Nagpur Council</span>
            </div>
          </div>
        </div>

        {/* Doctor Details */}
        <div className="lg:col-span-8 space-y-5 text-center lg:text-left">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{doctor.title}</span>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {doctor.name}
              </h1>
              {doctor.featured && (
                <img src={primeBadge} alt="Prime Physiotherapist" className="h-12 sm:h-14 w-auto drop-shadow-sm" />
              )}
            </div>
            
            <p className="text-base text-teal-600 font-bold">
              {doctor.specialty}
            </p>

            <p className="text-xs sm:text-sm text-slate-500 flex items-center justify-center lg:justify-start gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" /> {doctor.location.address}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-xl mx-auto lg:mx-0">
            <div className="text-center">
              <p className="text-xs text-slate-500 font-semibold">Patients Treated</p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900">{doctor.patientsTreated}+</p>
            </div>
            <div className="text-center border-x border-slate-200">
              <p className="text-xs text-slate-500 font-semibold">Experience</p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900">{doctor.experienceYears} Years</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-semibold">Overall Rating</p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {doctor.rating}
              </p>
            </div>
          </div>

          {/* Consultation Modes & Action */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button
              onClick={() => navigate('/book', { state: { doctor, mode: 'home' } })}
              className="btn-gradient text-white px-6 py-3 rounded-xl font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Home className="w-4 h-4 text-teal-200" />
              <span>Book Home Visit (₹{doctor.fees.home})</span>
            </button>

            <button
              onClick={() => navigate('/book', { state: { doctor, mode: 'online' } })}
              className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 bg-white border border-slate-200 hover:border-teal-400 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Video className="w-4 h-4 text-teal-500" />
              <span>Video Consult (₹{doctor.fees.online})</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
