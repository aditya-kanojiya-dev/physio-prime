import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctors } from '../../hooks/queries';
import { motion, useInView } from 'framer-motion';
import { Calendar, ArrowRight, ShieldCheck, Users, MapPin, Star, Clock } from 'lucide-react';
import { fadeUp, staggerContainer, EASE_OUT } from '../../lib/motion';
import heroVid from '../../assets/hero-vid.webm';

const STATS = [
  { value: '10K', suffix: '+', label: 'Happy Patients', Icon: Users },
  { value: '100', suffix: '+', label: 'Verified Doctors', Icon: ShieldCheck },
  { value: '10', suffix: '+', label: 'Cities', Icon: MapPin },
  { value: '4.9', suffix: '', label: 'Avg Rating', Icon: Star },
];

function HeroStatValue({ value, suffix, active }: { value: string; suffix: string; active: boolean }) {
  const [text, setText] = useState('0');
  useEffect(() => {
    if (!active) return;
    const isK = value.endsWith('K');
    const target = isK ? Number(value.slice(0, -1)) * 1000 : Number(value);
    const decimals = value.includes('.') ? 1 : 0;
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setText(isK ? `${+(current / 1000).toFixed(1)}K` : current.toFixed(decimals));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, value]);
  return <>{text}{suffix}</>;
}

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { data: doctors = [] } = useDoctors();
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true });

  const urgency = useMemo(() => {
    if (!doctors.length) return null;
    const todayDoctors = doctors.filter(d => d.nextAvailable?.toLowerCase().includes('today'));
    if (todayDoctors.length > 0) {
      return { count: todayDoctors.length, text: `${todayDoctors.length} doctor${todayDoctors.length > 1 ? 's' : ''} available today` };
    }
    const upcoming = doctors.filter(d => d.nextAvailable && !d.nextAvailable.toLowerCase().includes('today'));
    if (upcoming.length > 0) {
      return { count: upcoming.length, text: `Next slot: ${upcoming[0].nextAvailable}` };
    }
    return null;
  }, [doctors]);

  return (
    <section className="relative pt-18 pb-16 lg:pt-28 lg:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left: Text content */}
          <motion.div
            variants={staggerContainer(0.1, 0.1)}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7"
          >
          {/* Headline */}
          <motion.h1
            variants={fadeUp(24)}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]"
          >
            Your Trusted Partner in{' '}
            <span className="text-gradient">Physiotherapy Care</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={fadeUp(24, 0.08)}
            className="mt-5 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl"
          >
            Book certified physiotherapists for <strong className="text-slate-900 font-semibold">Home Visits</strong> or instant <strong className="text-slate-900 font-semibold">HD Video Consultations</strong>. Recover comfortably at your speed.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp(24, 0.16)} className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/doctors')}
              className="btn-gradient text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Book a Consultation
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/booking-slots')}
              className="px-7 py-3.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm flex items-center gap-2.5 transition-all"
            >
              <Calendar className="w-4 h-4 text-teal-500" />
              Check Available Slots
            </button>
          </motion.div>

          {/* Urgency Badge */}
          {urgency && (
            <motion.div
              variants={fadeUp(24, 0.2)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Clock className="w-3.5 h-3.5" />
              <span>{urgency.text}</span>
            </motion.div>
          )}

          {/* Inline Stats */}
          <motion.div
            ref={statsRef}
            variants={fadeUp(24, 0.24)}
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            {STATS.map(({ value, suffix, label, Icon }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-900 leading-tight">
                    <HeroStatValue value={value} suffix={suffix} active={statsInView} />
                  </p>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>
          </motion.div>

          {/* Right: Hero video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE_OUT }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-2xl overflow-hidden">
              <video
                src={heroVid}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full aspect-[4/5] "
              />
              <div className="absolute inset-0 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};