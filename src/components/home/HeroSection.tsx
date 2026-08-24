import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConsultationMode } from '../../types';
import { motion } from 'framer-motion';
import { Video, Home, Calendar, ArrowRight, Sparkles, Award } from 'lucide-react';
import heroVid from '../../assets/hero-vid.webm';
import { fadeUp, staggerContainer, EASE_OUT } from '../../lib/motion';

// ponytail: ~40-line vanilla typewriter instead of Typed.js dependency
const TYPE_WORDS = ['Home Visit.', 'Online Video Consult.', 'Stroke Recovery.', 'Post Surgical Rehab.', 'Sports Injury.', 'Back and Neck Pain.'];

function useTypewriter(words: string[], enabled: boolean) {
  const [text, setText] = useState(enabled ? '' : words[0]);

  useEffect(() => {
    if (!enabled) return;
    let word = 0;
    let char = 0;
    let deleting = false;
    let timer: number;

    const tick = () => {
      const current = words[word];
      if (!deleting) {
        char += 1;
        setText(current.slice(0, char));
        if (char === current.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1800);
          return;
        }
        timer = window.setTimeout(tick, 70);
      } else {
        char -= 1;
        setText(current.slice(0, char));
        if (char === 0) {
          deleting = false;
          word = (word + 1) % words.length;
          timer = window.setTimeout(tick, 400);
          return;
        }
        timer = window.setTimeout(tick, 35);
      }
    };

    timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
  }, [enabled, words]);

  return text;
}

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<ConsultationMode>('home');
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const typed = useTypewriter(TYPE_WORDS, !prefersReducedMotion);

  return (
    <section className="relative pt-14 pb-10 lg:pt-20 lg:pb-16 overflow-hidden">

      {/* Dynamic Background Blobs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute top-40 right-10 w-[30rem] h-[30rem] bg-teal-100/40 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Hero Column */}
          <motion.div
            variants={staggerContainer(0.12, 0.15)}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-8"
          >

            {/* Top Pill Badge */}
            <motion.div
              variants={fadeUp(20)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 shadow-sm text-blue-700 text-xs sm:text-sm font-bold"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <Award className="w-4 h-4 text-teal-500" />
              <span>India's #1 On-Demand Physiotherapy Platform</span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={fadeUp(20)} className="space-y-5">
              <h1
                aria-label="Your Trusted Partner in Physiotherapy Care"
                className="text-5xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]"
              >
                Book Prime Physiotherapist for
                {/* own line + fluid size + nowrap: never wraps, so hero height never changes */}
                <span aria-hidden="true" className="block mt-1 text-gradient whitespace-nowrap leading-[1.15] text-[clamp(1.9rem,5vw,3.4rem)]">
                  {typed}
                  <span className="typewriter-caret">|</span>
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl">
                Connect with certified <strong className="text-slate-900 font-semibold text-gradient underline">Prime Physiotherapists</strong> for expert care, personalized treatment, and recovery from the comfort of home.
              </p>
            </motion.div>

            {/* Mode Selection Toggle Card */}
            <motion.div variants={fadeUp(20)} className="max-w-xl">
              <div className="flex items-center gap-1 bg-white/70 p-1.5 rounded-full border border-slate-200/80 backdrop-blur-md shadow-sm">

                <button
                  onClick={() => setSelectedMode('home')}
                  className={`relative flex-1 p-3 rounded-full font-bold text-xs sm:text-sm transition-colors duration-200 flex items-center justify-center gap-2 ${
                    selectedMode === 'home'
                      ? 'text-white'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/50'
                  }`}
                >
                  {selectedMode === 'home' && (
                    <motion.span
                      layoutId="hero-mode-pill"
                      className="absolute inset-0 rounded-full bg-blue-600 shadow-md shadow-blue-500/20"
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Home className={`w-5 h-5 flex-shrink-0 ${selectedMode === 'home' ? 'text-teal-300' : 'text-teal-500'}`} />
                    <span>Home Visit Physio</span>
                  </span>
                </button>

                <button
                  onClick={() => setSelectedMode('online')}
                  className={`relative flex-1 p-3 rounded-full font-bold text-xs sm:text-sm transition-colors duration-200 flex items-center justify-center gap-2 ${
                    selectedMode === 'online'
                      ? 'text-white'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/50'
                  }`}
                >
                  {selectedMode === 'online' && (
                    <motion.span
                      layoutId="hero-mode-pill"
                      className="absolute inset-0 rounded-full bg-blue-600 shadow-md shadow-blue-500/20"
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Video className={`w-5 h-5 flex-shrink-0 ${selectedMode === 'online' ? 'text-cyan-300' : 'text-cyan-500'}`} />
                    <span>Online Video Consult</span>
                  </span>
                </button>

              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp(20)} className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate(`/doctors?mode=${selectedMode}`)}
                className="btn-gradient text-white px-8 py-4 rounded-2xl font-extrabold text-base shadow-xl shadow-blue-500/30 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-5 h-5 text-teal-300" />
                <span>Book {selectedMode === 'home' ? 'Home Visit' : 'Video Consult'} Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/booking-slots')}
                className="px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all text-base shadow-lg shadow-amber-500/30 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calendar className="w-5 h-5" />
                <span>Check Available Slots</span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
                className="w-full h-full aspect-[4/5]"
              />
              <div className="absolute inset-0 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
