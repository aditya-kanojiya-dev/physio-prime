import React from 'react';
import { Heart, ShieldCheck, MapPin, Award, Users, Activity, ArrowRight } from 'lucide-react';
import { useBooking } from '../context/BookingContext';

export const AboutPage: React.FC = () => {
  const { setCurrentPage } = useBooking();

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Mission Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Activity className="w-3.5 h-3.5" />
            <span>Our Clinical Vision</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
            Empowering Pain-Free Living <span className="text-gradient">For Everyone.</span>
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            Our community of physiotherapists and patients inspires us to develop technologies that make healthcare better, accessible, and affordable for every household.
          </p>
        </div>

        {/* Nagpur Roots Banner */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-blue-200 shadow-xl bg-gradient-to-r from-blue-50 via-white to-teal-50 relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="flex items-center gap-2 text-teal-600 font-extrabold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4" /> Born in Nagpur, Maharashtra
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">Bridging Hospital Care to Your Home</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Founded in Nagpur, PhysioPrime started with a simple belief: physical therapy should be personal, comfortable, and prompt. We equip certified physical therapists with mobile electrotherapy gear to bring ICU-grade recovery right to your home.
            </p>
            {/* <div className="pt-2 flex items-center gap-2 text-rose-500 font-bold text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 fill-rose-500" />
              <span>in Nagpur for India</span>
            </div> */}
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-3">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
            <h3 className="text-xl font-extrabold text-slate-900">Strict Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every single doctor on PhysioPrime undergoes background verification, degree validation with state medical councils, and hands-on skill audits.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-3">
            <Award className="w-10 h-10 text-teal-500" />
            <h3 className="text-xl font-extrabold text-slate-900">Evidence-Based Therapy</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We combine manual therapy, dry needling, kinesio taping, and custom home exercise routines backed by modern biomechanical research.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-3">
            <Users className="w-10 h-10 text-cyan-500" />
            <h3 className="text-xl font-extrabold text-slate-900">Human-Centered Care</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We treat the person, not just the symptom. Patients receive 1-on-1 dedicated attention without rushed 10-minute clinic slots.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-extrabold text-slate-900">Ready to begin your recovery journey?</h3>
          <button
            onClick={() => setCurrentPage('doctors')}
            className="btn-gradient text-white px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl inline-flex items-center gap-2"
          >
            <span>Book Your First Session Today</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
