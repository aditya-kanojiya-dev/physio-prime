import React from 'react';
import { Star, BadgeCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface TestimonialCardProps {
  initialPainScore: number;
  afterPainScore: number;
  rating: number;
  therapyDuration: string;
  quoteText: string;
  patientName: string;
  patientPhotoUrl?: string;
  verified?: boolean;
  conditionTreated: string;
  doctorName: string;
}

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  initialPainScore,
  afterPainScore,
  rating,
  therapyDuration,
  quoteText,
  patientName,
  patientPhotoUrl,
  verified,
  conditionTreated,
  doctorName,
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-lg hover:shadow-xl hover:border-blue-200 transition-all duration-300 h-full flex flex-col">

      {/* Pain comparison strip */}
      <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initial pain</p>
          <p className="text-xl font-extrabold text-rose-500 leading-tight mt-0.5">
            {initialPainScore}<span className="text-xs font-bold text-slate-400">/10</span>
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100 flex items-center justify-center shrink-0">
          <Activity className="w-3.5 h-3.5" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">After recovery</p>
          <p className="text-xl font-extrabold text-emerald-500 leading-tight mt-0.5">
            {afterPainScore}<span className="text-xs font-bold text-slate-400">/10</span>
          </p>
        </div>
      </div>

      {/* Rating + duration */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
          {therapyDuration}
        </span>
      </div>

      {/* Quote */}
      <p className="mt-4 text-sm leading-[1.65] text-slate-600">
        "{quoteText}"
      </p>

      {/* Divider + identity */}
      <div className="mt-auto pt-4">
        <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
          {patientPhotoUrl ? (
            <img
              src={patientPhotoUrl}
              alt={patientName}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border-2 border-blue-500 shrink-0 flex items-center justify-center text-xs font-extrabold">
              {initialsOf(patientName)}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <span className="truncate">{patientName}</span>
              {verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            </h4>
            <p className="text-xs text-slate-500 leading-snug">
              {conditionTreated} • treated by {doctorName}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export const PatientStories: React.FC = () => {
  const stories = [
    {
      id: 1,
      patientName: 'Devshree K.',
      condition: 'Post Knee Surgery Rehab',
      initialPainScore: 8,
      afterPainScore: 1,
      therapyDuration: '4 weeks therapy',
      rating: 5,
      comment: 'I was unable to walk without crutches after my knee surgery. Dr. Tarannum arrived at my home every day with specialized mobilization equipment. Within 1 month, I was walking pain-free!',
      photo: 'https://t4.ftcdn.net/jpg/02/57/48/67/360_F_257486764_GnnrHRNIBV93mAwR0aiNkS0x5UjDfIcl.jpg',
      doctor: 'Dr. Tarannum Sayyed'
    },
    {
      id: 2,
      patientName: 'Rajesh V. Sharma',
      condition: 'Severe Sciatica & Lumbar Disc Strain',
      initialPainScore: 9,
      afterPainScore: 0,
      therapyDuration: '3 weeks therapy',
      rating: 5,
      comment: 'I had shooting leg pain from sitting at my IT job 10 hours a day. The dry needling and core alignment sessions from PhysioPrime cured my pain without any surgery.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      doctor: 'Dr. Pritam Rathod'
    },
    {
      id: 3,
      patientName: 'Priya N. Deshmukh',
      condition: 'Postpartum Pelvic & Lower Back Care',
      initialPainScore: 7,
      afterPainScore: 1,
      therapyDuration: '5 weeks care',
      rating: 5,
      comment: 'As a new mother, traveling to a clinic was impossible. PhysioPrime allowed me to get gentle postpartum pelvic therapy at home. Friendly, professional, and life-saving care!',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      doctor: 'Dr. Jayshree Ingole'
    }
  ];

  return (
    <section className="py-20 lg:py-28 relative">
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
            >
              <TestimonialCard
                initialPainScore={s.initialPainScore}
                afterPainScore={s.afterPainScore}
                rating={s.rating}
                therapyDuration={s.therapyDuration}
                quoteText={s.comment}
                patientName={s.patientName}
                patientPhotoUrl={s.photo}
                verified
                conditionTreated={s.condition}
                doctorName={s.doctor}
              />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
