import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { Doctor, ConsultationMode, Symptom } from '../../types';
import { api, ApiError } from '../../lib/api';
import { fadeUp } from '../../lib/motion';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Calendar,
  Clock,
  CreditCard,
  Home,
  Video,
  MapPin,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface ConfirmStepProps {
  doctor: Doctor;
  mode: ConsultationMode;
  symptom: Symptom | null;
  selectedDate: string;
  selectedTime: string;
  onBack: () => void;
}

let razorpayLoaded: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (!razorpayLoaded) {
    razorpayLoaded = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
      document.body.appendChild(script);
    });
  }
  return razorpayLoaded;
}

const RELATIONS = ['Father', 'Mother', 'Spouse', 'Child', 'Grandparent', 'Sibling', 'Friend', 'Other'];

const MODE_LABELS: Record<ConsultationMode, string> = {
  home: 'Home Visit',
  online: 'Online Video',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function ageFromDob(dob?: string | null): string {
  if (!dob) return '';
  const years = (Date.now() - new Date(dob + 'T00:00:00').getTime()) / (365.25 * 24 * 3600 * 1000);
  const age = Math.floor(years);
  return age >= 1 && age <= 100 ? String(age) : '';
}

function addressFromUser(address: Record<string, unknown> | null | undefined): string {
  if (!address || typeof address !== 'object') return '';
  const primary = address.text ?? address.address ?? address.line1;
  return typeof primary === 'string' ? primary : '';
}

export const ConfirmStep: React.FC<ConfirmStepProps> = ({
  doctor,
  mode,
  symptom,
  selectedDate,
  selectedTime,
  onBack,
}) => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { createAppointment } = useBooking();

  const [forOther, setForOther] = useState(false);
  const [relation, setRelation] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('male');
  const [patientAge, setPatientAge] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [patientHeight, setPatientHeight] = useState('');
  const [address, setAddress] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Awaited<ReturnType<typeof createAppointment>>['appointment'] | null>(null);

  const fee = doctor.fees[mode];

  function prefillSelf() {
    if (!user) return;
    setPatientName(user.name || '');
    setPatientEmail(user.email || '');
    setPatientPhone(user.phone || '');
    setPatientGender((user.gender as 'male' | 'female' | 'other') || 'male');
    setPatientAge(ageFromDob(user.dob));
    setPatientWeight(user.weight || '');
    setPatientHeight(user.height || '');
    setAddress(addressFromUser(user.address));
  }

  useEffect(() => {
    if (user && !forOther) prefillSelf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (createdAppointment) {
      const burst = setTimeout(() => confetti({ particleCount: 160, spread: 90, origin: { y: 0.35 } }), 250);
      return () => clearTimeout(burst);
    }
  }, [createdAppointment]);

  const ageNum = parseInt(patientAge);
  const canSubmit = useMemo(() => {
    if (!user) return false;
    if (!patientName || !patientPhone || !patientEmail || !patientGender) return false;
    if (!patientAge || ageNum < 1 || ageNum > 100) return false;
    if (!patientWeight || !patientHeight) return false;
    if (forOther && !relation) return false;
    if (!agreed) return false;
    return true;
  }, [user, patientName, patientPhone, patientEmail, patientGender, patientAge, patientWeight, patientHeight, forOther, relation, agreed]);

  const handlePay = async () => {
    setProcessing(true);
    setPaymentError(null);
    try {
      const { appointment, razorpayOrder } = await createAppointment({
        doctorSlug: doctor.id,
        mode,
        date: selectedDate,
        slot: selectedTime,
        symptom: symptom?.title || problemDescription || undefined,
        patientName,
        patientPhone,
        patientEmail,
        patientGender,
        patientAge,
        patientWeight,
        patientHeight,
        patientRelation: forOther ? relation : undefined,
        address: mode === 'home' ? address : undefined,
      });
      setCreatedAppointment(appointment);

      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!key || !razorpayOrder) {
        setPaymentError('Payment gateway is not configured - your appointment is reserved but unpaid.');
        return;
      }

      await loadRazorpay();
      const rzp = new window.Razorpay!({
        key,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amountPaise,
        currency: 'INR',
        name: 'PhysioPrime',
        description: appointment.doctorName + ' - ' + appointment.doctorSpecialty,
        prefill: { name: patientName, email: patientEmail, contact: patientPhone },
        handler: async (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post('/appointments/' + appointment.id + '/verify', {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch {
            // ponytail: verification failed but payment went through; backend will reconcile
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentError('Payment was not completed. Your appointment is reserved but unpaid.');
          },
        },
      });
      rzp.open();
    } catch (err) {
      if (err instanceof ApiError) {
        setPaymentError(
          /razorpay/i.test(err.message)
            ? 'Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to api/.env and VITE_RAZORPAY_KEY_ID to your .env.'
            : err.message
        );
      } else {
        setPaymentError('Something went wrong. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Success state
  if (createdAppointment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
          <motion.div variants={fadeUp()} initial="hidden" animate="visible" className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900">Appointment Scheduled!</h2>
              <p className="text-sm text-slate-500">
                Booking ID: <strong className="text-slate-900">{createdAppointment.id}</strong>
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-left space-y-4 shadow-md">
              <div className="flex items-center gap-3">
                <img src={doctor.photo} alt={doctor.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{createdAppointment.doctorName}</p>
                  <p className="text-xs text-teal-600 font-semibold">{createdAppointment.doctorSpecialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold">Date & Time</span>
                  <p className="font-extrabold text-slate-900">{formatDate(selectedDate)}</p>
                  <p className="font-extrabold text-slate-900">{selectedTime}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Consultation Mode</span>
                  <p className="font-extrabold text-blue-600 capitalize">{MODE_LABELS[mode]}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Total Paid</span>
                  <p className="font-extrabold text-slate-900">{'\u20B9'}{fee}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="w-full btn-gradient text-white py-3 rounded-xl font-extrabold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Go to My Appointments
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-xl mx-auto px-4 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center py-16 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 flex items-center justify-center text-white mx-auto shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Please sign in to complete your booking</h3>
              <p className="text-xs text-slate-500">You need an account to confirm a booking with {doctor.name}.</p>
            </div>
            <button
              type="button"
              onClick={openAuthModal}
              className="btn-gradient text-white px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Sign In / Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in: main form
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div variants={fadeUp()} initial="hidden" animate="visible" className="space-y-6">

          {/* Booking Summary Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Booking Summary</p>
            <div className="flex items-start gap-4">
              <img src={doctor.photo} alt={doctor.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900">{doctor.name}</h3>
                <p className="text-xs text-slate-500">{doctor.specialty}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {symptom && (
                <div className="col-span-2">
                  <span className="text-slate-400 font-semibold">Condition</span>
                  <p className="font-extrabold text-slate-900">{symptom.title}</p>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-extrabold text-slate-900">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-extrabold text-slate-900">{selectedTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {mode === 'home' ? <Home className="w-3.5 h-3.5 text-slate-400" /> : <Video className="w-3.5 h-3.5 text-slate-400" />}
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100">{MODE_LABELS[mode]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-base font-extrabold text-blue-600">{'\u20B9'}{fee}</span>
              </div>
            </div>
          </div>

          {/* Patient Details Form */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Patient Details</p>

            {/* Book For Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setForOther(false);
                  setRelation('');
                  prefillSelf();
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg font-extrabold text-xs transition-all ${
                  !forOther ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                For myself
              </button>
              <button
                type="button"
                onClick={() => {
                  setForOther(true);
                  setPatientName('');
                  setPatientEmail('');
                  setPatientPhone('');
                  setPatientGender('male');
                  setPatientAge('');
                  setPatientWeight('');
                  setPatientHeight('');
                  setAddress('');
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg font-extrabold text-xs transition-all ${
                  forOther ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                For someone else
              </button>
            </div>

            {forOther && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Who is this appointment for? *</label>
                <select
                  value={relation}
                  onChange={e => setRelation(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  <option value="">Select relation</option>
                  {RELATIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Patient fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email *</label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={e => setPatientEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={e => setPatientPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Gender *</label>
                <select
                  value={patientGender}
                  onChange={e => setPatientGender(e.target.value as 'male' | 'female' | 'other')}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Age *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={patientAge}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 100)) {
                      setPatientAge(value);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
                  }}
                  inputMode="numeric"
                  placeholder="Enter age (1-100)"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Weight (kg) *</label>
                <input
                  type="number"
                  value={patientWeight}
                  onChange={e => setPatientWeight(e.target.value)}
                  placeholder="Enter weight in kg"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Height (cm) *</label>
                <input
                  type="number"
                  value={patientHeight}
                  onChange={e => setPatientHeight(e.target.value)}
                  placeholder="Enter height in cm"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>

            {mode === 'home' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Home Visit Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter home address for the therapist visit"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Describe Your Problem */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-700">Describe your problem</p>
              <p className="text-[11px] text-slate-400">Optional - helps the doctor prepare</p>
            </div>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={e => setProblemDescription(e.target.value)}
              placeholder="Tell the doctor about your symptoms, pain level, or anything relevant..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm resize-none"
            />
          </div>

          {/* Payment Section */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Payment</p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay securely with <strong>UPI, Cards or Net Banking</strong> via Razorpay.
                You will be taken to the payment window after confirming.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Total Payable</span>
              <span className="text-base font-extrabold text-blue-600">{'\u20B9'}{fee}</span>
            </div>
          </div>

          {/* Error */}
          {paymentError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {paymentError}
            </div>
          )}

          {/* Terms & Confirm */}
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I agree to the <strong className="text-slate-900">consultation terms</strong> and{' '}
                <strong className="text-slate-900">cancellation policy</strong>
              </span>
            </label>

            <button
              type="button"
              onClick={handlePay}
              disabled={!canSubmit || processing}
              className="w-full btn-gradient text-white py-3.5 rounded-xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <span>Confirm & Pay {'\u20B9'}{fee}</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
