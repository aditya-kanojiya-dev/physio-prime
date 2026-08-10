import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { Appointment } from '../types';
import { Calendar, Video, Home, MapPin, RotateCcw, XCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoctorTrackingModal } from '../components/tracking/DoctorTrackingModal';

export const AppointmentsPage: React.FC = () => {
  const { appointments, openBookingModal, rescheduleAppointment, cancelAppointment } = useBooking();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [trackingApt, setTrackingApt] = useState<Appointment | null>(null);

  // Reschedule state
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('2026-08-15');
  const [newTime, setNewTime] = useState('04:30 PM');

  // Cancel modal state
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Schedule conflict');

  const filteredAppointments = appointments.filter(a => a.status === activeTab);

  const handleConfirmReschedule = () => {
    if (rescheduleApt) {
      rescheduleAppointment(rescheduleApt.id, newDate, newTime);
      setRescheduleApt(null);
    }
  };

  const handleConfirmCancel = () => {
    if (cancelApt) {
      cancelAppointment(cancelApt.id, cancelReason);
      setCancelApt(null);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Patient Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              My <span className="text-gradient">Appointments</span>
            </h1>
          </div>

          <button
            onClick={() => openBookingModal({ mode: 'home' })}
            className="btn-gradient text-white px-6 py-3 rounded-2xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>Book New Appointment</span>
          </button>
        </div>

        {/* Tab Filters Bar */}
        <div className="flex items-center justify-between p-2 rounded-2xl glass-panel border border-slate-200 shadow-md">
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Upcoming</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-white/20">
                {appointments.filter(a => a.status === 'upcoming').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Completed</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-white/20">
                {appointments.filter(a => a.status === 'completed').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'cancelled'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Cancelled</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-white/20">
                {appointments.filter(a => a.status === 'cancelled').length}
              </span>
            </button>
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map(apt => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 bg-white"
              >
                
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img src={apt.doctorPhoto} alt={apt.doctorName} className="w-12 h-12 rounded-2xl object-cover" />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{apt.doctorName}</h3>
                      <p className="text-xs text-teal-600 font-semibold">{apt.doctorSpecialty}</p>
                    </div>
                  </div>

                  {/* Mode & Fee Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 capitalize flex items-center gap-1.5">
                      {apt.consultationMode === 'home' ? <Home className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                      {apt.consultationMode} Visit
                    </span>
                    <span className="text-sm font-black text-slate-900">₹{apt.fee}</span>
                  </div>
                </div>

                {/* Schedule & Address Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" /> Date & Time
                    </span>
                    <p className="font-extrabold text-slate-900">{apt.date} at {apt.timeSlot}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5 sm:col-span-2">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-500" /> Location / Link
                    </span>
                    <p className="font-semibold text-slate-900 truncate">
                      {apt.consultationMode === 'home' ? apt.address || apt.doctorLocation : 'Online HD Video Room Link'}
                    </p>
                  </div>
                </div>

                {/* Actions Bar */}
                {apt.status === 'upcoming' && (
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                    {apt.consultationMode === 'online' && (
                      <a
                        href={apt.videoCallLink || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-gradient text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2"
                      >
                        <Video className="w-4 h-4 text-cyan-300" />
                        <span>Join HD Consultation</span>
                      </a>
                    )}
                    {apt.consultationMode === 'home' && (
                      <button
                        onClick={() => setTrackingApt(apt)}
                        className="btn-gradient text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-teal-300" />
                        <span>Track Doctor</span>
                      </button>
                    )}

                    <button
                      onClick={() => setRescheduleApt(apt)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reschedule Slot</span>
                    </button>

                    <button
                      onClick={() => setCancelApt(apt)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}

              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty State Illustration */
          <div className="glass-panel p-12 rounded-3xl border border-slate-200 text-center space-y-6">
            <div className="w-32 h-32 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto shadow-inner">
              <Calendar className="w-16 h-16 text-blue-500" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-2xl font-extrabold text-slate-900">
                No {activeTab} appointments found
              </h3>
              <p className="text-sm text-slate-500">
                You do not have any appointments scheduled in this section yet. Book a session with top physiotherapists today.
              </p>
            </div>

            <button
              onClick={() => openBookingModal({ mode: 'home' })}
              className="btn-gradient text-white px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Book Appointment Now</span>
            </button>
          </div>
        )}

      </div>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Reschedule Appointment</h3>
              <p className="text-xs text-slate-500">Select new date and time for {rescheduleApt.doctorName}:</p>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">New Time Slot</label>
                <select
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button onClick={() => setRescheduleApt(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                <button onClick={handleConfirmReschedule} className="btn-gradient text-white px-5 py-2 rounded-xl font-bold text-xs">Confirm Reschedule</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-rose-600">Cancel Appointment</h3>
              <p className="text-xs text-slate-500">Are you sure you want to cancel appointment with {cancelApt.doctorName}?</p>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Cancellation Reason</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button onClick={() => setCancelApt(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Keep Appointment</button>
                <button onClick={handleConfirmCancel} className="bg-rose-600 text-white px-5 py-2 rounded-xl font-bold text-xs">Confirm Cancellation</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tracking Modal */}
      {trackingApt && (
        <DoctorTrackingModal appointment={trackingApt} onClose={() => setTrackingApt(null)} />
      )}

    </div>
  );
};
