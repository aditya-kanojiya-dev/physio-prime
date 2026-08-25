import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="pt-28 pb-20 min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-teal-50 border border-teal-100">
            <Shield className="w-5 h-5 text-teal-600" />
          </div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Legal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-10">Last updated: August 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-600">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly and information generated through your use of our services:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong className="text-slate-700">Account Information:</strong> Name, email address, phone number, date of gender, and profile details when you create an account.</li>
              <li><strong className="text-slate-700">Health Information:</strong> Medical history, conditions, treatment notes, and prescriptions shared during consultations. This is protected health information (PHI) under HIPAA.</li>
              <li><strong className="text-slate-700">Payment Information:</strong> Billing address and payment method details, processed securely through Razorpay. We do not store card numbers.</li>
              <li><strong className="text-slate-700">Usage Data:</strong> Device information, IP address, browser type, pages visited, and interaction patterns collected automatically.</li>
              <li><strong className="text-slate-700">Location Data:</strong> Approximate location (city/area) to match you with nearby therapists. Precise GPS is only used with your explicit consent during active tracking.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To provide, maintain, and improve our healthcare marketplace services.</li>
              <li>To match patients with appropriate physiotherapists based on condition, location, and availability.</li>
              <li>To process bookings, payments, and insurance claims.</li>
              <li>To send appointment reminders, treatment follow-ups, and service updates.</li>
              <li>To ensure platform security, prevent fraud, and comply with legal obligations.</li>
              <li>To communicate marketing and promotional materials (with your opt-in consent).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Information Sharing</h2>
            <p>We do not sell your personal information. We share data only in the following circumstances:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong className="text-slate-700">With Therapists:</strong> Your name, condition summary, and appointment details are shared with your assigned therapist to deliver care.</li>
              <li><strong className="text-slate-700">Service Providers:</strong> Trusted third parties (payment processors, cloud hosting, SMS providers) who operate under strict data protection agreements.</li>
              <li><strong className="text-slate-700">Legal Requirements:</strong> When required by law, court order, or to protect the safety of our users and the public.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures including AES-256 encryption at rest, TLS 1.3 in transit, role-based access controls, and regular security audits. All health data is stored in HIPAA-compliant infrastructure. Despite our measures, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-slate-700">Access:</strong> Request a copy of all personal data we hold about you.</li>
              <li><strong className="text-slate-700">Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong className="text-slate-700">Deletion:</strong> Request deletion of your account and associated data, subject to legal retention requirements.</li>
              <li><strong className="text-slate-700">Portability:</strong> Request your data in a machine-readable format.</li>
              <li><strong className="text-slate-700">Opt-Out:</strong> Unsubscribe from marketing communications at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide services. Medical records are retained for a minimum of 7 years as required by Indian medical regulations. After account deletion, we remove identifiable data within 30 days, except where retention is legally required.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Cookies & Tracking</h2>
            <p>We use essential cookies for authentication and session management, and optional analytics cookies (with your consent) to understand usage patterns. We do not use third-party advertising trackers. You can manage cookie preferences through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Children's Privacy</h2>
            <p>Our services are not directed to individuals under 18. We do not knowingly collect data from minors. If a parent or guardian becomes aware that their child has provided us with personal information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification at least 30 days before they take effect. Continued use of our services after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Contact Us</h2>
            <p>For questions about this Privacy Policy or to exercise your data rights:</p>
            <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900">PhysioPrime Data Protection Officer</p>
              <p>Email: <a href="mailto:privacy@physioprime.health" className="text-teal-600 hover:underline">privacy@physioprime.health</a></p>
              <p>Address: IT Park, South Ambazari Road, Nagpur, MH 440022</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
