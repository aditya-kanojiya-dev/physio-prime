import React, { useState } from 'react';
import { Doctor } from '../../types';
import { GraduationCap, Briefcase, CheckCircle2, Star, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';

interface DoctorProfileTabsProps {
  doctor: Doctor;
}

type TabType = 'about' | 'education' | 'experience' | 'expertise' | 'reviews';

export const DoctorProfileTabs: React.FC<DoctorProfileTabsProps> = ({ doctor }) => {
  const [activeTab, setActiveTab] = useState<TabType>('about');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'about', label: 'About & Bio' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'expertise', label: 'Treatments' },
    { id: 'reviews', label: `Reviews (${doctor.reviewCount})` },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
      
      {/* Tab Navigation Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        
        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl font-extrabold text-slate-900">Clinical Biography</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {doctor.bio}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Languages Spoken</span>
                <p className="text-sm font-extrabold text-slate-900">{doctor.languages.join(', ')}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Council Registration</span>
                <p className="text-sm font-extrabold text-teal-600">{doctor.registration.number}</p>
                <p className="text-[11px] text-slate-500">{doctor.registration.council}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* EDUCATION TAB */}
        {activeTab === 'education' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Degrees & Certifications</h3>
            <div className="space-y-3">
              {doctor.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{edu}</h4>
                    <p className="text-xs text-slate-500">Verified Medical Qualification</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* EXPERIENCE TAB */}
        {activeTab === 'experience' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Work & Clinical History</h3>
            <div className="space-y-4">
              {doctor.experience.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{exp.role}</h4>
                    <p className="text-xs font-semibold text-teal-600">{exp.institution}</p>
                    <p className="text-[11px] text-slate-400">{exp.period}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* EXPERTISE TAB */}
        {activeTab === 'expertise' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Clinical Specializations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {doctor.expertise.map((exp, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Therapeutic Procedures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {doctor.treatments.map((tr, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-xs font-bold text-blue-700">
                    <HeartPulse className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>{tr}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            
            {/* Rating Breakdown Chart */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 text-center border-r-0 md:border-r border-slate-200 pr-0 md:pr-6">
                <p className="text-5xl font-black text-slate-900">{doctor.rating}</p>
                <div className="flex items-center justify-center gap-1 my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-500">Overall rating based on {doctor.reviewCount} verified patients</p>
              </div>

              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold text-slate-600">5 Star</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 w-[92%]" />
                  </div>
                  <span className="w-8 font-bold text-slate-500">92%</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold text-slate-600">4 Star</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 w-[6%]" />
                  </div>
                  <span className="w-8 font-bold text-slate-500">6%</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold text-slate-600">3 Star</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 w-[2%]" />
                  </div>
                  <span className="w-8 font-bold text-slate-500">2%</span>
                </div>
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4">
              {doctor.reviewsList.map(rev => (
                <div key={rev.id} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{rev.patientName}</span>
                      {rev.verified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200">
                          Verified Patient
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{rev.date}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.floor(rev.rating))].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1">{rev.rating}/5</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Treatment: {rev.treatmentName}
                  </p>
                </div>
              ))}
            </div>

          </motion.div>
        )}

      </div>

    </div>
  );
};
