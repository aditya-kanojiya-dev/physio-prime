import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Mail,
  Home,
  Search,
  UserCheck,
  CalendarCheck,
  Send,
  UserPlus,
  BadgeCheck,
  IndianRupee,
  Inbox,
  ArrowRight,
  Video,
} from 'lucide-react';
import { StepCards, type Step } from '../components/ui/StepCards';
import { Accordion } from '../components/ui/Accordion';
import { fadeUp } from '../lib/motion';
import { useBooking } from '../context/BookingContext';

const patientSteps: Step[] = [
  { number: '01', icon: Search, title: 'Search', desc: 'Browse verified physiotherapists by symptom, specialty and area.' },
  { number: '02', icon: UserCheck, title: 'Choose a physio', desc: 'Compare fees, experience and patient reviews on each profile.' },
  { number: '03', icon: CalendarCheck, title: 'Pick a slot', desc: 'Choose morning, afternoon or evening from their live calendar.' },
  { number: '04', icon: Send, title: 'Send your request', desc: 'Confirm the details — the therapist accepts and your slot is locked.' },
];

const physioSteps: Step[] = [
  { number: '01', icon: UserPlus, title: 'Create your profile', desc: 'Add qualifications, specialties and the areas you serve.' },
  { number: '02', icon: BadgeCheck, title: 'Get verified', desc: 'Our team validates your council registration and credentials.' },
  { number: '03', icon: IndianRupee, title: 'Set fees & slots', desc: 'Publish your home visit and video consult rates.' },
  { number: '04', icon: Inbox, title: 'Receive bookings', desc: 'Patient requests land directly in your dashboard. Zero commission.' },
];

const faqs = [
  {
    title: 'Do I need a doctor’s referral to book?',
    desc: 'No referral required.',
    content: <p>You can book any physiotherapist directly. If you have a prescription or medical report, share it with your therapist during the session — they factor it into your treatment plan.</p>,
  },
  {
    title: 'How do I pay for my session?',
    desc: 'Directly to the physiotherapist.',
    content: <p>PhysioPrime is free for patients. You pay the physiotherapist directly — online for video consults, or at the door after a home visit. The exact fee is shown on their profile before you book.</p>,
  },
  {
    title: 'Can the physiotherapist come to my home?',
    desc: 'Yes — home visits are our most popular option.',
    content: <p>Many therapists offer home visits within the areas listed on their profile. They carry portable electrotherapy and manual therapy equipment, so you get hospital-grade treatment at home.</p>,
  },
  {
    title: 'How will I know my booking is confirmed?',
    desc: 'Updates at every step.',
    content: <p>After you send a request you’ll see its status in My Appointments, and once the therapist accepts, the slot shows as confirmed with reminders before your session.</p>,
  },
  {
    title: 'What is the verification code for?',
    desc: 'It proves you attended.',
    content: <p>For some sessions the therapist shares a one-time code with you to confirm the visit actually happened. Just read it out to them when asked — it keeps attendance records accurate.</p>,
  },
  {
    title: 'What if my therapist cancels or doesn’t show up?',
    desc: 'You’re never left stranded.',
    content: <p>If a therapist cancels, you can rebook another slot or pick a different physiotherapist straight away. Cancellation and refund terms follow the policy shown on their profile, and we ask them to resolve it with you promptly.</p>,
  },
];

export const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSearchQuery } = useBooking();
  const [audience, setAudience] = useState<'patients' | 'physios'>('patients');
  const [query, setQuery] = useState('');

  const trustPoints = [
    { icon: ShieldCheck, text: 'Verified physiotherapists only' },
    { icon: Mail, text: 'Booking updates every step of the way' },
    { icon: Video, text: 'Video consult and home visit options' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSearchQuery(query.trim());
    navigate('/doctors');
  };

  return (
    <section className="py-12 lg:py-16 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero */}
        <motion.div
          variants={fadeUp(24)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pb-14 border-b border-slate-200"
        >
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              How to book a{' '}
              <span className="text-gradient">physiotherapist online</span>{' '}
              in India
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
              No queues, no phone calls, no guesswork. Find a certified therapist near you, see their fees
              upfront, and book a video consult or home visit in under a minute.
            </p>
            <ul className="space-y-3 pt-2">
              {trustPoints.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.text} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    {t.text}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ponytail: site uses hero video, no illustration assets — composed floating cards match the theme instead */}
          <div className="relative hidden lg:block h-80">
            <div className="absolute inset-x-10 top-6 bottom-6 rounded-[2.5rem] bg-gradient-to-br from-blue-100 to-teal-100 blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="absolute left-4 top-8 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xl flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">Dr. Tarannum Sayyed</p>
                <p className="text-xs text-slate-400">Verified • 4.9 ★</p>
              </div>
              <BadgeCheck className="w-5 h-5 text-teal-500 ml-2" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute right-4 top-28 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xl flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">Home visit booked</p>
                <p className="text-xs text-slate-400">Tomorrow, 10:30 AM</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="absolute left-16 bottom-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xl flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">HD Video Consult</p>
                <p className="text-xs text-slate-400">From ₹449 per session</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Audience toggle */}
        <div className="flex justify-center mt-10 mb-10">
          <div className="inline-flex gap-1 p-1 bg-white border border-slate-200 rounded-full shadow-md">
            {(['patients', 'physios'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(a)}
                className={`px-7 py-2.5 rounded-full text-sm font-bold transition-all ${
                  audience === a ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                For {a}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-8">
            {audience === 'patients' ? (
              <>Book in <span className="text-gradient">four steps</span></>
            ) : (
              <>Start receiving patients in <span className="text-gradient">four steps</span></>
            )}
          </h2>
          <StepCards steps={audience === 'patients' ? patientSteps : physioSteps} cols={4} />
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-8">
            Common questions about <span className="text-gradient">booking</span>
          </h2>
          <Accordion items={faqs} />
        </div>

        {/* Bottom CTA */}
        <motion.div
          variants={fadeUp(24)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="rounded-3xl bg-white border border-slate-200/90 shadow-xl p-10 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center"
        >
          <div className="hidden md:flex w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-500 to-teal-600 items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Search className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Find a physiotherapist <span className="text-gradient">near you</span>
            </h2>
            <p className="text-slate-500 text-sm mt-2 mb-5">
              Compare fees and reviews, then book your first session today.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symptoms, e.g. back pain..."
                aria-label="Search symptoms"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all"
              />
              <button
                type="submit"
                className="btn-gradient inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Find Therapists <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
