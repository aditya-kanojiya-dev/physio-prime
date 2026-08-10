import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBooking } from '../../context/BookingContext';
import { DOCTORS_DATA } from '../../data/doctors';
import { CATEGORIES_DATA } from '../../data/categories';
import { Doctor, ConsultationMode, Appointment } from '../../types';
import { X, CheckCircle2, Home, Video, ArrowRight, Sparkles, Wallet, CreditCard, Banknote, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Common problems data
const COMMON_PROBLEMS = [
  { id: 'back-pain', label: 'Back Pain', category: 'Orthopedic Physiotherapy' },
  { id: 'neck-pain', label: 'Neck Pain', category: 'Orthopedic Physiotherapy' },
  { id: 'shoulder-pain', label: 'Shoulder Pain', category: 'Orthopedic Physiotherapy' },
  { id: 'knee-pain', label: 'Knee Pain', category: 'Orthopedic Physiotherapy' },
  { id: 'arthritis', label: 'Arthritis', category: 'Orthopedic Physiotherapy' },
  { id: 'joint-stiffness', label: 'Joint Stiffness', category: 'Orthopedic Physiotherapy' },
  { id: 'sports-injury', label: 'Sports Injury', category: 'Sports Injury & Performance' },
  { id: 'stroke', label: 'Stroke', category: 'Neurological Rehabilitation' },
  { id: 'parkinson', label: 'Parkinson\'s', category: 'Neurological Rehabilitation' },
  { id: 'neuropathy', label: 'Neuropathy', category: 'Neurological Rehabilitation' },
  { id: 'pregnancy-pain', label: 'Pregnancy Pain', category: 'Women\'s Health Physiotherapy' },
  { id: 'copd', label: 'COPD', category: 'Cardio-Pulmonary Therapy' },
];

// Category-specific problems mapping
const CATEGORY_PROBLEMS: Record<string, string[]> = {
  'orthopedic-physiotherapy': [
    'Back Pain', 'Neck Pain', 'Shoulder Pain', 'Knee Pain', 
    'Arthritis', 'Joint Stiffness', 'Sports-Related Musculoskeletal Injuries', 
    'Post-Surgical Rehabilitation'
  ],
  'neurological-rehabilitation': [
    'Stroke', 'Parkinson\'s', 'Neuropathy', 'Spinal Cord Injury', 
    'Multiple Sclerosis', 'Balance & Coordination Problems'
  ],
  'cardio-pulmonary-therapy': [
    'COPD', 'Asthma', 'Cardiac Rehabilitation', 'Breathing Difficulties', 
    'Post-COVID Rehabilitation', 'Exercise Tolerance'
  ],
  'sports-injury-performance': [
    'ACL Injury', 'Muscle Strain', 'Ligament Injury', 'Sports Injury', 
    'Return-to-Sport', 'Performance Enhancement'
  ],
  'womens-health-physiotherapy': [
    'Pregnancy Pain', 'Pelvic Floor Dysfunction', 'Prenatal Care', 
    'Postnatal Recovery', 'Postpartum Rehabilitation', 'Incontinence'
  ],
  'pediatric-physiotherapy': [
    'Cerebral Palsy', 'Developmental Delay', 'Motor Development', 
    'Pediatric Posture', 'Childhood Musculoskeletal Conditions'
  ],
  'geriatric-rehabilitation': [
    'Arthritis', 'Balance Problems', 'Fall Prevention', 'Age-Related Weakness', 
    'Mobility Issues', 'Osteoporosis Rehabilitation'
  ],
  'hand-micro-rehabilitation': [
    'Hand Injury', 'Wrist Pain', 'Finger Injury', 'Carpal Tunnel Syndrome', 
    'Hand Surgery Recovery', 'Fine Motor Rehabilitation'
  ],
  'psychosomatic-ergonomic-care': [
    'Work-Related Pain', 'Poor Posture', 'Computer Neck Pain', 
    'Repetitive Strain', 'Stress-Related Muscle Tension', 'Workplace Ergonomics'
  ]
};

export const BookingModal: React.FC = () => {
  const { isBookingOpen, closeBookingModal, bookingOptions, addAppointment, setCurrentPage } = useBooking();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [category, setCategory] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(
    bookingOptions.doctor || DOCTORS_DATA[0]
  );
  const [mode, setMode] = useState<ConsultationMode>(
    bookingOptions.mode || 'home'
  );
  const [symptom, setSymptom] = useState<string>(
    bookingOptions.symptom || 'Knee & Joint Rehab'
  );
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Patient details
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('male');
  const [patientWeight, setPatientWeight] = useState('');
  const [patientHeight, setPatientHeight] = useState('');
  const [address, setAddress] = useState('');

  // Dummy payment
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [processing, setProcessing] = useState(false);

  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const payTimerRef = useRef<number | null>(null);

  // Generate week dates
  const weekDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        full: date.toISOString().split('T')[0],
        isToday: i === 0
      });
    }
    return dates;
  }, []);

  // Time slots from 7AM to 9PM
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour <= 21; hour += 2) {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      slots.push(`${displayHour}:00 ${ampm}`);
    }
    return slots;
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    setStep(1);
    setCategory(null);
    setSelectedDoctor(bookingOptions.doctor || DOCTORS_DATA[0]);
    setMode(bookingOptions.mode || 'home');
    setSymptom(bookingOptions.symptom || '');
    setSelectedProblem(null);
    setCreatedAppointment(null);
    setProcessing(false);
    setSelectedDate(weekDates[0]?.full || '');
    setSelectedTime(timeSlots[0] || '');
  }, [bookingOptions, weekDates, timeSlots]);

  const categoryTitle = category ? CATEGORIES_DATA.find(c => c.slug === category)?.title : null;

  // Filter doctors based on selected problem/category
  const filteredDoctors = useMemo(() => {
    if (!category && !selectedProblem) return DOCTORS_DATA;
    
    let searchTerms: string[] = [];
    
    if (selectedProblem) {
      searchTerms = [selectedProblem.toLowerCase()];
    } else if (category) {
      const cat = CATEGORIES_DATA.find(c => c.slug === category);
      if (cat) {
        searchTerms = [cat.title.toLowerCase(), ...cat.conditions.map(c => c.toLowerCase())];
      }
    }

    if (searchTerms.length === 0) return DOCTORS_DATA;

    return DOCTORS_DATA.filter(doc => {
      const hay = [doc.specialty, ...doc.expertise, ...doc.treatments, doc.bio].join(' ').toLowerCase();
      return searchTerms.some(term => hay.includes(term));
    });
  }, [category, selectedProblem]);

  if (!isBookingOpen) return null;

  const fee = selectedDoctor.fees[mode];

  const handlePay = () => {
    setProcessing(true);
    payTimerRef.current = window.setTimeout(() => {
      if (cancelledRef.current) return;
      const newApt = addAppointment({
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialty,
        doctorPhoto: selectedDoctor.photo,
        doctorLocation: `${selectedDoctor.location.area}, ${selectedDoctor.location.city}`,
        consultationMode: mode,
        date: selectedDate,
        timeSlot: selectedTime,
        status: 'upcoming',
        patientName,
        patientPhone,
        symptom: selectedProblem || symptom || 'General Consultation',
        fee,
        address: mode === 'home' ? address : undefined,
        videoCallLink: mode === 'online' ? `https://physioprime.health/meet/${selectedDoctor.id}-live` : undefined,
        paymentMethod: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'Card' : 'Cash on Visit',
        doctorPhone: selectedDoctor.phone
      });
      setCreatedAppointment(newApt);
      setProcessing(false);
      setStep(5);
    }, 1200);
  };

  const handleNextStep = () => {
    if (step === 4) {
      handlePay();
      return;
    }
    setStep((step + 1) as any);
  };

  const handleClose = () => {
    cancelledRef.current = true;
    if (payTimerRef.current) window.clearTimeout(payTimerRef.current);
    closeBookingModal();
    setStep(1);
    setCreatedAppointment(null);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedProblem;
      case 2:
        return !!selectedDoctor;
      case 3:
        return !!selectedDate && !!selectedTime;
      case 4:
        return patientName && patientPhone && patientEmail && patientGender && patientWeight && patientHeight;
      default:
        return true;
    }
  };

  const doctorRow = (doc: Doctor) => (
    <div
      key={doc.id}
      onClick={() => setSelectedDoctor(doc)}
      className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
        selectedDoctor.id === doc.id
          ? 'bg-blue-50 border-blue-600 shadow-sm'
          : 'bg-slate-50 border-slate-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <img src={doc.photo} alt={doc.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 truncate">{doc.name}</p>
          <p className="text-xs text-slate-500 truncate">{doc.specialty} • {doc.experienceYears} Yrs Exp</p>
        </div>
      </div>
      <span className="text-xs font-black text-blue-600 flex-shrink-0">₹{doc.fees[mode]}</span>
    </div>
  );

  const paymentCard = (
    method: 'upi' | 'card' | 'cash',
    icon: React.ReactNode,
    label: string,
    sub: string
  ) => (
    <button
      type="button"
      onClick={() => setPaymentMethod(method)}
      className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
        paymentMethod === method
          ? 'bg-blue-50 border-blue-600 shadow-sm'
          : 'bg-slate-50 border-slate-200 hover:border-blue-300'
      }`}
    >
      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-extrabold text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-500">{sub}</p>
      </div>
    </button>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8"
        >

          {/* Header Bar */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {step < 5 ? `Step ${step} of 4 • Quick Booking` : 'Booking Confirmed 🎉'}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                {step === 1 && 'Select Service & Problem'}
                {step === 2 && 'Choose Your Therapist'}
                {step === 3 && 'Pick Date & Time Slot'}
                {step === 4 && 'Patient Details & Payment'}
                {step === 5 && 'Appointment Pass Generated'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">

            {/* STEP 1: Mode & Problem Selection */}
            {step === 1 && (
              <div className="space-y-6">

                {/* Consultation Mode Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Consultation Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('home')}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        mode === 'home'
                          ? 'bg-blue-50 border-blue-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">Home Visit</p>
                        <p className="text-xs text-slate-500">Therapist comes to your home</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('online')}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        mode === 'online'
                          ? 'bg-blue-50 border-blue-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">Online Video</p>
                        <p className="text-xs text-slate-500">HD 1-on-1 virtual session</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Common Problems Quick Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Common Physio Problems</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_PROBLEMS.map(problem => (
                      <button
                        key={problem.id}
                        type="button"
                        onClick={() => {
                          setSelectedProblem(problem.label);
                          // Find the category for this problem
                          const cat = CATEGORIES_DATA.find(c => c.title === problem.category);
                          if (cat) {
                            setCategory(cat.slug);
                          }
                          setSymptom(problem.label);
                        }}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${
                          selectedProblem === problem.label
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {problem.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category / Service Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Physiotherapy Services</label>
                  <div className="space-y-3">
                    {CATEGORIES_DATA.map(cat => {
                      const isSel = category === cat.slug;
                      const problems = CATEGORY_PROBLEMS[cat.slug] || [];
                      return (
                        <div key={cat.slug} className="border border-slate-200 rounded-2xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setCategory(isSel ? null : cat.slug);
                              if (!isSel) {
                                setSelectedProblem(null);
                                setSymptom(cat.title);
                              } else {
                                setSymptom('');
                              }
                            }}
                            className={`w-full p-4 text-left transition-all ${
                              isSel
                                ? 'bg-blue-50 border-b border-blue-200'
                                : 'bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <p className="text-sm font-extrabold text-slate-900">{cat.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{cat.description}</p>
                            <p className="text-[10px] font-bold text-teal-600 mt-1">{cat.doctorCount} Certified Doctors</p>
                          </button>
                          
                          {isSel && problems.length > 0 && (
                            <div className="p-3 bg-white flex flex-wrap gap-1.5">
                              {problems.map(problem => (
                                <button
                                  key={problem}
                                  type="button"
                                  onClick={() => {
                                    setSelectedProblem(problem);
                                    setSymptom(problem);
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                    selectedProblem === problem
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                                  }`}
                                >
                                  {problem}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* STEP 2: Doctor Selection - Filtered */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    {selectedProblem ? `Therapists for ${selectedProblem}` : categoryTitle || 'Recommended Therapists'}
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    {filteredDoctors.length} therapist{filteredDoctors.length !== 1 ? 's' : ''} available
                  </p>
                  <div className="space-y-2.5">
                    {filteredDoctors.length > 0 ? (
                      filteredDoctors.map(doctorRow)
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm font-semibold">No therapists found</p>
                        <p className="text-xs">Please try selecting a different problem</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Date & Time */}
            {step === 3 && (
              <div className="space-y-6">

                {/* Date Picker - 7 days */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Select Date (Next 7 Days)</label>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDates.map(d => (
                      <button
                        type="button"
                        key={d.full}
                        onClick={() => setSelectedDate(d.full)}
                        className={`p-2 rounded-2xl border text-center transition-all ${
                          selectedDate === d.full
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-blue-300'
                        }`}
                      >
                        <p className="text-[10px] uppercase font-semibold">{d.day}</p>
                        <p className="text-base font-bold">{d.date}</p>
                        <p className="text-[8px] uppercase opacity-70">{d.month}</p>
                        {d.isToday && (
                          <p className="text-[8px] font-bold uppercase text-teal-500">Today</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slots - 7AM to 9PM */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Select Time Slot (7AM - 9PM)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSelectedTime(s)}
                        className={`p-2.5 rounded-2xl text-xs font-bold border transition-all ${
                          selectedTime === s
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-teal-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* STEP 4: Patient Details & Payment */}
            {step === 4 && (
              <div className="space-y-4">

                {/* Patient Details Grid */}
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
                    <label className="text-xs font-bold text-slate-700">Home Visit Address (Nagpur)</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Enter home address"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                )}

                {/* Dummy Payment */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Select Payment Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {paymentCard('upi', <Wallet className="w-4 h-4" />, 'UPI', 'GPay / PhonePe')}
                    {paymentCard('card', <CreditCard className="w-4 h-4" />, 'Card', 'Credit / Debit')}
                    {paymentCard('cash', <Banknote className="w-4 h-4" />, 'Cash', 'Pay on visit')}
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          placeholder="NAME ON CARD"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Expiry</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">CVV</label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      Pay ₹{fee} in cash when the therapist arrives. No advance needed.
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Total Payable</span>
                  <span className="text-base font-extrabold text-blue-600">₹{fee}</span>
                </div>

              </div>
            )}

            {/* STEP 5: CONFIRMATION RECEIPT */}
            {step === 5 && createdAppointment && (
              <div className="text-center space-y-6">

                <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-extrabold text-slate-900">Appointment Scheduled!</h3>
                  <p className="text-xs text-slate-500">Booking ID: <strong className="text-slate-900">{createdAppointment.id}</strong></p>
                </div>

                {/* Printable Card Pass */}
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-left space-y-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <img src={createdAppointment.doctorPhoto} alt={createdAppointment.doctorName} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{createdAppointment.doctorName}</p>
                      <p className="text-xs text-teal-600 font-semibold">{createdAppointment.doctorSpecialty}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 font-semibold">Date & Time</span>
                      <p className="font-extrabold text-slate-900">{createdAppointment.date} at {createdAppointment.timeSlot}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Consultation Mode</span>
                      <p className="font-extrabold text-blue-600 capitalize">{createdAppointment.consultationMode} Visit</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Payment Method</span>
                      <p className="font-extrabold text-teal-600">{createdAppointment.paymentMethod || 'Cash'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Total Paid</span>
                      <p className="font-extrabold text-slate-900">₹{createdAppointment.fee}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            {step < 5 ? (
              <>
                <button
                  type="button"
                  onClick={() => step > 1 && setStep((step - 1) as any)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs ${step > 1 ? 'text-slate-600 hover:bg-slate-100' : 'opacity-0 pointer-events-none'}`}
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={processing || !canProceed()}
                  className="btn-gradient text-white px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
                >
                  {step === 4 ? (
                    processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay ₹{fee} & Confirm</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setCurrentPage('appointments');
                }}
                className="w-full btn-gradient text-white py-3 rounded-xl font-extrabold text-sm shadow-lg text-center hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Go to My Appointments Dashboard →
              </button>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};