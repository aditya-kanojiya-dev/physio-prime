import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import logo from '../../assets/logo.png';

const platformLinks = [
  { to: '/about', label: 'About Physio Prime' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/doctors', label: 'Find a Physiotherapist' },
  { to: '/categories', label: 'Physiotherapy Services' },
  { to: '/conditions', label: 'Conditions We Treat' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact Us' },
];

const patientLinks = [
  { to: '/doctors', label: 'Find a Physiotherapist' },
  { to: '/book', label: 'Book a Home Visit' },
  { to: '/book', label: 'Book a Clinic Visit' },
  { to: '/categories', label: 'Browse Specialties' },
  { to: '/doctors', label: 'Physiotherapists by City' },
  { to: '/conditions', label: 'Conditions & Treatments' },
  { to: '/guides/patients', label: 'Patient Guides' },
  { to: '/pricing', label: 'Pricing' },
];

const doctorLinks = [
  { to: '/doctor/signup', label: 'Join Physio Prime' },
  { to: '/doctor/signup', label: 'List Your Practice' },
  { to: '/doctor/signup', label: 'Physiotherapist Signup' },
  { to: '/doctor/dashboard', label: 'Doctor Dashboard' },
  { to: '/about#prime', label: 'PRIME Verification', accent: true },
  { to: '/about#benefits', label: 'Benefits' },
  { to: '/about#verification', label: 'Verification Process' },
  { to: '/blog', label: 'Resources' },
];

const socials = [
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    ),
  },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string; accent?: boolean }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:block">
      {/* Mobile accordion trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full lg:pointer-events-none py-4 lg:py-0 border-b border-white/[0.06] lg:border-0"
      >
        <h4 className="text-[15px] font-semibold text-white/90 tracking-wide">
          {title}
        </h4>
        <ChevronDown
          className={`w-4 h-4 text-white/30 transition-transform duration-300 lg:hidden ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Links — always visible on desktop, toggle on mobile */}
      <ul className={`mt-3 lg:mt-4 space-y-2.5 ${open ? 'block' : 'hidden lg:block'}`}>
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className={`text-[15px] leading-relaxed transition-colors duration-200 ${
                link.accent
                  ? 'text-cyan-400/80 hover:text-cyan-300'
                  : 'text-white/45 hover:text-white/90'
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const Footer: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  return (
    <footer className="relative bg-[#0B0B0F] text-white overflow-hidden">
      {/* Very subtle top edge glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      {/* Main content */}
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-20 lg:pt-24 pb-12 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-4 space-y-5 lg:pr-8">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src={logo}
                alt="Physio Prime"
                className="h-9 w-auto object-contain"
              />
              <span className="text-xl font-extrabold tracking-tight text-white/95">
                PHYSIO <span className="text-cyan-400">PRIME</span>
              </span>
            </Link>

            <p className="text-cyan-400/80 text-sm font-medium tracking-wide">
              Optimizing motion. Improving lives.
            </p>

            <p className="text-white/35 text-[14.5px] leading-relaxed max-w-sm">
              Physio Prime connects patients with trusted physiotherapists for
              professional clinic and home-based physiotherapy care.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2.5 pt-1">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] transition-all duration-300"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-2">
            <FooterColumn title="Platform" links={platformLinks} />
          </div>
          <div className="lg:col-span-3">
            <FooterColumn title="For Patients" links={patientLinks} />
          </div>
          <div className="lg:col-span-3">
            <FooterColumn title="For Physiotherapists" links={doctorLinks} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Bottom bar */}
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-white/30">
        <p>&copy; {new Date().getFullYear()} Physio Prime. All rights reserved.</p>

        <p className="hidden sm:block">
          Made with{' '}
          <span className="text-cyan-400">&#9829;</span> in India
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          {/* Language selector */}
          <div className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/[0.07] p-0.5 text-[13px]">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full transition-all duration-300 ${
                lang === 'en'
                  ? 'bg-white/10 text-white'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-3 py-1 rounded-full transition-all duration-300 ${
                lang === 'hi'
                  ? 'bg-white/10 text-white'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              हिंदी
            </button>
          </div>

          <span className="text-white/10 hidden sm:inline">|</span>

          <Link to="/privacy" className="hover:text-white/70 transition-colors duration-200">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-white/70 transition-colors duration-200">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};
