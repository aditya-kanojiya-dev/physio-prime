import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { Heart, Phone, Mail, MapPin, Shield, Star } from 'lucide-react';
import logo from '../../assets/logo.png';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="relative bg-slate-50 text-slate-600 pt-20 pb-12 overflow-hidden border-t border-slate-200">
      
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-slate-200">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="PhysioPrime logo"
                className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Physio<span className="text-gradient">Prime</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Connecting patients with top certified physiotherapists for personalized home care and HD video consultations. Quality recovery, simplified.
            </p>
            <div className="flex items-center gap-4 pt-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>100% Certified Doctors</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>4.9 / 5 Rating</span>
              </div>
            </div>
          </div>

          {/* Quick Links - Using React Router Links */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-bold text-base">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link to="/" className="hover:text-blue-600 transition-colors block">Home</Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-blue-600 transition-colors block">Find Physiotherapists</Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-blue-600 transition-colors block">Clinical Specialties</Link>
              </li>
              <li>
                <Link to="/appointments" className="hover:text-blue-600 transition-colors block">Appointment Dashboard</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-600 transition-colors block">About Our Mission</Link>
              </li>
              <li>
                <Link to="/career" className="hover:text-blue-600 transition-colors block">Careers</Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-blue-600 transition-colors block">Blog</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-blue-600 transition-colors block">How It Works</Link>
              </li>
              <li>
                <Link to="/guides/patients" className="hover:text-blue-600 transition-colors block">Patient Guides</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-blue-600 transition-colors block">Pricing</Link>
              </li>
            </ul>
          </div>

          {/* Clinical Specialties */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-bold text-base">Specialties</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link to="/categories/orthopedic" className="hover:text-blue-600 transition-colors block">Orthopedic Rehab</Link>
              </li>
              <li>
                <Link to="/categories/neurological" className="hover:text-blue-600 transition-colors block">Neurological Care</Link>
              </li>
              <li>
                <Link to="/categories/sports" className="hover:text-blue-600 transition-colors block">Sports Injury & Athletes</Link>
              </li>
              <li>
                <Link to="/categories/cardio" className="hover:text-blue-600 transition-colors block">Cardio-Respiratory</Link>
              </li>
              <li>
                <Link to="/categories/womens-health" className="hover:text-blue-600 transition-colors block">Women's Pelvic Health</Link>
              </li>
              <li>
                <Link to="/categories/geriatric" className="hover:text-blue-600 transition-colors block">Geriatric Mobility</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-bold text-base">Contact & Support</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
                <span>Nagpur Headquarters: IT Park, South Ambazari Road, Nagpur, MH 440022</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <a href="tel:+917122800PHYSIO" className="hover:text-blue-600 transition-colors">
                  +91 (0712) 2800-PHYSIO
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <a href="mailto:care@physioprime.health" className="hover:text-blue-600 transition-colors">
                  care@physioprime.health
                </a>
              </li>
            </ul>
            
            {/* Quick Action Button */}
            <button
              onClick={() => navigate('/book')}
              className="mt-3 w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Book a Session Now
            </button>
          </div>

        </div>

        {/* Bottom Bar & Nagpur Signature */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 PhysioPrime Healthcare Technologies Inc. All rights reserved.</p>
          
          {/* Nagpur Highlight */}
          <div className="flex items-center gap-2 text-slate-600 font-medium bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
            <span><strong className="text-slate-900">Digital Buddies</strong></span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-700 transition-colors">Terms of Service</Link>
            <Link to="/compliance" className="hover:text-slate-700 transition-colors">HIPAA Compliance</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};