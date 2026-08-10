import React from 'react';
import { Star, CheckCircle2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const PatientStories: React.FC = () => {
  const stories = [
    {
      id: 1,
      patientName: 'Devshree K.',
      location: 'Nagpur',
      condition: 'Post Knee Surgery Rehab',
      beforePain: '8 / 10 Pain',
      afterPain: '1 / 10 Pain',
      timeframe: '4 Weeks Therapy',
      rating: 5,
      comment: 'I was unable to walk without crutches after my knee surgery. Dr. Tarannum arrived at my home every day with specialized mobilization equipment. Within 1 month, I was walking pain-free!',
      photo: 'https://t4.ftcdn.net/jpg/02/57/48/67/360_F_257486764_GnnrHRNIBV93mAwR0aiNkS0x5UjDfIcl.jpg',
      doctor: 'Dr. Tarannum Sayyed'
    },
    {
      id: 2,
      patientName: 'Rajesh V. Sharma',
      location: 'Nagpur',
      condition: 'Severe Sciatica & Lumbar Disc Strain',
      beforePain: '9 / 10 Pain',
      afterPain: '0 / 10 Pain',
      timeframe: '3 Weeks Therapy',
      rating: 5,
      comment: 'I had shooting leg pain from sitting at my IT job 10 hours a day. The dry needling and core alignment sessions from PhysioPrime cured my pain without any surgery.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      doctor: 'Dr. Pritam Rathod'
    },
    {
      id: 3,
      patientName: 'Priya N. Deshmukh',
      location: 'Nagpur',
      condition: 'Postpartum Pelvic & Lower Back Care',
      beforePain: '7 / 10 Pain',
      afterPain: '1 / 10 Pain',
      timeframe: '5 Weeks Care',
      rating: 5,
      comment: 'As a new mother, traveling to a clinic was impossible. PhysioPrime allowed me to get gentle postpartum pelvic therapy at home. Friendly, professional, and life-saving care!',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      doctor: 'Dr. Jayshree Ingole'
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-slate-50 relative border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>5,000+ Verified Patient Success Stories</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Real People, Real <span className="text-gradient">Recovery Stories</span>
          </h2>
          <p className="text-slate-600 text-base">
            Read inspiring transformations from patients who regained mobility and returned to living pain-free.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-6">
                
                {/* Before/After Pain Scale Metric */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Initial Pain</span>
                    <p className="text-sm font-extrabold text-rose-500">{s.beforePain}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">After Recovery</span>
                    <p className="text-sm font-extrabold text-teal-500">{s.afterPain}</p>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(s.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-400">{s.timeframe}</span>
                </div>

                {/* Comment */}
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  "{s.comment}"
                </p>

              </div>

              {/* Patient Info */}
              <div className="pt-6 mt-6 border-t border-slate-200 flex items-center gap-3">
                <img src={s.photo} alt={s.patientName} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500" />
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>{s.patientName}</span>
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  </h4>
                  <p className="text-xs text-slate-500">{s.condition} • treated by {s.doctor}</p>
                </div>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
