import React from 'react';
import { ShieldCheck, Home, Video, FileText, Zap, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '../../lib/motion';

/**
 * Design note: this section is styled as the treatment-tracking whiteboard you'd
 * actually find mounted in a physio clinic — benefits read as index cards pinned
 * or washi-taped to the board, in a marker/ink palette instead of the site's usual
 * gradient-icon-tile pattern. Hovering a card's badge draws a hand-drawn circle
 * around it, like a therapist circling a note during a consult.
 *
 * 'Caveat' (marker/handwriting face) is used sparingly for annotations only —
 * headings and body stay on the site's existing type system. For production,
 * move the @import below into your global stylesheet / index.html instead of
 * loading it per-section.
 */

const INK = {
  blue: '#2454D6',
  teal: '#0E8F82',
  red: '#D6365B',
  amber: '#B8760A',
};

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Certified Expert Doctors',
    desc: 'Every therapist undergoes a rigorous 5-stage medical credential verification, council registration check, and background audit.',
    ink: INK.blue,
    badge: '100% Verified',
  },
  {
    icon: Home,
    title: 'On-Demand Home Visits',
    desc: 'Receive specialized rehabilitation in the comfort of your home equipped with portable electrotherapy & manual gear.',
    ink: INK.teal,
    badge: 'Doorstep Care',
  },
  {
    icon: Video,
    title: 'HD Video Consultation',
    desc: 'Connect with senior specialists anywhere for instant posture analysis, exercise guidance, and progress tracking.',
    ink: INK.blue,
    badge: 'Instant Access',
  },
  {
    icon: FileText,
    title: 'Digital Prescriptions & EHR',
    desc: 'Access your therapy history, custom exercise videos, and digital doctor notes directly in your account dashboard.',
    ink: INK.amber,
    badge: 'Cloud Sync',
  },
  {
    icon: Zap,
    title: 'Fast 1-Click Booking',
    desc: 'Select preferred dates and morning, afternoon, or evening slots in under 30 seconds with no complex hospital queues.',
    ink: INK.red,
    badge: '< 30 Seconds',
  },
  {
    icon: Award,
    title: 'Affordable Transparent Fees',
    desc: 'Clear upfront session rates with zero hidden charges. Flexible pay-per-session or discounted recovery packages.',
    ink: INK.teal,
    badge: 'Best Value',
  },
];

// Deterministic per-card tilt and pin/tape alternation so the board reads as
// "actually pinned up" rather than a grid pretending to be casual.
const ROTATIONS = [-2.2, 1.6, -1.2, 2, -1.8, 1.2];

function ScribbleCircle({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 126 50"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-x-3 -inset-y-2 w-[calc(100%+1.5rem)] h-[calc(100%+1rem)] opacity-0 scale-90 origin-center transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100"
      aria-hidden="true"
    >
      <path
        d="M10,25 C9,11 29,2 61,3 C96,4 117,13 116,26 C117,41 94,48 60,47 C27,46 11,41 10,25 Z"
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

const cardVariants = {
  hidden: (i: number) => ({ opacity: 0, y: 28, rotate: 0, scale: 0.96 }),
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: ROTATIONS[i % ROTATIONS.length],
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-12 lg:py-20 relative overflow-hidden bg-[#EFF8F4]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');`}</style>

      {/* wall behind the board: faint texture so the mounted board reads as an object */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
            backgroundImage:
              'radial-gradient(circle at 20% 15%, rgba(8,145,178,0.05), transparent 45%), radial-gradient(circle at 85% 80%, rgba(13,148,136,0.05), transparent 45%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* the mounted whiteboard */}
        <div
          className="relative rounded-[22px] border-[12px] border-[#B8DED4] bg-[#F2FBF8] shadow-[0_35px_70px_-30px_rgba(30,42,37,0.4)] px-5 py-14 sm:px-10 sm:py-16 lg:px-14"
        >
          {/* board surface grid lines */}
          <div
            className="absolute inset-3 rounded-md pointer-events-none opacity-[0.5]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(30,42,37,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30,42,37,0.045) 1px, transparent 1px)',
              backgroundSize: '38px 38px',
            }}
          />
          {/* corner mounting screws */}
          {['left-4 top-4', 'right-4 top-4', 'left-4 bottom-4', 'right-4 bottom-4'].map((pos) => (
            <span
              key={pos}
              className={`absolute ${pos} w-2.5 h-2.5 rounded-full bg-[#7EC4B8] shadow-[inset_0_1px_1px_rgba(0,0,0,0.4)]`}
            />
          ))}

          {/* header: taped title card at top of board */}
          <div className="relative text-center max-w-3xl mx-auto mb-16">
            <div
              className="inline-block px-5 py-1.5 mb-5 rotate-[-1deg] bg-[#FBEFD2]/90 border border-[#E7D9A6] shadow-sm"
              style={{ clipPath: 'polygon(2% 8%, 98% 0%, 100% 92%, 1% 100%)' }}
            >
              <span
                className="flex items-center gap-2 text-[13px] font-bold tracking-wide"
                style={{ color: INK.amber }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                THE PHYSIOPRIME BOARD
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight relative inline-block">
              Why Patients &amp; Doctors <span className="text-gradient">Trust Us</span>
              <svg
                viewBox="0 0 340 18"
                className="absolute left-0 -bottom-2 w-full h-4 text-blue-500/70"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M4,10 C70,2 150,15 200,7 C250,1 300,13 336,6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              </svg>
            </h2>
            <p className="text-slate-500 text-base mt-5">
              We bridge the gap between hospital-grade clinical precision and convenient home-based healing.
            </p>
          </div>

          {/* pinned benefit cards */}
          <motion.div
            variants={staggerContainer(0.08, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10"
          >
            {benefits.map((item, i) => {
              const Icon = item.icon;
              const usesPin = i % 2 === 0;
              return (
                <motion.div
                  key={item.title}
                  custom={i}
                  variants={cardVariants}
                  className="group relative"
                  style={{ transformOrigin: 'top center' }}
                >
                  {/* pin or washi tape, alternating */}
                  {usesPin ? (
                    <span
                      className="absolute left-1/2 -top-3 -translate-x-1/2 w-4 h-4 rounded-full z-20 shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
                      style={{
                        background: `radial-gradient(circle at 35% 30%, #fff, ${item.ink} 70%)`,
                      }}
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className="absolute left-1/2 -top-3.5 -translate-x-1/2 w-12 h-6 rotate-[-4deg] z-20 opacity-80"
                      style={{
                        background:
                          'repeating-linear-gradient(135deg, rgba(184,118,10,0.55) 0 6px, rgba(184,118,10,0.4) 6px 12px)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}
                      aria-hidden="true"
                    />
                  )}

                  <div className="h-full bg-white p-6 shadow-[0_10px_20px_-8px_rgba(30,42,37,0.25)] border border-black/5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="inline-flex items-center justify-center w-11 h-11 rounded-full border-2"
                        style={{ borderColor: item.ink, color: item.ink }}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2.25} />
                      </span>

                      <span className="relative inline-block px-1.5 py-0.5">
                        <ScribbleCircle color={item.ink} />
                        <span
                          className="relative text-[17px] leading-none -rotate-2 inline-block"
                          style={{ fontFamily: "'Caveat', cursive", color: item.ink, fontWeight: 700 }}
                        >
                          {item.badge}
                        </span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1.5">{item.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* decorative sticky note, desktop only */}
          <div
            className="hidden lg:block absolute -bottom-5 -right-4 w-36 px-3 py-3 rotate-[-6deg] shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)] z-20"
            style={{ background: '#FDE68A' }}
            aria-hidden="true"
          >
            <p className="text-[15px] leading-tight" style={{ fontFamily: "'Caveat', cursive", color: '#5c4406', fontWeight: 700 }}>
              Updated every week — new therapists added ✓
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};