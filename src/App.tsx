import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { FindDoctorsPage } from './pages/FindDoctorsPage';
import { DoctorDetailPage } from './pages/DoctorDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { ConditionsHubPage } from './pages/ConditionsHubPage';
import { ConditionDetailPage } from './pages/ConditionDetailPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { DashboardPage } from './pages/DashboardPage';
import { AboutPage } from './pages/AboutPage';
import { Career } from './pages/Career';
import { BookingSlotsPage } from './pages/BookingSlotsPage';
import { BookingPage } from './pages/BookingPage';
import { BlogListingPage } from './pages/BlogListingPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PatientGuidesPage } from './pages/PatientGuidesPage';
import { PricingPage } from './pages/PricingPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { CompliancePage } from './pages/CompliancePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ChatbotButton } from './components/chatbot/ChatbotButton';
import { pageVariants } from './lib/motion';

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
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
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