import React, { createContext, useContext, useState } from 'react';
import { Appointment, ConsultationMode, Doctor } from '../types';
import { INITIAL_APPOINTMENTS } from '../data/appointments';
import confetti from 'canvas-confetti';

export type PageView = 'home' | 'doctors' | 'doctor-detail' | 'categories' | 'appointments' | 'dashboard' | 'about';

interface BookingModalOptions {
  doctor?: Doctor;
  mode?: ConsultationMode;
  symptom?: string;
}

interface BookingContextType {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  selectedDoctorId: string | null;
  setSelectedDoctorId: (id: string | null) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  selectedSymptomSlug: string | null;
  setSelectedSymptomSlug: (slug: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  // Booking modal
  isBookingOpen: boolean;
  bookingOptions: BookingModalOptions;
  openBookingModal: (options?: BookingModalOptions) => void;
  closeBookingModal: () => void;

  // Appointments Store
  appointments: Appointment[];
  addAppointment: (newApt: Omit<Appointment, 'id' | 'createdAt'>) => Appointment;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
  cancelAppointment: (id: string, reason?: string) => void;

  // Navigation helpers
  navigateToDoctor: (doctorId: string) => void;
  navigateToCategory: (categorySlug: string) => void;
  navigateToSymptom: (symptomSlug: string) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPageState] = useState<PageView>('home');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedSymptomSlug, setSelectedSymptomSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingOptions, setBookingOptions] = useState<BookingModalOptions>({});

  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);

  const setCurrentPage = (page: PageView) => {
    setCurrentPageState(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openBookingModal = (options: BookingModalOptions = {}) => {
    setBookingOptions(options);
    setIsBookingOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingOpen(false);
    setBookingOptions({});
  };

  const addAppointment = (data: Omit<Appointment, 'id' | 'createdAt'>): Appointment => {
    const id = 'apt-' + Math.floor(100000 + Math.random() * 900000);
    const createdAt = new Date().toISOString().split('T')[0];
    const newAppointment: Appointment = {
      ...data,
      id,
      createdAt,
    };

    setAppointments(prev => [newAppointment, ...prev]);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.log('Confetti triggered', e);
    }

    return newAppointment;
  };

  const rescheduleAppointment = (id: string, newDate: string, newTime: string) => {
    setAppointments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, date: newDate, timeSlot: newTime } : apt))
    );
  };

  const cancelAppointment = (id: string, reason: string = 'User requested cancellation') => {
    setAppointments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, status: 'cancelled', cancellationReason: reason } : apt))
    );
  };

  const navigateToDoctor = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setCurrentPage('doctor-detail');
  };

  const navigateToCategory = (categorySlug: string) => {
    setSelectedCategorySlug(categorySlug);
    setCurrentPage('doctors');
  };

  const navigateToSymptom = (symptomSlug: string) => {
    setSelectedSymptomSlug(symptomSlug);
    setCurrentPage('doctors');
  };

  return (
    <BookingContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        selectedDoctorId,
        setSelectedDoctorId,
        selectedCategorySlug,
        setSelectedCategorySlug,
        selectedSymptomSlug,
        setSelectedSymptomSlug,
        searchQuery,
        setSearchQuery,
        isBookingOpen,
        bookingOptions,
        openBookingModal,
        closeBookingModal,
        appointments,
        addAppointment,
        rescheduleAppointment,
        cancelAppointment,
        navigateToDoctor,
        navigateToCategory,
        navigateToSymptom,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
};
