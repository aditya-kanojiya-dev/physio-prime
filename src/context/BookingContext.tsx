import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Appointment, ConsultationMode, Doctor } from '../types';
import { api } from '../lib/api';
import { ApiAppointment, toAppointment } from '../lib/adapters';
import { useAppointments } from '../hooks/queries';

export type PageView = 'home' | 'doctors' | 'doctor-detail' | 'categories' | 'appointments' | 'dashboard' | 'about' | 'career' | 'blog';

export interface CreateAppointmentParams {
  doctorSlug: string;
  mode: ConsultationMode;
  date: string;
  slot: string;
  symptom?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientGender?: 'male' | 'female' | 'other';
  patientAge?: string;
  patientWeight?: string;
  patientHeight?: string;
  patientRelation?: string;
  address?: string;
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

  // Appointments store (API-backed)
  appointments: Appointment[];
  createAppointment: (data: CreateAppointmentParams) => Promise<{
    appointment: Appointment;
    razorpayOrder: { id: string; amountPaise: number } | null;
  }>;
  rescheduleAppointment: (id: string, date: string, slot: string) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;

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

  const queryClient = useQueryClient();
  const { data: apiAppointments } = useAppointments();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (apiAppointments) setAppointments(apiAppointments);
  }, [apiAppointments]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateAppointmentParams) => {
      const result = await api.post<{
        appointment: ApiAppointment;
        razorpayOrder: { id: string; amountPaise: number } | null;
      }>('/appointments', {
        doctorSlug: data.doctorSlug,
        mode: data.mode,
        date: data.date,
        slot: data.slot,
        symptom: data.symptom,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail,
        patientGender: data.patientGender,
        patientAge: data.patientAge,
        patientWeight: data.patientWeight,
        patientHeight: data.patientHeight,
        patientRelation: data.patientRelation,
        address: data.address ? { text: data.address } : undefined,
      });
      return { appointment: toAppointment(result.appointment), razorpayOrder: result.razorpayOrder };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, date, slot }: { id: string; date: string; slot: string }) => {
      await api.post(`/appointments/${id}/reschedule`, { date, slot });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await api.post(`/appointments/${id}/cancel`, { reason });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const setCurrentPage = (page: PageView) => {
    setCurrentPageState(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createAppointment = (data: CreateAppointmentParams) => createMutation.mutateAsync(data);

  const rescheduleAppointment = (id: string, date: string, slot: string) =>
    rescheduleMutation.mutateAsync({ id, date, slot });

  const cancelAppointment = (id: string, reason: string = 'User requested cancellation') =>
    cancelMutation.mutateAsync({ id, reason });

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
        appointments,
        createAppointment,
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
