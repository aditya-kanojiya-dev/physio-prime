import React from 'react';
import { ShieldCheck, MapPin, Award, Users, Activity, ArrowRight } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../lib/motion';

export const AboutPage: React.FC = () => {
  const { setCurrentPage } = useBooking();

  const stats = [
    { value: '10K+', label: 'Happy Patients' },
    { value: '100+', label: 'Verified Doctors' },
    { value: '10+', label: 'Active Cities' },
    { value: '5K+', label: 'Recovery Stories' },
  ];

  const pillars = [
    {
      icon: ShieldCheck,
      color: 'from-blue-500 to-indigo-600',
      title: 'Strict Verification',
      desc: 'Every single doctor on PhysioPrime undergoes background verification, degree validation with state medical councils, and hands-on skill audits.',
    },
    {
      icon: Award,
      color: 'from-teal-500 to-emerald-600',
      title: 'Evidence-Based Therapy',
      desc: 'We combine manual therapy, dry needling, kinesio taping, and custom home exercise routines backed by modern biomechanical research.',
    },
    {
      icon: Users,
      color: 'from-cyan-500 to-blue-600',
      title: 'Human-Centered Care',
      desc: 'We treat the person, not just the symptom. Patients receive 1-on-1 dedicated attention without rushed 10-minute clinic slots.',
    },
  ];

  return (
    <div className="pt-28 pb-20 min-h-screen relative overflow-hidden">
      {/* Soft Background Glows */}
      <div className="absolute top-40 -left-20 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[26rem] h-[26rem] bg-teal-100/40 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 relative z-10">

        {/* Mission Hero */}
        <motion.div
          variants={staggerContainer(0.12, 0.15)}
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <motion.div
            variants={fadeUp(20)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-teal-500" />
            <span>Our Clinical Vision</span>
          </motion.div>
          <motion.h1 variants={fadeUp(20)} className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
            Empowering Pain-Free Living <span className="text-gradient">For Everyone.</span>
          </motion.h1>
          <motion.p variants={fadeUp(20)} className="text-slate-600 text-lg leading-relaxed">
            Our community of physiotherapists and patients inspires us to develop technologies that make healthcare better, accessible, and affordable for every household.
          </motion.p>
        </motion.div>

        {/* Stats Band */}
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="glass-panel rounded-3xl border border-slate-200 shadow-xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp(20)} className="text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-gradient">{s.value}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Nagpur Roots Banner */}
        <motion.div
          variants={fadeUp(24)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="glass-panel p-8 sm:p-12 rounded-3xl border border-blue-200 shadow-xl bg-gradient-to-r from-blue-50 via-white to-teal-50 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="flex items-center gap-2 text-teal-600 font-extrabold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4" /> Born in Nagpur, Maharashtra
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">Bridging Hospital Care to Your Home</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Founded in Nagpur, PhysioPrime started with a simple belief: physical therapy should be personal, comfortable, and prompt. We equip certified physical therapists with mobile electrotherapy gear to bring ICU-grade recovery right to your home.
            </p>
          </div>
        </motion.div>

        {/* Core Pillars */}
        <motion.div
          variants={staggerContainer(0.1, 0.05)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                variants={fadeUp(24)}
                whileHover={{ y: -6 }}
                className="group glass-panel p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-4"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${p.color} flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {p.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={fadeUp(24)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="text-center space-y-4"
        >
          <h3 className="text-2xl font-extrabold text-slate-900">Ready to begin your recovery journey?</h3>
          <button
            onClick={() => setCurrentPage('doctors')}
            className="btn-gradient text-white px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Book Your First Session Today</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

      </div>
    </div>
  );
};
