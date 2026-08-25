import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import logo from '../../assets/logo.png';

const platformLinks = [
  { to: '/about', label: 'About Physio Prime' },
  { to: '/doctors', label: 'Find a Physiotherapist' },
  { to: '/categories', label: 'Physiotherapy Services' },
  { to: '/conditions', label: 'Conditions We Treat' },
  { to: '/blog', label: 'Blog' },
  { to: '/career', label: 'Careers' },
];

const patientLinks = [
  { to: '/doctors', label: 'Find a Physiotherapist' },
  { to: '/book', label: 'Book a Visit' },
  { to: '/categories', label: 'Browse Specialties' },
  { to: '/conditions', label: 'Conditions & Treatments' },
  { to: '/guides/patients', label: 'Patient Guides' },
  { to: '/pricing', label: 'Pricing' },
];

const doctorLinks = [
  { to: '/about', label: 'About Physio Prime' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/career', label: 'Join Our Team' },
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
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full lg:pointer-events-none py-4 lg:py-0 border-b border-slate-200 lg:border-0"
      >
        <h4
          className="text-sm font-bold text-slate-900 tracking-wide"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {title}
        </h4>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 lg:hidden ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <ul className={`mt-3 lg:mt-4 space-y-2.5 ${open ? 'block' : 'hidden lg:block'}`}>
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className={`text-[14.5px] leading-relaxed transition-colors duration-200 ${
                link.accent
                  ? 'text-blue-600 hover:text-blue-700'
                  : 'text-slate-600 hover:text-slate-900'
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
  return (
    <footer className="relative bg-white border-t border-slate-200/80 overflow-hidden">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-12 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand column — mirrors Navbar logo treatment */}
          <div className="lg:col-span-4 space-y-5 lg:pr-8">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src={logo}
                alt="Physio Prime"
                className="h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
              <span
                className="text-xl font-extrabold tracking-tight text-slate-900"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Physio<span className="text-gradient">Prime</span>
              </span>
            </Link>

            <p className="text-blue-600 text-sm font-semibold tracking-wide">
              Optimizing motion. Improving lives.
            </p>

            <p className="text-slate-600 text-[14.5px] leading-relaxed max-w-sm">
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
                  className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300"
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
      <div className="border-t border-slate-200/80" />

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-slate-500">
        <p>&copy; {new Date().getFullYear()} Physio Prime. All rights reserved.</p>

        <div className="hidden sm:flex items-center gap-1.5 text-slate-500 font-medium">
          <span>Made with</span>
          <span className="text-blue-500">&#9829;</span>
          <span>in India</span>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/privacy" className="hover:text-slate-900 transition-colors duration-200">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-slate-900 transition-colors duration-200">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};
