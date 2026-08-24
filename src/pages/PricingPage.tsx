import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Wallet,
  Video,
  Home,
  Check,
} from 'lucide-react';
import { StepCards } from '../components/ui/StepCards';
import { Accordion } from '../components/ui/Accordion';
import { fadeUp, staggerContainer } from '../lib/motion';

const steps = [
  {
    number: '01',
    title: 'Browse for free',
    desc: 'Search certified physiotherapists by symptom, specialty and area — no account needed to look around.',
  },
  {
    number: '02',
    title: 'See the fee upfront',
    desc: 'Every therapist lists their exact session fee on their profile before you book anything.',
  },
  {
    number: '03',
    title: 'Pay the physio directly',
    desc: 'Pay online or at your home visit as your physiotherapist prefers. PhysioPrime never sits between you and your money.',
  },
];

const sessionTypes = [
  {
    icon: Video,
    name: 'Video consult',
    intro: 'Live one-on-one session over HD video call.',
    points: [
      'Guided exercises & movement assessment on camera',
      'Typically ₹449 – ₹599 per session',
      'Booked and joined through PhysioPrime',
      'Paid online when your booking is confirmed',
    ],
  },
  {
    icon: Home,
    name: 'Home visit',
    intro: 'The physiotherapist comes to you with portable equipment.',
    points: [
      'Portable electrotherapy & manual therapy gear',
      'Typically ₹799 – ₹1,000 per session',
      'Travel within the areas listed on their profile',
      'Paid at the door after the session (or online if offered)',
    ],
  },
];

const physioFaqs = [
  {
    title: 'What does it cost a physiotherapist to use PhysioPrime?',
    desc: 'Short answer: nothing.',
    content: (
      <p>
        Creating a profile, publishing your fees and receiving booking requests is completely free.
        We don't charge subscriptions, listing fees or onboarding charges — ever.
      </p>
    ),
  },
  {
    title: 'Does PhysioPrime take a per-lead or per-booking fee?',
    desc: 'No commission on any of your earnings.',
    content: (
      <p>
        No. Unlike aggregator platforms, we take zero commission and zero per-lead fees. A patient
        books you, pays you directly, and every rupee stays with you.
      </p>
    ),
  },
  {
    title: 'How do I get listed?',
    desc: 'Verification keeps the directory trustworthy for everyone.',
    content: (
      <p>
        Apply through our careers form with your qualifications and council registration. Once your
        credentials are verified (usually within a few days), your profile goes live and patients can
        start booking you.
      </p>
    ),
  },
];

export const PricingPage: React.FC = () => {
  return (
    <section className="py-12 lg:py-16 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pb-10 border-b border-slate-200 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Simple. Transparent.{' '}
            <span className="text-gradient">No surprises.</span>
          </h2>
          <p className="text-slate-500 text-base">
            PhysioPrime is free for patients — browse profiles, compare fees and book without paying us
            anything. You pay your physiotherapist directly, online or at the door for home visits,
            whichever they accept.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-8">
            How it <span className="text-gradient">works</span>
          </h3>
          <StepCards steps={steps} cols={3} />
        </div>

        {/* What a session costs */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-4">
            What a session <span className="text-gradient">costs</span>
          </h3>
          <p className="text-slate-500 text-sm sm:text-base text-center max-w-2xl mx-auto mb-10">
            Each physiotherapist sets their own fee based on city, experience and session length. The exact
            amount is always shown on their profile before you confirm a booking.
          </p>

          <motion.div
            variants={staggerContainer(0.1, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {sessionTypes.map((s) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.name}
                  variants={fadeUp(24)}
                  className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-lg hover:border-blue-300 transition-colors duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{s.name}</h4>
                  <p className="text-slate-500 text-sm mt-1">{s.intro}</p>
                  <div className="border-t border-slate-100 my-5" />
                  <ul className="space-y-2.5">
                    {s.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </motion.div>

          <p className="text-center text-xs text-slate-400 font-medium mt-6">
            Exact fees depend on the provider. Always confirm before booking.
          </p>
        </div>

        {/* Free for patients */}
        <motion.div
          variants={fadeUp(24)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/90 shadow-lg mb-16"
        >
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-teal-500" />
            Free for patients
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed mt-2">
            PhysioPrime charges no booking fee, no platform fee and no service fee to patients. Searching,
            comparing and requesting appointments costs nothing — the only money that changes hands is the
            session fee, paid straight to your physiotherapist.
          </p>
        </motion.div>

        {/* Cancellations */}
        <div className="max-w-3xl mx-auto mb-16">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
            Cancellations & <span className="text-gradient">refunds</span>
          </h3>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
            Because payments go directly to your physiotherapist, cancellations and refunds are handled
            between you and them under the cancellation policy shown on their profile. As a courtesy, we ask
            patients to cancel or reschedule at least four hours before the session so the slot can be
            offered to someone else. If a therapist cancels on you, they'll work with you to reschedule or refund.
          </p>
        </div>

        {/* For physiotherapists */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-4">
            For <span className="text-gradient">physiotherapists</span>
          </h3>
          <p className="text-slate-500 text-sm sm:text-base text-center max-w-2xl mx-auto mb-10">
            Listing is free and always will be. We take nothing from your earnings.
          </p>
          <motion.div
            variants={fadeUp(24)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-xl mx-auto p-9 rounded-3xl bg-white border-2 border-teal-300 shadow-xl shadow-teal-100/50"
          >
            <div className="text-center pb-6 border-b border-slate-100">
              <span className="block text-5xl font-extrabold text-slate-900 tracking-tight">₹0</span>
              <span className="block text-sm font-semibold text-slate-500 mt-1">to list your practice</span>
            </div>
            <ul className="space-y-3 my-7">
              {[
                'Zero commission on your earnings',
                'No per-lead or per-booking charges',
                'You set your fees and keep them in full',
                'Verified badge builds patient trust',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/career"
                className="btn-gradient inline-flex items-center justify-center gap-2 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                List your practice free
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
              >
                How it works for physios
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Physio FAQ */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-8">
            Common questions for <span className="text-gradient">physiotherapists</span>
          </h3>
          <Accordion items={physioFaqs} />
        </div>
      </div>
    </section>
  );
};
