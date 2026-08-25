import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck, Eye, Server, FileCheck, AlertTriangle } from 'lucide-react';

const complianceItems = [
  {
    icon: ShieldCheck,
    title: 'Administrative Safeguards',
    items: [
      'Designated Privacy Officer overseeing all PHI handling',
      'Mandatory annual HIPAA training for all employees and therapists',
      'Documented policies for data access, use, and disclosure',
      'Regular risk assessments and compliance audits',
      'Incident response and breach notification procedures',
    ],
  },
  {
    icon: Lock,
    title: 'Technical Safeguards',
    items: [
      'AES-256 encryption for all PHI at rest',
      'TLS 1.3 encryption for all data in transit',
      'Role-based access controls with least-privilege principles',
      'Multi-factor authentication for therapist and admin accounts',
      'Automated session timeout and access logging',
    ],
  },
  {
    icon: Server,
    title: 'Physical Safeguards',
    items: [
      'Cloud infrastructure hosted in SOC 2 Type II certified data centers',
      'Biometric and key-card access to server facilities',
      'Secure disposal of physical media and devices',
      'Redundant backups across geographically separated regions',
    ],
  },
  {
    icon: Eye,
    title: 'Patient Rights',
    items: [
      'Right to access all personal health information',
      'Right to request corrections to inaccurate records',
      'Right to receive an accounting of disclosures',
      'Right to request restrictions on certain uses',
      'Right to receive breach notifications within 60 days',
    ],
  },
  {
    icon: FileCheck,
    title: 'Business Associate Agreements',
    items: [
      'All third-party vendors sign BAAs before accessing PHI',
      'Payment processor (Razorpay) operates under strict data isolation',
      'Cloud providers maintain HIPAA-eligible certifications',
      'Annual vendor compliance reviews and audits',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Breach Protocol',
    items: [
      'Immediate containment and investigation of any suspected breach',
      'Risk assessment within 24 hours of discovery',
      'Affected individuals notified within 60 days if PHI is compromised',
      'HHS Office for Civil Rights notified for breaches affecting 500+ individuals',
      'Full incident documentation and remediation tracking',
    ],
  },
];

export const CompliancePage: React.FC = () => {
  return (
    <div className="pt-28 pb-20 min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Compliance</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">HIPAA Compliance</h1>
        <p className="text-sm text-slate-400 mb-6">Last updated: August 2026</p>

        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 mb-12">
          <p className="text-sm text-emerald-800 leading-relaxed">
            PhysioPrime is committed to protecting the privacy and security of Protected Health Information (PHI) in accordance with the Health Insurance Portability and Accountability Act (HIPAA), the Indian Digital Information Security in Healthcare Act (DISHA), and applicable data protection regulations. This page outlines our compliance framework.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complianceItems.map((section) => (
            <div key={section.title} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-teal-50 border border-teal-100">
                  <section.icon className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-2">Contact Our Privacy Officer</h2>
          <p className="text-sm text-slate-600 mb-3">For HIPAA-related inquiries, data access requests, or to report a potential breach:</p>
          <div className="text-sm text-slate-600 space-y-1">
            <p><strong className="text-slate-700">Email:</strong> <a href="mailto:hipaa@physioprime.health" className="text-teal-600 hover:underline">hipaa@physioprime.health</a></p>
            <p><strong className="text-slate-700">Phone:</strong> +91 (0712) 2800-PHYSIO</p>
            <p><strong className="text-slate-700">Mail:</strong> PhysioPrime Privacy Officer, IT Park, South Ambazari Road, Nagpur, MH 440022</p>
          </div>
        </div>

      </div>
    </div>
  );
};
