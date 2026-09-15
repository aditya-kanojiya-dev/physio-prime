import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ChatbotButton } from './components/chatbot/ChatbotButton';
import { pageVariants } from './lib/motion';

const FindDoctorsPage = lazy(() => import('./pages/FindDoctorsPage').then(m => ({ default: m.FindDoctorsPage })));
const DoctorDetailPage = lazy(() => import('./pages/DoctorDetailPage').then(m => ({ default: m.DoctorDetailPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage').then(m => ({ default: m.CategoryDetailPage })));
const ConditionsHubPage = lazy(() => import('./pages/ConditionsHubPage').then(m => ({ default: m.ConditionsHubPage })));
const ConditionDetailPage = lazy(() => import('./pages/ConditionDetailPage').then(m => ({ default: m.ConditionDetailPage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const Career = lazy(() => import('./pages/Career').then(m => ({ default: m.Career })));
const BookingSlotsPage = lazy(() => import('./pages/BookingSlotsPage').then(m => ({ default: m.BookingSlotsPage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then(m => ({ default: m.BookingPage })));
const BlogListingPage = lazy(() => import('./pages/BlogListingPage').then(m => ({ default: m.BlogListingPage })));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const PatientGuidesPage = lazy(() => import('./pages/PatientGuidesPage').then(m => ({ default: m.PatientGuidesPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const CompliancePage = lazy(() => import('./pages/CompliancePage').then(m => ({ default: m.CompliancePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function CanonicalLink() {
  const { pathname } = useLocation();
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    const base = 'https://physio-prime.in';
    link.href = pathname === '/home' ? `${base}/` : `${base}${pathname.replace(/\/$/, '') || '/'}`;
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <main className="flex-1">
      <ErrorBoundary variant="page" resetKey={location.pathname}>
        <AnimatePresence mode="wait">
<motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center">Loading…</div>}>
              <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/doctors" element={<FindDoctorsPage />} />
            <Route path="/doctor/:id" element={<DoctorDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:slug" element={<CategoryDetailPage />} />
            <Route path="/conditions" element={<ConditionsHubPage />} />
            <Route path="/conditions/:slug" element={<ConditionDetailPage />} />
<Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
<Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/career" element={<Career />} />
            <Route path="/booking-slots" element={<BookingSlotsPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/blog" element={<BlogListingPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/guides/patients" element={<PatientGuidesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify" element={<VerifyEmailPage />} />
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
              </Suspense>
          </motion.div>
        </AnimatePresence>
      </ErrorBoundary>
    </main>
  );
}

export function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BookingProvider>
            <LocationProvider>
              <MotionConfig reducedMotion="user">
                <div className="min-h-screen flex flex-col">
                  <ScrollToTop />
                  <CanonicalLink />
                  <Navbar />
                  <AnimatedRoutes />
                  <ChatbotButton />
                  <Footer />
                </div>
              </MotionConfig>
            </LocationProvider>
          </BookingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;