import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
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

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using PhysioPrime ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services. These terms apply to all users, including patients, physiotherapists, and visitors.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Description of Services</h2>
            <p>PhysioPrime is a healthcare marketplace that connects patients with certified physiotherapists for home visits and online video consultations. We facilitate bookings, payments, and communication but do not directly provide medical services. The therapist-patient relationship is between you and the licensed practitioner.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You must be at least 18 years old to create an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate and complete information during registration.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>One account per person; duplicate accounts may be suspended.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Bookings & Consultations</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Bookings are confirmed only after payment processing and therapist acceptance.</li>
              <li>Therapists may cancel bookings due to emergencies; you will receive a full refund.</li>
              <li>Online consultations are conducted via our secure video platform. Recording is prohibited without mutual consent.</li>
              <li>Home visit therapists will arrive at the scheduled time; please ensure safe access to your premises.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Payments & Refunds</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All payments are processed through Razorpay in Indian Rupees (INR).</li>
              <li><strong className="text-slate-700">Cancellation by Patient:</strong> Full refund if cancelled 24+ hours before the appointment. 50% refund for cancellations within 24 hours. No refund for no-shows.</li>
              <li><strong className="text-slate-700">Cancellation by Therapist:</strong> Full refund issued automatically.</li>
              <li><strong className="text-slate-700">Refund Processing:</strong> Refunds are credited to the original payment method within 5-7 business days.</li>
              <li>Service fees and platform charges are non-refundable after consultation delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Use the Platform for any unlawful purpose or in violation of medical regulations.</li>
              <li>Impersonate another person or misrepresent your identity.</li>
              <li>Attempt to access other users' accounts or data without authorization.</li>
              <li>Interfere with the proper functioning of the Platform.</li>
              <li>Transmit harmful, abusive, or inappropriate content through our messaging systems.</li>
              <li>Circumvent booking or payment processes to avoid platform fees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Intellectual Property</h2>
            <p>All content on the Platform, including text, graphics, logos, software, and design, is the property of PhysioPrime or its licensors and is protected by Indian copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our written consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Limitation of Liability</h2>
            <p>PhysioPrime acts as an intermediary platform. We are not liable for:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>The quality, outcome, or appropriateness of medical advice provided by therapists.</li>
              <li>Any injury, loss, or damage resulting from consultations arranged through the Platform.</li>
              <li>Technical failures, service interruptions, or data breaches beyond our reasonable control.</li>
            </ul>
            <p className="mt-2">Our total liability shall not exceed the amount paid by you for the specific service giving rise to the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Indemnification</h2>
            <p>You agree to indemnify and hold PhysioPrime, its directors, employees, and partners harmless from any claims, losses, or damages arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Termination</h2>
            <p>We may suspend or terminate your account at our discretion if you violate these Terms, engage in fraudulent activity, or if required by law. Upon termination, your right to use the Platform ceases immediately. We will retain data as required by our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Nagpur, Maharashtra.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">12. Changes to These Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. Continued use of the Platform after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">13. Contact</h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900">PhysioPrime Legal Team</p>
              <p>Email: <a href="mailto:legal@physioprime.health" className="text-teal-600 hover:underline">legal@physioprime.health</a></p>
              <p>Address: IT Park, South Ambazari Road, Nagpur, MH 440022</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
