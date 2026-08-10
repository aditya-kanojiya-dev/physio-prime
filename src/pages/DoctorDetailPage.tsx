import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { DOCTORS_DATA } from '../data/doctors';
import { DoctorProfileHeader } from '../components/doctors/DoctorProfileHeader';
import { DoctorProfileTabs } from '../components/doctors/DoctorProfileTabs';
import { StickyBookingPanel } from '../components/doctors/StickyBookingPanel';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const DoctorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedDoctorId } = useBooking();

  // Find doctor by ID from URL
  const doctor = DOCTORS_DATA.find(d => d.id === id);

  // Update context when doctor is found
  useEffect(() => {
    if (doctor) {
      setSelectedDoctorId(doctor.id);
    }
  }, [doctor, setSelectedDoctorId]);

  // Handle case where doctor is not found
  if (!doctor) {
    return (
      <div className="pt-28 pb-20 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Doctor Not Found</h2>
          <p className="text-slate-500 mb-6">
            The doctor you're looking for doesn't exist or may have been removed.
          </p>
          <button
            onClick={() => navigate('/doctors')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/doctors')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Physiotherapists</span>
        </button>

        {/* Doctor Header Banner */}
        <DoctorProfileHeader doctor={doctor} />

        {/* Main Grid: Tabs on Left, Sticky Booking Sidebar on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <DoctorProfileTabs doctor={doctor} />
          </div>

          <div className="lg:col-span-4">
            <StickyBookingPanel doctor={doctor} />
          </div>
        </div>

      </div>
    </div>
  );
};