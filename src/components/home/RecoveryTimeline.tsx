import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { Search, UserCheck, CalendarCheck, Home, Activity, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const RecoveryTimeline: React.FC = () => {
  const { openBookingModal } = useBooking();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: '01',
      title: 'Search & Describe Symptoms',
      subtitle: 'Identify your pain area or condition',
      detail: 'Browse through 20+ symptoms (Back Pain, Knee Rehab, Stroke Care) or search by doctor specialization and nearby location.',
      icon: Search,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      number: '02',
      title: 'Choose Certified Specialist',
      subtitle: 'Review credentials, ratings & fees',
      detail: 'Inspect verified medical degrees, experience years, patient reviews, and languages spoken to find your perfect physical therapist.',
      icon: UserCheck,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      number: '03',
      title: 'Book Preferred Time Slot',
      subtitle: 'Instant booking confirmation',
      detail: 'Choose your desired consultation mode (Home Visit or Video Consult) and pick a convenient date & morning, afternoon, or evening slot.',
      icon: CalendarCheck,
      color: 'from-teal-500 to-emerald-600'
    },
    {
      number: '04',
      title: 'Home Visit / HD Consultation',
      subtitle: 'Hands-on therapy session',
      detail: 'The doctor arrives at your home equipped with portable electrotherapy gear or initiates an instant HD video session.',
      icon: Home,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      number: '05',
      title: 'Track Full Recovery',
      subtitle: 'Personalized exercise plan & notes',
      detail: 'Receive digital prescriptions, daily posture exercises, and continuous follow-up support until complete pain-free mobility.',
      icon: Activity,
      color: 'from-amber-500 to-orange-600'
    }
  ];

  return (
    <section className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Seamless Care Journey</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            How Your <span className="text-gradient">Recovery Process</span> Works
          </h2>
          <p className="text-slate-600 text-base">
            From your first click to pain-free mobility in 5 easy, transparent steps.
          </p>
        </div>

        {/* Horizontal Timeline Container */}
        <div className="relative mb-12">
          
          {/* Animated Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 via-teal-400 to-amber-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Timeline Nodes */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              const isPassed = activeStep >= idx;

              return (
                <motion.div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  whileHover={{ scale: 1.03 }}
                  className={`cursor-pointer p-6 rounded-3xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white border-2 border-blue-500 shadow-xl'
                      : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex lg:flex-col items-center gap-4 text-left lg:text-center">
                    
                    {/* Node Icon Circle */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-300 flex-shrink-0 ${
                        isPassed
                          ? `bg-gradient-to-tr ${step.color} shadow-blue-500/30 scale-110`
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div>
                      <span className="text-xs font-black text-blue-600 block mb-1">
                        STEP {step.number}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {step.subtitle}
                      </p>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

        {/* Selected Step Detailed View Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              Step Details ({steps[activeStep].number} of 05)
            </span>
            <h4 className="text-2xl font-extrabold text-slate-900">
              {steps[activeStep].title}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {steps[activeStep].detail}
            </p>
          </div>

          <button
            onClick={() => openBookingModal({ mode: 'home' })}
            className="btn-gradient text-white px-6 py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/20 whitespace-nowrap hover:scale-[1.02] active:scale-[0.98] transition-transform flex-shrink-0"
          >
            Start Booking Now
          </button>
        </div>

      </div>
    </section>
  );
};
