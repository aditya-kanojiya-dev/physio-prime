import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { FindDoctorsPage } from './pages/FindDoctorsPage';
import { DoctorDetailPage } from './pages/DoctorDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { DashboardPage } from './pages/DashboardPage';
import { AboutPage } from './pages/AboutPage';
import { Career } from './pages/Career';
import { BookingSlotsPage } from './pages/BookingSlotsPage';
import { BookingPage } from './pages/BookingPage';
import { BlogListingPage } from './pages/BlogListingPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
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

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <main className="flex-1">
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
            <Route path="/categories/:specialty" element={<CategoriesPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/career" element={<Career />} />
            <Route path="/booking-slots" element={<BookingSlotsPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/blog" element={<BlogListingPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

export function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BookingProvider>
            <MotionConfig reducedMotion="user">
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <AnimatedRoutes />
                <ChatbotButton />
                <Footer />
              </div>
            </MotionConfig>
          </BookingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;