import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDoctors } from '../../hooks/queries';
import { Doctor, ConsultationMode, Symptom } from '../../types';
import { ArrowLeft, Home, Video, Star, Loader2 } from 'lucide-react';

interface DoctorStepProps {
  symptom: Symptom | null;
  mode: ConsultationMode;
  onModeChange: (mode: ConsultationMode) => void;
  onSelect: (doctor: Doctor) => void;
  onBack: () => void;
}

export const DoctorStep: React.FC<DoctorStepProps> = ({
  symptom,
  mode,
  onModeChange,
  onSelect,
  onBack,
}) => {
  const { data: doctors = [], isLoading } = useDoctors();

  const filteredDoctors = useMemo(() => {
    if (!symptom) return doctors;
    const query = symptom.title.toLowerCase();
    return doctors.filter((doc) => {
      const hay = `${doc.specialty} ${doc.expertise.join(' ')} ${doc.treatments.join(' ')} ${doc.bio}`.toLowerCase();
      return hay.includes(query);
    });
  }, [symptom, doctors]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {symptom && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6"
          >
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Selected Condition</p>
            <h2 className="text-lg font-extrabold text-slate-900">{symptom.title}</h2>
            {symptom.recoveryEstimate && (
              <p className="text-xs text-slate-500 mt-1">Typical recovery: {symptom.recoveryEstimate}</p>
            )}
          </motion.div>
        )}

        <div className="space-y-2 mb-6">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Mode</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onModeChange('home')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                mode === 'home'
                  ? 'bg-blue-50 border-blue-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-slate-900">Home Visit</p>
                <p className="text-xs text-slate-500">Therapist comes to you</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('online')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                mode === 'online'
                  ? 'bg-teal-50 border-teal-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-teal-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-slate-900">Online Video</p>
                <p className="text-xs text-slate-500">HD 1-on-1 virtual session</p>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {symptom ? `Therapists for ${symptom.title}` : 'Available Therapists'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Loading therapists...</span>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-bold text-slate-700">No therapists found for this condition</p>
            <p className="text-xs text-slate-500 mt-1">Try selecting a different condition</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="space-y-3"
          >
            {filteredDoctors.map((doc) => (
              <motion.div
                key={doc.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelect(doc)}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={doc.photo}
                    alt={doc.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">{doc.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{doc.specialty}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-slate-700">{doc.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{doc.experienceYears} yrs exp</span>
                      <span>{doc.languages.join(', ')}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-extrabold text-blue-600">₹{doc.fees[mode]}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(doc);
                        }}
                        className="btn-gradient text-white px-4 py-2 rounded-xl font-extrabold text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};
