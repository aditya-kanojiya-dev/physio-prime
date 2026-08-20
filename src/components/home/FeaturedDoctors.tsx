import React, { useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { useDoctors } from '../../hooks/queries';
import { Doctor } from '../../types';
import { Star, MapPin, Clock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

/**
 * Design note: doctor cards are styled as clinic ID badges — clipped at the
 * top, a specialty-coded accent stripe, circular headshot with a verified
 * pin, a foil-style rating seal, and a decorative barcode strip standing in
 * for "next available."
 */

const ACCENTS = ['#2563EB', '#0D9488', '#D97706', '#E11D48'];

function accentFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

function barcodeWidths(seed: string) {
  const widths: number[] = [];
  for (let i = 0; i < 26; i++) {
    const code = seed.charCodeAt(i % seed.length) + i;
    widths.push((code % 3) + 1.5);
  }
  return widths;
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { navigateToDoctor } = useBooking();
  const navigate = useNavigate();
  const accent = useMemo(() => accentFor(doctor.specialty || doctor.name), [doctor.specialty, doctor.name]);
  const bars = useMemo(() => barcodeWidths(String(doctor.id)), [doctor.id]);

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 hover:-rotate-1 transition-all duration-300 pt-8 h-full">
      {/* lanyard clip + grommet */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        <div
          className="w-6 h-3 rounded-t-sm rounded-b-[3px]"
          style={{ background: 'linear-gradient(180deg, #E2E8F0, #94A3B8)' }}
        />
        <div className="w-3.5 h-3.5 -mt-0.5 rounded-full border-2 border-slate-300 bg-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]" />
      </div>

      {/* specialty-coded accent stripe */}
      <div className="h-2 w-full rounded-t-[14px]" style={{ background: accent }} />

      <div className="px-5 pt-4 pb-5">
        {/* photo, name, rating seal */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <img
              src={doctor.photo}
              alt={doctor.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-white border border-slate-200 shadow-sm"
            />
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-white flex items-center justify-center ring-2 ring-white"
              style={{ background: accent }}
            >
              <CheckCircle2 className="w-3 h-3" />
            </span>
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3
              onClick={() => navigateToDoctor(doctor.id)}
              className="text-base font-extrabold text-slate-900 leading-tight truncate cursor-pointer hover:text-blue-600 transition-colors"
            >
              {doctor.name}
            </h3>
            <p className="text-[10.5px] font-bold uppercase tracking-wide truncate" style={{ color: accent }}>
              {doctor.specialty}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-2.5 h-2.5 shrink-0" /> {doctor.location.area}, {doctor.location.city}
            </p>
          </div>

          <div
            className="shrink-0 w-11 h-11 rounded-full flex flex-col items-center justify-center text-white shadow-md"
            style={{ background: `conic-gradient(from 180deg, #FDE68A, #F59E0B, #FBBF24, #FDE68A)` }}
          >
            <Star className="w-3 h-3 fill-white" />
            <span className="text-[10px] font-black leading-none mt-0.5">{doctor.rating}</span>
          </div>
        </div>

        {/* badge spec rows */}
        <div className="grid grid-cols-2 gap-x-3 py-2.5 border-y border-dashed border-slate-200 text-[11px] mb-3.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">EXP</span>
            <span className="font-mono font-bold text-slate-900">{doctor.experienceYears}Y</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">HOME FEE</span>
            <span className="font-mono font-bold" style={{ color: accent }}>
              ₹{doctor.fees.home}
            </span>
          </div>
        </div>

        {/* decorative barcode + next available */}
        <div className="mb-4">
          <div className="flex items-end gap-[1.5px] h-5 mb-1 opacity-70" aria-hidden="true">
            {bars.map((w, i) => (
              <span
                key={i}
                style={{ width: `${w}px`, background: i % 5 === 0 ? accent : '#1E293B' }}
                className="h-full"
              />
            ))}
          </div>
          <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> NEXT:{' '}
            <strong className="text-slate-900">{doctor.nextAvailable}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigateToDoctor(doctor.id)}
            className="w-full py-2 px-3 rounded-lg font-bold text-[10px] text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            View Profile
          </button>
          <button
            onClick={() => navigate('/book', { state: { doctor, mode: 'home' } })}
            className="w-full btn-gradient text-white py-2 px-3 rounded-lg font-extrabold text-[10px] shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            BOOK NOW
          </button>
        </div>
      </div>
    </div>
  );
}

export const FeaturedDoctors: React.FC = () => {
  const { data: doctors = [], isLoading } = useDoctors();
  const marqueeRef = useRef<HTMLDivElement>(null);

  const pauseMarquee = () => {
    if (marqueeRef.current) marqueeRef.current.style.animationPlayState = 'paused';
  };
  const resumeMarquee = () => {
    if (marqueeRef.current) marqueeRef.current.style.animationPlayState = 'running';
  };

  return (
    <section className="py-10 lg:py-14 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span>Certified Healthcare Specialists</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Top Featured <span className="text-gradient">Physiotherapists</span>
            </h2>
            <p className="text-slate-600 text-base max-w-xl">
              Hand-picked certified physical therapists available for home visits and HD video consultations today.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link to="/doctors" className="px-5 py-2.5 rounded-xl font-bold text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading therapists...
          </div>
        ) : (
          <>
            {/* Infinite auto-slider — responsive: 1 card mobile, 3 desktop */}
            <div className="-mx-4 sm:-mx-6 md:mx-0 overflow-hidden">
              <div
                ref={marqueeRef}
                onTouchStart={pauseMarquee}
                onTouchEnd={resumeMarquee}
                onTouchCancel={resumeMarquee}
                className="flex gap-4 md:gap-5 animate-marquee px-4 sm:px-6 md:px-0"
                style={{ width: 'max-content' }}
              >
                {[...doctors, ...doctors].map((doctor, i) => (
                  <div
                    key={`${doctor.id}-${i}`}
                    className="shrink-0 w-[85vw] md:w-[calc((min(100vw,80rem)-2rem-2.5rem)/3)]"
                  >
                    <DoctorCard doctor={doctor} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee ${doctors.length * 4}s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};