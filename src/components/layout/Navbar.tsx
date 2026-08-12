import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBooking, PageView } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { Activity, User, Menu, X, ArrowRight, Sparkles, MapPin, LogIn, LogOut, Home, Stethoscope, Layers, Calendar, Info, Briefcase, LayoutDashboard, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthModal } from '../auth/AuthModal';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openBookingModal, appointments } = useBooking();
  const { user, logout, authModalOpen, openAuthModal, closeAuthModal } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items with their routes
  const navItems: { 
    id: PageView; 
    label: string; 
    path: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: 'home', label: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { id: 'doctors', label: 'Find Therapists', path: '/doctors', icon: <Stethoscope className="w-5 h-5" /> },
    { id: 'categories', label: 'Specialties', path: '/categories', icon: <Layers className="w-5 h-5" /> },
    { id: 'appointments', label: 'My Appointments', path: '/appointments', icon: <Calendar className="w-5 h-5" />, badge: upcomingCount },
    { id: 'about', label: 'About Us', path: '/about', icon: <Info className="w-5 h-5" /> },
    { id: 'career', label: 'Careers', path: '/career', icon: <Briefcase className="w-5 h-5" /> },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Check if current path matches nav item
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'py-3 glass-nav shadow-lg shadow-blue-500/5'
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Logo - Using Link for navigation */}
            <Link
              to="/"
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    Physio<span className="text-gradient">Prime</span>
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-teal-500" /> Nagpur & Pan-India
                </p>
              </div>
            </Link>

            {/* Desktop Nav Links - Using Link for routing */}
            <nav className="hidden lg:flex items-center gap-1 bg-white/70 p-1.5 rounded-full border border-slate-200/80 backdrop-blur-md shadow-sm">
              {navItems.map(item => {
                const isActive = isActiveRoute(item.path);
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'text-white bg-blue-600 shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/50'
                    }`}
                  >
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-white text-blue-600'
                            : 'bg-blue-600 text-white animate-pulse'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Auth Button */}
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200/60 flex items-center gap-2 font-semibold text-sm"
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="max-w-[120px] truncate">Hi, {user.name.split(' ')[0]}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200/60"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/60 flex items-center gap-2 font-semibold text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Quick Book Home Visit CTA */}
              <button
                onClick={() => openBookingModal({ mode: 'home' })}
                className="btn-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4 text-teal-300 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Book Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer - Full Screen */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden fixed top-[60px] left-0 right-0 bottom-0 bg-white/95 backdrop-blur-lg border-b border-slate-200 overflow-y-auto shadow-2xl"
              style={{ height: `calc(100vh - 60px)` }}
            >
              <div className="flex flex-col h-full">
                {/* User Info Card */}
                <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-teal-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {user ? user.name : 'Guest User'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {user ? user.email : 'Sign in for personalized experience'}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                        <Activity className="w-3 h-3 text-teal-500" />
                        <span className="font-medium">PhysioPrime</span>
                        <span className="text-slate-300">•</span>
                        <MapPin className="w-3 h-3 text-teal-500" />
                        <span>Nagpur & Pan-India</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {navItems.map(item => {
                    const isActive = isActiveRoute(item.path);
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-3 rounded-xl text-left font-semibold text-base transition-colors flex items-center justify-between ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-white' : 'text-blue-500'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-left font-semibold text-base text-slate-700 hover:bg-slate-100 flex items-center gap-3"
                  >
                    <LayoutDashboard className="w-5 h-5 text-blue-500" />
                    <span>Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (user) {
                        logout();
                      } else {
                        openAuthModal();
                      }
                    }}
                    className="px-4 py-3 rounded-xl text-left font-semibold text-base text-slate-700 hover:bg-slate-100 flex items-center gap-3 w-full"
                  >
                    <LogIn className="w-5 h-5 text-teal-500" />
                    <span>{user ? 'Sign Out' : 'Sign In / Create Account'}</span>
                  </button>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openBookingModal({ mode: 'home' });
                    }}
                    className="w-full btn-gradient text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                  >
                    <Sparkles className="w-5 h-5 text-teal-300" />
                    <span>Book Certified Therapist</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
                    <a href="tel:+919876543210" className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                      <Phone className="w-3 h-3" />
                      <span>24/7 Support</span>
                    </a>
                    <span className="text-slate-300">|</span>
                    <a href="mailto:support@physioprime.com" className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                      <Mail className="w-3 h-3" />
                      <span>Contact</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
    </>
  );
};