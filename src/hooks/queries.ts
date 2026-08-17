import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getToken } from '../lib/api';
import {
  ApiAppointment,
  ApiCategory,
  ApiDoctor,
  ApiDoctorDetail,
  ApiReview,
  ApiSlot,
  ApiSymptom,
  mergeDoctorDetail,
  toAppointment,
  toCategory,
  toDoctor,
  toReview,
  toSymptom,
} from '../lib/adapters';
import { Appointment, Category, Doctor, DoctorLocation, Symptom } from '../types';

const STALE = 5 * 60 * 1000;

async function fetchDoctors(area?: string): Promise<Doctor[]> {
  const params = area ? `?area=${encodeURIComponent(area)}` : '';
  const data = await api.get<{ doctors: ApiDoctor[] }>(`/doctors${params}`);
  return data.doctors.map(toDoctor);
}

export function useDoctors(area?: string) {
  return useQuery({
    queryKey: ['doctors', area],
    queryFn: () => fetchDoctors(area),
    staleTime: STALE,
  });
}

export function useDoctorAreas() {
  return useQuery({
    queryKey: ['doctorAreas'],
    queryFn: async (): Promise<string[]> => {
      const data = await api.get<{ areas: string[] }>('/doctors/areas');
      return data.areas;
    },
    staleTime: STALE,
  });
}

export function useDoctorDetail(slug: string) {
  return useQuery({
    queryKey: ['doctors', slug],
    queryFn: async (): Promise<Doctor> => {
      const [detailData, reviewsData] = await Promise.all([
        api.get<{ doctor: ApiDoctorDetail }>(`/doctors/${slug}`),
        api.get<{ reviews: ApiReview[] }>(`/doctors/${slug}/reviews`),
      ]);
      const doctor = toDoctor(detailData.doctor);
      doctor.reviewsList = reviewsData.reviews.map(toReview);
      return mergeDoctorDetail(doctor, detailData.doctor);
    },
    enabled: !!slug,
    staleTime: STALE,
  });
}

export function useCategories() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const cats = await api.get<{ categories: ApiCategory[] }>('/categories');
      const doctors = await queryClient.ensureQueryData({ queryKey: ['doctors'], queryFn: fetchDoctors });
      return cats.categories.map((c) => toCategory(c, doctors));
    },
    staleTime: STALE,
  });
}

export function useSymptoms() {
  return useQuery({
    queryKey: ['symptoms'],
    queryFn: async (): Promise<Symptom[]> => {
      const data = await api.get<{ symptoms: ApiSymptom[] }>('/symptoms');
      return data.symptoms.map(toSymptom);
    },
    staleTime: STALE,
  });
}

export function useSlots(doctorSlug: string | null, date: string | null) {
  return useQuery({
    queryKey: ['slots', doctorSlug, date],
    queryFn: async (): Promise<ApiSlot[]> => {
      const data = await api.get<{ slots: ApiSlot[] }>(`/doctors/${doctorSlug}/slots?date=${date}`);
      return data.slots;
    },
    enabled: !!doctorSlug && !!date,
    staleTime: 60 * 1000,
  });
}

export function useAppointments() {
  const token = getToken();
  return useQuery({
    queryKey: ['appointments'],
    queryFn: async (): Promise<Appointment[]> => {
      const data = await api.get<{ appointments: ApiAppointment[] }>('/appointments');
      return data.appointments.map(toAppointment);
    },
    enabled: !!token,
    staleTime: 30 * 1000,
  });
}
