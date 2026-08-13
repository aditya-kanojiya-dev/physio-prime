import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { ConsultationMode } from '../../types';
import { motion } from 'framer-motion';
import { Video, Home, Calendar, ArrowRight, Sparkles, Award } from 'lucide-react';
import homepageVid from '../../assets/homepage.mp4';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { openBookingModal } = useBooking();
  const [selectedMode, setSelectedMode] = useState<ConsultationMode>('home');

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      
      {/* Dynamic Background Blobs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute top-40 right-10 w-[30rem] h-[30rem] bg-teal-100/40 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-8"
          >
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 shadow-sm text-blue-700 text-xs sm:text-sm font-bold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <Award className="w-4 h-4 text-teal-500" />
              <span>India's #1 On-Demand Physiotherapy Platform</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Your Trusted Partner in{' '}
                <span className="text-gradient">Physiotherapy Care.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl">
                Book certified physiotherapists for personalized <strong className="text-slate-900 font-semibold">Home Visits</strong> or instant <strong className="text-slate-900 font-semibold">HD Video Consultations</strong>. Recover comfortably at your speed.
              </p>
            </div>

            {/* Mode Selection Toggle Card */}
            <div className="glass-panel p-2 rounded-2xl border border-slate-200 shadow-xl max-w-xl">
              <div className="grid grid-cols-2 gap-2">
                
                <button
                  onClick={() => setSelectedMode('home')}
                  className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    selectedMode === 'home'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Home className="w-5 h-5 text-teal-300 flex-shrink-0" />
                  <span>Home Visit Physio</span>
                </button>

                <button
                  onClick={() => setSelectedMode('online')}
                  className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    selectedMode === 'online'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Video className="w-5 h-5 text-cyan-300 flex-shrink-0" />
                  <span>Online Video Consult</span>
                </button>

              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => openBookingModal({ mode: selectedMode })}
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
            </div>

          </motion.div>

          {/* Right Hero Interactive 3D Graphic / Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Glowing Outer Ring */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-100 to-teal-100 opacity-60 blur-xl animate-pulse" />

              {/* Main Illustration Card */}
              <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-200 shadow-2xl p-4 sm:p-6 bg-white">
                <div className="relative h-[22rem] sm:h-[26rem] rounded-2xl overflow-hidden group">
                  <video
                    src={homepageVid}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Elegant gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-slate-900/5 to-transparent" />
                  
                  {/* Subtle decorative border glow */}
                  <div className="absolute inset-0 ring-1 ring-white/20 ring-inset rounded-2xl" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};