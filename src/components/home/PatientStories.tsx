import React from 'react';
import { Star, CheckCircle2, Activity, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../../lib/motion';

function parsePain(text: string) {
  const m = text.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

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
    <section className="py-12 lg:py-20 bg-[#EFF8F4] relative border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
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
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {stories.map((s) => {
            const before = parsePain(s.beforePain);
            const after = parsePain(s.afterPain);
            const reduction = before > 0 ? ((before - after) / before) * 100 : 0;

            return (
              <motion.div
                key={s.id}
                variants={fadeUp(24)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg hover:border-blue-300 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3.5">

                  {/* Before/After Pain Scale */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Initial</span>
                        <p className="text-xs font-extrabold text-rose-500">{s.beforePain}</p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">After</span>
                        <p className="text-xs font-extrabold text-teal-500">{s.afterPain}</p>
                      </div>
                    </div>
                    {/* Pain reduction bar */}
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-teal-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${reduction}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-teal-600 text-right">{Math.round(reduction)}% pain reduced</p>
                  </div>

                  {/* Rating + Timeframe */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(s.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{s.timeframe}</span>
                  </div>

                  {/* Comment */}
                  <p className="text-slate-600 text-sm leading-relaxed italic line-clamp-2">
                    &ldquo;{s.comment}&rdquo;
                  </p>

                </div>

                {/* Patient Info */}
                <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center gap-2.5">
                  <img src={s.photo} alt={s.patientName} className="w-9 h-9 rounded-full object-cover border-2 border-blue-400" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
                      <span className="truncate">{s.patientName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{s.condition}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {s.location} · {s.doctor}
                    </p>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};
