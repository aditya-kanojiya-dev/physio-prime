import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { useSlots } from '../hooks/queries';
import { slotLabel } from '../lib/adapters';
import { Appointment } from '../types';
import { Calendar, Video, Home, MapPin, RotateCcw, XCircle, Sparkles, Loader2, User, Mail, Phone, Ruler, Weight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoctorTrackingModal } from '../components/tracking/DoctorTrackingModal';

export const AppointmentsPage: React.FC = () => {
  const { appointments, openBookingModal, rescheduleAppointment, cancelAppointment } = useBooking();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [trackingApt, setTrackingApt] = useState<Appointment | null>(null);

  // Reschedule state
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const { data: rescheduleSlots, isLoading: rescheduleSlotsLoading } = useSlots(
    rescheduleApt?.doctorId ?? null,
    newDate || null
  );

  // Cancel modal state
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Schedule conflict');

  // View patient modal state
  const [viewPatientApt, setViewPatientApt] = useState<Appointment | null>(null);

  const filteredAppointments = appointments.filter(a => a.status === activeTab);

  const handleConfirmReschedule = async () => {
    if (rescheduleApt && newDate && newTime) {
      try {
        await rescheduleAppointment(rescheduleApt.id, newDate, newTime);
        setRescheduleApt(null);
      } catch {
        alert('Could not reschedule. Please try another slot.');
      }
    }
  };

  const handleConfirmCancel = async () => {
    if (cancelApt) {
      try {
        await cancelAppointment(cancelApt.id, cancelReason);
        setCancelApt(null);
      } catch {
        alert('Could not cancel the appointment. Please try again.');
      }
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

                {/* Patient Details Section */}
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-extrabold text-slate-700">Patient Details</h4>
                    <span className="text-[10px] text-slate-400 font-medium">•</span>
                    <span className="text-[10px] font-medium text-teal-600">{apt.symptom || 'General Consultation'}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-white">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Name</p>
                        <p className="text-xs font-bold text-slate-900">{apt.patientName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-white">
                      <Phone className="w-3.5 h-3.5 text-green-500" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Phone</p>
                        <p className="text-xs font-bold text-slate-900">{apt.patientPhone}</p>
                      </div>
                    </div>

                    {apt.patientEmail && (
                      <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <Mail className="w-3.5 h-3.5 text-purple-500" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold">Email</p>
                          <p className="text-xs font-bold text-slate-900 truncate">{apt.patientEmail}</p>
                        </div>
                      </div>
                    )}

                    {apt.patientGender && (
                      <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <Users className="w-3.5 h-3.5 text-pink-500" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold">Gender</p>
                          <p className="text-xs font-bold text-slate-900 capitalize">{apt.patientGender}</p>
                        </div>
                      </div>
                    )}

                    {apt.patientAge && (
                      <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold">Age</p>
                          <p className="text-xs font-bold text-slate-900">{apt.patientAge} years</p>
                        </div>
                      </div>
                    )}

                    {apt.patientWeight && (
                      <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <Weight className="w-3.5 h-3.5 text-orange-500" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold">Weight</p>
                          <p className="text-xs font-bold text-slate-900">{apt.patientWeight} kg</p>
                        </div>
                      </div>
                    )}

                    {apt.patientHeight && (
                      <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <Ruler className="w-3.5 h-3.5 text-indigo-500" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold">Height</p>
                          <p className="text-xs font-bold text-slate-900">{apt.patientHeight} cm</p>
                        </div>
                      </div>
                    )}
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
                    <button
                      onClick={() => setViewPatientApt(apt)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View Patient</span>
                    </button>

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
                      onClick={() => {
                        setRescheduleApt(apt);
                        setNewDate(apt.date);
                        setNewTime('');
                      }}
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
                  onChange={e => {
                    setNewDate(e.target.value);
                    setNewTime('');
                  }}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">New Time Slot</label>
                {rescheduleSlotsLoading ? (
                  <p className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading slots...
                  </p>
                ) : rescheduleSlots && rescheduleSlots.length > 0 ? (
                  <select
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                  >
                    <option value="">Select a slot</option>
                    {rescheduleSlots.map(s => (
                      <option key={`${s.start}-${s.end}`} value={`${s.start}-${s.end}`}>
                        {slotLabel(s)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    No slots available for this day.
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button onClick={() => setRescheduleApt(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                <button
                  onClick={handleConfirmReschedule}
                  disabled={!newDate || !newTime}
                  className="btn-gradient text-white px-5 py-2 rounded-xl font-bold text-xs disabled:opacity-50"
                >
                  Confirm Reschedule
                </button>
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

      {/* View Patient Details Modal */}
      <AnimatePresence>
        {viewPatientApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900">Patient Details</h3>
                <button
                  onClick={() => setViewPatientApt(null)}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Patient Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{viewPatientApt.patientName}</p>
                      <p className="text-xs text-teal-600 font-semibold">{viewPatientApt.symptom || 'General Consultation'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 rounded-xl px-3 py-2 border border-white">
                      <p className="text-[10px] text-slate-400 font-semibold">Phone</p>
                      <p className="text-sm font-bold text-slate-900">{viewPatientApt.patientPhone}</p>
                    </div>

                    {viewPatientApt.patientEmail && (
                      <div className="bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <p className="text-[10px] text-slate-400 font-semibold">Email</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{viewPatientApt.patientEmail}</p>
                      </div>
                    )}

                    {viewPatientApt.patientGender && (
                      <div className="bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <p className="text-[10px] text-slate-400 font-semibold">Gender</p>
                        <p className="text-sm font-bold text-slate-900 capitalize">{viewPatientApt.patientGender}</p>
                      </div>
                    )}

                    {viewPatientApt.patientAge && (
                      <div className="bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <p className="text-[10px] text-slate-400 font-semibold">Age</p>
                        <p className="text-sm font-bold text-slate-900">{viewPatientApt.patientAge} years</p>
                      </div>
                    )}

                    {viewPatientApt.patientWeight && (
                      <div className="bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <p className="text-[10px] text-slate-400 font-semibold">Weight</p>
                        <p className="text-sm font-bold text-slate-900">{viewPatientApt.patientWeight} kg</p>
                      </div>
                    )}

                    {viewPatientApt.patientHeight && (
                      <div className="bg-white/60 rounded-xl px-3 py-2 border border-white">
                        <p className="text-[10px] text-slate-400 font-semibold">Height</p>
                        <p className="text-sm font-bold text-slate-900">{viewPatientApt.patientHeight} cm</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-700">Appointment Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400 font-semibold">Doctor</p>
                      <p className="font-bold text-slate-900">{viewPatientApt.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Specialty</p>
                      <p className="font-bold text-slate-900">{viewPatientApt.doctorSpecialty}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Date & Time</p>
                      <p className="font-bold text-slate-900">{viewPatientApt.date} at {viewPatientApt.timeSlot}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Mode</p>
                      <p className="font-bold text-slate-900 capitalize">{viewPatientApt.consultationMode}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Payment</p>
                      <p className="font-bold text-slate-900">{viewPatientApt.paymentMethod || 'Cash'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Fee</p>
                      <p className="font-bold text-blue-600">₹{viewPatientApt.fee}</p>
                    </div>
                  </div>
                </div>

                {viewPatientApt.consultationMode === 'home' && viewPatientApt.address && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-500" /> Home Address
                    </h4>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{viewPatientApt.address}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={() => setViewPatientApt(null)}
                  className="btn-gradient text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md"
                >
                  Close Details
                </button>
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
