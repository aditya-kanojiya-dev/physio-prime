import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Check,
  Loader2,
  MapPin,
  CalendarCheck,
  Phone,
} from 'lucide-react';
import { useSymptoms } from '../hooks/queries';
import { getConditionDetail } from '../data/conditions';
import { ComparisonTable, DisclaimerBlock, UrgentCareCallout } from '../components/conditions/ConditionShared';

const CheckItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-2.5 text-sm text-slate-700">
    <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
    <span>{children}</span>
  </li>
);

export const ConditionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: symptoms = [], isLoading } = useSymptoms();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const symptom = symptoms.find((s) => s.slug === slug);

  useEffect(() => {
    if (symptom) document.title = `Physiotherapy for ${symptom.title} | PhysioPrime`;
    return () => { document.title = 'PhysioPrime'; };
  }, [symptom]);

  const data = useMemo(
    () => (symptom ? getConditionDetail(symptom, symptoms) : null),
    [symptom, symptoms]
  );

  if (isLoading) {
    return (
      <div className="pt-28 pb-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return <Navigate to="/conditions" replace />;

  const ctaHref = `/doctors?condition=${data.conditionSlug}`;

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-8 justify-center" aria-label="Breadcrumb">
          <Link to="/conditions" className="hover:text-blue-600 transition-colors">Conditions</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">{data.conditionName}</span>
        </nav>

        {/* Header */}
        <header className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Physiotherapy for {data.conditionName}
          </h1>
          <div className="space-y-1">
            {data.tagLines.map((tag) => (
              <p key={tag} className="text-sm text-slate-500">{tag}</p>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to={ctaHref}
              className="btn-gradient text-white px-7 py-3 rounded-full font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              Book an Appointment
            </Link>
            <a
              href="tel:+919876543210"
              className="px-6 py-3 rounded-full font-bold text-sm text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call Us
            </a>
          </div>
        </header>

        {/* Quick answer */}
        <section className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-14">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Quick answer</p>
          <p className="text-slate-800 leading-relaxed mb-5">{data.quickAnswer}</p>
          <ul className="space-y-2.5">
            {data.quickAnswerChecklist.map((item) => (
              <CheckItem key={item}>{item}</CheckItem>
            ))}
          </ul>
        </section>

        {/* What is */}
        <section className="max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            What is {data.conditionName.toLowerCase()}?
          </h2>
          <p className="text-slate-600 leading-relaxed">{data.aboutText}</p>
        </section>

        {/* How it helps + Common signs */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mb-4">How physiotherapy helps</h2>
            <ul className="space-y-2.5">
              {data.howItHelps.slice(0, 4).map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mb-4">Common signs</h2>
            <ul className="space-y-2.5">
              {data.commonSigns.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </ul>
          </section>
        </div>

        {/* Comparison table */}
        <div className="mb-14">
          <ComparisonTable />
        </div>

        {/* Urgent care */}
        <div className="mb-14">
          <UrgentCareCallout conditionName={data.conditionName} symptoms={data.urgentCareSymptoms} />
        </div>

        {/* FAQs */}
        <section className="max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-5">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {data.faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.question} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-sm font-bold text-slate-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* Related */}
        {(data.relatedConditions.length > 0 || data.specialtySlug) && (
          <section className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Related</h2>
            <div className="flex flex-wrap gap-3">
              {data.relatedConditions.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/conditions/${rel.slug}`}
                  className="inline-flex items-center gap-1.5 bg-white rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:bg-teal-50/40 transition-all"
                >
                  {rel.name}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>
              ))}
              {data.specialtySlug && data.specialtyName && (
                <Link
                  to={`/categories/${data.specialtySlug}`}
                  className="inline-flex items-center gap-1.5 bg-blue-50 rounded-full border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  All {data.specialtyName.replace(/\s*physiotherapy\s*/i, ' ').trim()} physiotherapy
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Find-a-physiotherapist CTA band */}
        <section className="max-w-3xl mx-auto bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl p-8 sm:p-10 shadow-lg shadow-teal-500/20 text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Find a physiotherapist for {data.conditionName.toLowerCase()}
          </h2>
          <p className="text-teal-50 text-sm mb-6 max-w-md mx-auto">
            Verified specialists for {data.conditionName.toLowerCase()}, available for home visits and online consultations.
          </p>
          <Link
            to={ctaHref}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-teal-700 font-bold text-sm shadow-md hover:bg-teal-50 transition-colors"
          >
            <MapPin className="w-4 h-4" /> Find a physiotherapist →
          </Link>
        </section>

        {/* Disclaimer */}
        <DisclaimerBlock />
      </div>
    </div>
  );
};
