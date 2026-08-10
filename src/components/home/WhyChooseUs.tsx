import React from 'react';
import { ShieldCheck, Home, Video, FileText, Zap, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const WhyChooseUs: React.FC = () => {
  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Certified Expert Doctors',
      desc: 'Every therapist undergoes a rigorous 5-stage medical credential verification, council registration check, and background audit.',
      color: 'from-blue-500 to-indigo-600',
      badge: '100% Verified'
    },
    {
      icon: Home,
      title: 'On-Demand Home Visits',
      desc: 'Receive specialized rehabilitation in the comfort of your home equipped with portable electrotherapy & manual gear.',
      color: 'from-teal-500 to-emerald-600',
      badge: 'Doorstep Care'
    },
    {
      icon: Video,
      title: 'HD Video Consultation',
      desc: 'Connect with senior specialists anywhere for instant posture analysis, exercise guidance, and progress tracking.',
      color: 'from-cyan-500 to-blue-600',
      badge: 'Instant Access'
    },
    {
      icon: FileText,
      title: 'Digital Prescriptions & EHR',
      desc: 'Access your therapy history, custom exercise videos, and digital doctor notes directly in your account dashboard.',
      color: 'from-purple-500 to-indigo-600',
      badge: 'Cloud Sync'
    },
    {
      icon: Zap,
      title: 'Fast 1-Click Booking',
      desc: 'Select preferred dates and morning, afternoon, or evening slots in under 30 seconds with no complex hospital queues.',
      color: 'from-amber-500 to-orange-600',
      badge: '< 30 Seconds'
    },
    {
      icon: Award,
      title: 'Affordable Transparent Fees',
      desc: 'Clear upfront session rates with zero hidden charges. Flexible pay-per-session or discounted recovery packages.',
      color: 'from-rose-500 to-pink-600',
      badge: 'Best Value'
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-blue-50/80 to-white relative overflow-hidden">
      
      {/* Subtle Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>The PhysioPrime Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Why Patients & Doctors <span className="text-gradient">Trust Us</span>
          </h2>
          <p className="text-slate-500 text-base">
            We bridge the gap between hospital-grade clinical precision and convenient home-based healing.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group relative p-8 rounded-3xl bg-white border border-slate-200/90 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-100/50 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
