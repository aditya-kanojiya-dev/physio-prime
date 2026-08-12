import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { BookingModal } from './components/booking/BookingModal';
import { ChatbotButton } from './components/chatbot/ChatbotButton';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BookingProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/doctors" element={<FindDoctorsPage />} />
                  <Route path="/doctor/:id" element={<DoctorDetailPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/categories/:specialty" element={<CategoriesPage />} />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/book/:doctorId" element={<BookingModal />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <BookingModal />
              <ChatbotButton />
              <Footer />
            </div>
          </BookingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;