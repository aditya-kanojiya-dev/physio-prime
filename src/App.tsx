import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
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

export function App() {
  return (
    <Router>
      <BookingProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/doctors" element={<FindDoctorsPage />} />
              <Route path="/doctor/:id" element={<DoctorDetailPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:specialty" element={<CategoriesPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/book/:doctorId" element={<BookingModal />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>
          <BookingModal />
          <ChatbotButton />
          <Footer />
        </div>
      </BookingProvider>
    </Router>
  );
}

export default App;