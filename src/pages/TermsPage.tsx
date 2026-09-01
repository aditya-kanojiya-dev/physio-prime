import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="pt-16 pb-16 min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Legal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-10">Last updated: August 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-600">
          <p>
            Welcome to <strong className="text-slate-900">Physio Prime</strong>. By booking an
            appointment through our website, you agree to the following Terms &amp; Conditions.
          </p>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Appointment Booking</h2>
            <p>By booking a physiotherapy appointment, you confirm that the information provided by you is accurate and complete. An appointment is considered confirmed once the booking process and, where applicable, payment have been successfully completed.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Appointment Cancellation &amp; Refund Policy</h2>
            <p>Once an appointment has been booked and payment has been made, the appointment amount is <strong className="text-slate-700">non-refundable if the patient cancels the appointment</strong>.</p>
            <p>This means that if you book a physiotherapy session and subsequently cancel it for any reason, the amount paid for that appointment <strong className="text-slate-700">will not be refunded</strong>.</p>
            <p>We strongly recommend that you review your appointment date, time, and other booking details carefully before completing your payment.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Rescheduling</h2>
            <p>If you are unable to attend your scheduled appointment, you may contact the physiotherapist to request a rescheduling, subject to availability and the clinic's rescheduling policy.</p>
            <p>Rescheduling is not guaranteed and may be subject to applicable conditions.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Late Arrival</h2>
            <p>Patients are requested to arrive on time for their scheduled appointment. Arriving late may reduce the available treatment time and may not entitle the patient to a refund or reduction in the appointment fee.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. No-Show</h2>
            <p>If a patient does not attend the scheduled appointment without prior notice, the appointment will be treated as a <strong className="text-slate-700">no-show</strong>, and the amount paid for the appointment will <strong className="text-slate-700">not be refunded</strong>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Clinic Cancellation or Changes</h2>
            <p>If the patient needs to cancel or reschedule an appointment due to circumstances on the clinic's side, the clinic may offer the patient an alternative appointment or, where applicable, a refund of the amount paid.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Physiotherapy Services</h2>
            <p>Physiotherapy treatment and outcomes may vary from person to person. Booking an appointment does not guarantee a particular treatment outcome or recovery period.</p>
            <p>The physiotherapist will assess the patient's condition and recommend an appropriate treatment plan based on the assessment.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Acceptance of Terms</h2>
            <p>By completing an appointment booking, you acknowledge that you have read, understood, and agreed to these Terms &amp; Conditions, including the <strong className="text-slate-700">non-refundable cancellation policy</strong>.</p>
          </section>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
            <p className="font-semibold text-teal-800 mb-2">Mandatory Consent Checkbox</p>
            <p className="text-teal-900">
              ☐ I have read and agree to the Terms &amp; Conditions. I understand that once I book
              and pay for a physiotherapy appointment, the payment is non-refundable if I cancel the
              appointment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
