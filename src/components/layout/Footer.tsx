import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Shield, Star, ArrowRight, Activity } from 'lucide-react';
import logo from '../../assets/logo.png';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-200/80 overflow-hidden">
      {/* Subtle top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pt-16 pb-14 border-b border-slate-200/60">

          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src={logo}
                alt="PhysioPrime logo"
                className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Physio<span className="text-gradient">Prime</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Connecting patients with top certified physiotherapists for personalized home care and HD video consultations. Quality recovery, simplified.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100">
                <Shield className="w-3.5 h-3.5" />
                100% Certified
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                4.9 / 5 Rating
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About Us' },
                { to: '/doctors', label: 'Find Therapists' },
                { to: '/categories', label: 'Specialties' },
                { to: '/blog', label: 'Blog' },
                { to: '/career', label: 'Careers' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-500 hover:text-teal-600 transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Patients */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Patients</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/how-it-works', label: 'How It Works' },
                { to: '/pricing', label: 'Pricing' },
                { to: '/appointments', label: 'My Appointments' },
                { to: '/guides/patients', label: 'Patient Guides' },
                { to: '/conditions', label: 'Conditions We Treat' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-500 hover:text-teal-600 transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialties */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Specialties</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/categories/orthopedic', label: 'Orthopedic Rehab' },
                { to: '/categories/neurological', label: 'Neurological Care' },
                { to: '/categories/sports', label: 'Sports Injury' },
                { to: '/categories/cardio', label: 'Cardio-Respiratory' },
                { to: '/categories/womens-health', label: "Women's Health" },
                { to: '/categories/geriatric', label: 'Geriatric Mobility' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-500 hover:text-teal-600 transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & CTA */}
          <div className="lg:col-span-2 space-y-5">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-500 leading-snug">IT Park, South Ambazari Rd, Nagpur, MH 440022</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                <a href="tel:+917122800749" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">
                  +91 (0712) 2800-PHYSIO
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-500 shrink-0" />
                <a href="mailto:care@physioprime.health" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">
                  care@physioprime.health
                </a>
              </li>
            </ul>
            <button
              onClick={() => navigate('/book')}
              className="w-full btn-gradient text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/15 hover:shadow-lg hover:shadow-teal-600/25 active:scale-[0.98] transition-all duration-300"
            >
              Book a Session
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} PhysioPrime Healthcare Technologies Inc. All rights reserved.</p>

          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Activity className="w-3.5 h-3.5 text-teal-500" />
            <span>Built by <strong className="text-slate-700">Digital Buddies</strong></span>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
            <Link to="/compliance" className="hover:text-slate-700 transition-colors">HIPAA</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
