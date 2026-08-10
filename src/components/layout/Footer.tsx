import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { Activity, Heart, Send, CheckCircle, Phone, Mail, MapPin, Shield, Star } from 'lucide-react';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { openBookingModal } = useBooking();
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      // You can add API call here to save email
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-slate-50 text-slate-600 pt-20 pb-12 overflow-hidden border-t border-slate-200">
      
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Newsletter Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-white to-teal-50 p-8 sm:p-12 rounded-3xl border border-blue-200 shadow-lg mb-16 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Recovery Insights & Ergonomic Tips
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Join 25,000+ Health-Conscious Patients
              </h3>
              <p className="text-slate-500 text-sm sm:text-base">
                Receive weekly physical therapy guides, posture checkups, and exclusive home consultation offers.
              </p>
            </div>

            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl flex items-center gap-3 text-teal-700">
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  <span className="font-semibold text-sm">Thank you! You are subscribed to PhysioPrime health tips.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="flex-1 bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-sm"
                  />
                  <button
                    type="submit"
                    className="btn-gradient text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform whitespace-nowrap"
                  >
                    <span>Subscribe</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-slate-200">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/home" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
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
                <Link to="/home" className="hover:text-blue-600 transition-colors block">Home</Link>
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
              onClick={() => openBookingModal({ mode: 'home' })}
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