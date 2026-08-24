import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Accordion } from '../components/ui/Accordion';
import { fadeUp } from '../lib/motion';

const Steps = ({ items }: { items: string[] }) => (
  <ol className="space-y-2.5 list-none">
    {items.map((s, i) => (
      <li key={s} className="flex items-start gap-3">
        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
          {i + 1}
        </span>
        {s}
      </li>
    ))}
  </ol>
);

const guides = [
  {
    title: 'How to book an appointment',
    desc: 'From search to confirmed slot in under a minute.',
    content: (
      <Steps
        items={[
          'Go to Find Therapists and filter by symptom, specialty or area.',
          'Open a physiotherapist’s profile to check fees, experience and reviews.',
          'Pick an available date and time slot that suits you.',
          'Send your booking request — the therapist confirms it shortly.',
        ]}
      />
    ),
  },
  {
    title: 'How to reschedule or cancel',
    desc: 'Plans change — move your session free of charge.',
    content: (
      <Steps
        items={[
          'Open My Appointments and find the booking.',
          'Choose Reschedule to pick a new slot, or Cancel to release it.',
          'As a courtesy, do this at least four hours before the session.',
          'Refunds for prepaid sessions follow the therapist’s profile policy.',
        ]}
      />
    ),
  },
  {
    title: 'How to book a home visit',
    desc: 'Get treated at your doorstep with full equipment.',
    content: (
      <Steps
        items={[
          'On Find Therapists, set the consultation type filter to Home.',
          'Enter your area so only therapists who cover it are shown.',
          'Check the home-visit fee on their profile before booking.',
          'Add your exact address when confirming the appointment.',
        ]}
      />
    ),
  },
  {
    title: 'How to update your profile details',
    desc: 'Keep your contact info and health basics current.',
    content: (
      <Steps
        items={[
          'Sign in and open your Dashboard.',
          'Edit your name, phone number, address and health details.',
          'Save changes — therapists see the updated details on new bookings.',
        ]}
      />
    ),
  },
  {
    title: 'How to find your session records',
    desc: 'Prescriptions and visit history in one place.',
    content: (
      <Steps
        items={[
          'Open My Appointments for past and upcoming visits.',
          'Open a completed appointment to view the therapist’s digital prescription.',
          'Download or screenshot exercise plans to follow at home.',
        ]}
      />
    ),
  },
  {
    title: 'How to message your physiotherapist',
    desc: 'Clarify instructions between sessions.',
    content: (
      <Steps
        items={[
          'Open the conversation from your appointment or dashboard.',
          'Send your question — replies arrive as in-app notifications.',
          'Use messaging for guidance, not emergencies; call emergency services for those.',
        ]}
      />
    ),
  },
  {
    title: 'How to save a physiotherapist for later',
    desc: 'Book the same trusted therapist again in one tap.',
    content: (
      <Steps
        items={[
          'Tap the bookmark icon on any therapist’s profile.',
          'Find all saved profiles in your Dashboard.',
          'Rebook directly from a saved profile — no searching again.',
        ]}
      />
    ),
  },
  {
    title: 'How to install the app & get notifications',
    desc: 'Never miss a confirmation or reminder.',
    content: (
      <Steps
        items={[
          'On your phone’s browser, open PhysioPrime.',
          'Choose “Add to Home Screen” from the browser menu.',
          'Allow notifications when prompted for instant booking updates.',
        ]}
      />
    ),
  },
];

export const PatientGuidesPage: React.FC = () => {
  const [helpful, setHelpful] = useState<'yes' | 'no' | null>(null);

  return (
    <section className="py-12 lg:py-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 pb-10 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>How to use PhysioPrime</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Guides for <span className="text-gradient">patients</span>
          </h2>
          <p className="text-slate-500 text-base">
            Everything about booking, rescheduling, home visits, records and notifications. Tap any topic
            below — each one expands into simple step-by-step instructions.
          </p>
        </div>

        {/* Guides accordion */}
        <motion.div
          variants={fadeUp(24)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-5"
        >
          <Accordion items={guides} />
        </motion.div>

        {/* Cross-links */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Are you a physiotherapist? Read{' '}
          <Link to="/how-it-works" className="font-semibold text-blue-600 hover:text-teal-600 transition-colors">
            how it works for physios
          </Link>
          , or see{' '}
          <Link to="/how-it-works" className="font-semibold text-blue-600 hover:text-teal-600 transition-colors">
            how PhysioPrime works
          </Link>
          .
        </p>

        {/* Helpful widget */}
        <motion.div
          variants={fadeUp(24)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-md mx-auto mt-12 p-7 rounded-3xl bg-white border border-slate-200/90 shadow-lg text-center"
        >
          {helpful ? (
            <p className="font-bold text-slate-900 flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-teal-500" />
              Thanks for your feedback!
            </p>
          ) : (
            <>
              <h4 className="font-extrabold text-slate-900">Was this page helpful?</h4>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setHelpful('yes')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-blue-200 text-blue-700 text-sm font-bold hover:bg-blue-50 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" /> Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHelpful('no')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" /> No
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
};
