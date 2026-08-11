import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { useDoctors, useCategories, useSymptoms } from '../../hooks/queries';
import {
  X, Send, User, Bot, Shield,
  Heart, Mic, MicOff, Minimize2, Maximize2,
} from 'lucide-react';

// Types
interface Message {
  id: string;
  type: 'user' | 'bot' | 'quick-reply' | 'option' | 'system';
  content: string;
  timestamp: Date;
  options?: QuickReplyOption[];
  specialty?: string;
  doctor?: any;
  isTyping?: boolean;
}

interface QuickReplyOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: string;
  color?: string;
}

interface ChatState {
  step: 'greeting' | 'symptom' | 'severity' | 'duration' | 'previous-treatment' | 'specialty' | 'doctor' | 'booking' | 'confirmation';
  selectedSymptom: string | null;
  selectedSeverity: string | null;
  selectedDuration: string | null;
  previousTreatment: string | null;
  selectedSpecialty: string | null;
  selectedDoctor: any | null;
  appointmentType: 'home' | 'video' | null;
  bookingDetails: any;
  symptomDetails: any;
}

// Derived from API data (fetched via useSymptoms/useCategories/useDoctors below)
const symptomIcon = (iconName: string): string =>
  iconName === 'Activity' ? '🔴' :
  iconName === 'Zap' ? '🔵' :
  iconName === 'ShieldPulse' ? '🟢' :
  iconName === 'Flame' ? '🟡' :
  iconName === 'Trophy' ? '🟣' :
  iconName === 'BrainCircuit' ? '🟠' :
  iconName === 'Radio' ? '🟤' :
  iconName === 'HeartPulse' ? '❤️' :
  iconName === 'Bone' ? '🦴' :
  iconName === 'Sparkles' ? '✨' :
  iconName === 'Hand' ? '🤲' :
  iconName === 'UserCheck' ? '👴' : '🔵';

const specialtyIcon = (slug: string): string =>
  slug === 'orthopedic' ? '🦴' :
  slug === 'neurological' ? '🧠' :
  slug === 'cardio-pulmonary' ? '❤️' :
  slug === 'sports-injury' ? '⚡' :
  slug === 'womens-health' ? '👩' :
  slug === 'pediatrics' ? '👶' :
  slug === 'geriatric' ? '👴' :
  slug === 'hand-rehab' ? '🤲' : '💪';

const DURATION_OPTIONS = [
  { id: 'less-than-week', label: 'Less than a week' },
  { id: '1-2-weeks', label: '1-2 weeks' },
  { id: '2-4-weeks', label: '2-4 weeks' },
  { id: '1-3-months', label: '1-3 months' },
  { id: '3-6-months', label: '3-6 months' },
  { id: '6-plus-months', label: '6+ months' },
];

const SEVERITY_OPTIONS = [
  { id: 'little-pain', label: '😊 Little Pain' , description: 'Noticeable but manageable' },
  { id: 'more-pain', label: '😐 More Pain', description: 'Affects daily activities' },
  { id: 'strong-pain', label: '😰 Strong Pain', description: 'Significantly impacts life' },
];

const PREVIOUS_TREATMENT_OPTIONS = [
  { id: 'none', label: 'No, first time' },
  { id: 'general-physio', label: 'Yes, general physiotherapy' },
  { id: 'specialist', label: 'Yes, specialist physiotherapy' },
  { id: 'other-treatment', label: 'Yes, other treatment' },
];

// Derived from API categories (fetched via useCategories below)

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, onMinimize }) => {
  const navigate = useNavigate();
  const { openBookingModal } = useBooking();
  const { data: doctors = [] } = useDoctors();
  const { data: categories = [] } = useCategories();
  const { data: symptoms = [] } = useSymptoms();

  const SYMPTOMS = symptoms.map((s) => ({
    id: s.id,
    label: s.title,
    icon: symptomIcon(s.iconName),
    conditions: s.popularFor.split(', '),
    severity: ['Little pain', 'More pain', 'Strong pain'],
    description: s.description,
    recoveryEstimate: s.recoveryEstimate,
    image: s.image,
  }));

  const SPECIALTIES = categories.map((cat) => ({
    id: cat.slug,
    label: cat.title,
    count: cat.doctorCount,
    icon: specialtyIcon(cat.slug),
    conditions: cat.conditions,
    description: cat.description,
  }));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({
    step: 'greeting',
    selectedSymptom: null,
    selectedSeverity: null,
    selectedDuration: null,
    previousTreatment: null,
    selectedSpecialty: null,
    selectedDoctor: null,
    appointmentType: null,
    bookingDetails: null,
    symptomDetails: null
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showGreetingAnimation, setShowGreetingAnimation] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check if mobile and get window height
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setWindowHeight(window.innerHeight);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setShowGreetingAnimation(true);
      setTimeout(() => setShowGreetingAnimation(false), 3000);
    }
  }, [isOpen]);

  // Initial greeting with animation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: 'greeting',
        type: 'bot',
        content: "👋 Hello! I'm your PhysioPrime assistant. I'll help you find the right physiotherapist for your needs.\n\nWhat type of care are you looking for?",
        timestamp: new Date(),
        options: [
          { id: 'home-visit', label: '🏠 Home Visit', action: 'home', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { id: 'video-consult', label: '📹 Video Consult', action: 'video', color: 'bg-teal-50 text-teal-700 border-teal-200' },
          { id: 'symptom-check', label: '🤔 Symptom Check', action: 'symptom', color: 'bg-purple-50 text-purple-700 border-purple-200' }
        ]
      };
      setMessages([greeting]);
    }
  }, [isOpen]);

  // Handle minimize
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (onMinimize) {
      onMinimize();
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const addBotMessage = (content: string, options?: QuickReplyOption[], specialty?: string, doctor?: any) => {
    const message: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      options,
      specialty,
      doctor
    };
    addMessage(message);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    addMessage(message);
  };

  const simulateTyping = async (duration: number = 800) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, duration));
    setIsTyping(false);
  };

  const getDoctorsBySymptom = (symptomId: string) => {
    const symptom = SYMPTOMS.find(s => s.id === symptomId);
    if (!symptom) return [];
    
    let matchingCategory = '';
    if (['back-pain', 'neck-pain', 'knee-pain', 'frozen-shoulder', 'knee-replacement'].includes(symptomId)) {
      matchingCategory = 'orthopedic';
    } else if (['stroke-rehab', 'sciatica', 'post-fracture-rehab'].includes(symptomId)) {
      matchingCategory = 'neurological';
    } else if (symptomId === 'sports-injury') {
      matchingCategory = 'sports-injury';
    } else if (symptomId === 'arthritis' || symptomId === 'geriatric-care') {
      matchingCategory = 'geriatric';
    } else if (symptomId === 'hand-wrist-rehab') {
      matchingCategory = 'hand-rehab';
    }

    return doctors.filter(doc => {
      if (!matchingCategory) return true;
      const category = categories.find(c => c.slug === matchingCategory);
      if (!category) return true;
      
      return doc.specialty.toLowerCase().includes(category.title.toLowerCase()) ||
             doc.expertise.some(e => category.conditions.some(c => 
               e.toLowerCase().includes(c.toLowerCase())
             ));
    });
  };

  const handleQuickReply = async (action: string, label: string) => {
    addUserMessage(label);

    // Handle appointment type selection
    if (action === 'home' || action === 'video') {
      setChatState(prev => ({ ...prev, appointmentType: action as 'home' | 'video' }));
      await simulateTyping(800);
      
      const typeLabel = action === 'home' ? 'Home Visit' : 'Video Consultation';
      addBotMessage(
        `Great! I'll help you find the best physiotherapist for a ${typeLabel}.\n\nPlease select your primary concern or symptom:`,
        SYMPTOMS.map(s => ({
          id: s.id,
          label: `${s.icon} ${s.label}`,
          action: s.id
        }))
      );
      setChatState(prev => ({ ...prev, step: 'symptom' }));
      return;
    }

    // Handle symptom check
    if (action === 'symptom') {
      await simulateTyping(800);
      addBotMessage(
        "Let me help you identify your condition. Please select the area that's bothering you:",
        SYMPTOMS.map(s => ({
          id: s.id,
          label: `${s.icon} ${s.label}`,
          action: s.id
        }))
      );
      setChatState(prev => ({ ...prev, step: 'symptom' }));
      return;
    }

    // Handle symptom selection
    const selectedSymptom = SYMPTOMS.find(s => s.id === action);
    if (selectedSymptom) {
      setChatState(prev => ({ 
        ...prev, 
        selectedSymptom: action,
        symptomDetails: { ...selectedSymptom }
      }));
      
      await simulateTyping(1200);
      
      addBotMessage(
        `I understand you're experiencing ${selectedSymptom.label}.\n\n${selectedSymptom.description || ''}\n\nTo better understand your condition, could you tell me how severe your symptoms are?`,
        SEVERITY_OPTIONS.map(s => ({
          id: s.id,
          label: s.label,
          action: `severity-${s.id}`,
          color: s.id === 'little-pain' ? 'bg-green-50 text-green-700 border-green-200' : 
                 s.id === 'more-pain' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                 'bg-red-50 text-red-700 border-red-200'
        }))
      );
      setChatState(prev => ({ ...prev, step: 'severity' }));
      return;
    }

    // Handle severity selection
    if (action.startsWith('severity-')) {
      const severity = action.replace('severity-', '');
      setChatState(prev => ({ ...prev, selectedSeverity: severity }));
      
      await simulateTyping(800);
      
      addBotMessage(
        `Thank you for sharing. How long have you been experiencing these symptoms?`,
        DURATION_OPTIONS.map(d => ({
          id: d.id,
          label: d.label,
          action: `duration-${d.id}`
        }))
      );
      setChatState(prev => ({ ...prev, step: 'duration' }));
      return;
    }

    // Handle duration selection
    if (action.startsWith('duration-')) {
      const duration = action.replace('duration-', '');
      setChatState(prev => ({ ...prev, selectedDuration: duration }));
      
      await simulateTyping(800);
      
      addBotMessage(
        `Have you consulted with a physiotherapist or any other healthcare professional about this condition before?`,
        PREVIOUS_TREATMENT_OPTIONS.map(p => ({
          id: p.id,
          label: p.label,
          action: `treatment-${p.id}`
        }))
      );
      setChatState(prev => ({ ...prev, step: 'previous-treatment' }));
      return;
    }

    // Handle previous treatment selection
    if (action.startsWith('treatment-')) {
      const treatment = action.replace('treatment-', '');
      setChatState(prev => ({ ...prev, previousTreatment: treatment }));
      
      await simulateTyping(1200);

      const symptom = SYMPTOMS.find(s => s.id === chatState.selectedSymptom);
      let matchingSpecialtyId = '';
      
      const symptomId = chatState.selectedSymptom;
      if (['back-pain', 'neck-pain', 'knee-pain', 'frozen-shoulder', 'knee-replacement'].includes(symptomId || '')) {
        matchingSpecialtyId = 'orthopedic';
      } else if (['stroke-rehab', 'sciatica', 'post-fracture-rehab'].includes(symptomId || '')) {
        matchingSpecialtyId = 'neurological';
      } else if (symptomId === 'sports-injury') {
        matchingSpecialtyId = 'sports-injury';
      } else if (symptomId === 'arthritis' || symptomId === 'geriatric-care') {
        matchingSpecialtyId = 'geriatric';
      } else if (symptomId === 'hand-wrist-rehab') {
        matchingSpecialtyId = 'hand-rehab';
      }

      const specialty = SPECIALTIES.find(s => s.id === matchingSpecialtyId);
      const severityEmoji = chatState.selectedSeverity === 'strong-pain' ? '🔴' : 
                           chatState.selectedSeverity === 'more-pain' ? '🟡' : '🟢';
      
      let previousTreatmentMsg = '';
      if (treatment === 'none') {
        previousTreatmentMsg = 'This is your first time seeking treatment.';
      } else if (treatment === 'general-physio') {
        previousTreatmentMsg = 'You\'ve had general physiotherapy before.';
      } else if (treatment === 'specialist') {
        previousTreatmentMsg = 'You\'ve seen a specialist physiotherapist before.';
      } else {
        previousTreatmentMsg = 'You\'ve tried other treatments before.';
      }

      const recoveryMsg = symptom?.recoveryEstimate ? `\n📈 Recovery Estimate: ${symptom.recoveryEstimate}` : '';

      addBotMessage(
        `Based on your responses:\n\n` +
        `📋 Symptom: ${symptom?.label}\n` +
        `${severityEmoji} Severity: ${chatState.selectedSeverity}\n` +
        `⏰ Duration: ${DURATION_OPTIONS.find(d => d.id === chatState.selectedDuration)?.label}\n` +
        `🩺 Previous Treatment: ${previousTreatmentMsg}` +
        recoveryMsg + `\n\n` +
        `I recommend consulting a ${specialty?.label || 'Physiotherapy'} specialist who can provide targeted treatment for your condition.\n\n` +
        `Would you like to see available doctors?`,
        [
          { id: 'show-doctors', label: '👨‍⚕️ Show Doctors', action: 'show-doctors', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { id: 'back-to-symptoms', label: '🔄 Different Symptom', action: 'symptom', color: 'bg-slate-50 text-slate-700 border-slate-200' },
          { id: 'view-slots', label: '📅 Check Slots', action: 'view-slots', color: 'bg-amber-50 text-amber-700 border-amber-200' }
        ],
        matchingSpecialtyId
      );
      setChatState(prev => ({ ...prev, step: 'specialty', selectedSpecialty: matchingSpecialtyId }));
      return;
    }

    // Handle view slots
    if (action === 'view-slots') {
      navigate('/booking-slots');
      onClose();
      return;
    }

    // Handle show doctors
    if (action === 'show-doctors') {
      await simulateTyping(1200);

      const specialty = SPECIALTIES.find(s => s.id === chatState.selectedSpecialty);
      const filteredDoctors = doctors.filter(d => 
        d.specialty.toLowerCase().includes(specialty?.label?.toLowerCase() || '') ||
        d.expertise.some(e => specialty?.conditions?.some(c => 
          e.toLowerCase().includes(c.toLowerCase())
        ))
      );

      if (filteredDoctors.length === 0) {
        addBotMessage(
          `I couldn't find any doctors matching your criteria. Please try selecting a different symptom or check our available slots.`,
          [
            { id: 'back-to-symptoms', label: '🔄 Different Symptom', action: 'symptom', color: 'bg-slate-50 text-slate-700 border-slate-200' },
            { id: 'view-slots', label: '📅 Check Slots', action: 'view-slots', color: 'bg-amber-50 text-amber-700 border-amber-200' }
          ]
        );
        return;
      }

      let doctorList = '';
      filteredDoctors.slice(0, 3).forEach((d, i) => {
        doctorList += `${i + 1}. ${d.name} - ${d.rating}⭐ (${d.reviewCount} reviews)\n   ${d.specialty}\n   ${d.experienceYears} years experience\n   ₹${d.fees[chatState.appointmentType === 'home' ? 'home' : 'online']}/session\n\n`;
      });

      addBotMessage(
        `Here are top specialists for your condition:\n\n${doctorList}\n\nWhich doctor would you like to book with?`,
        filteredDoctors.slice(0, 3).map(d => ({
          id: d.id,
          label: `${d.name} (${d.rating}⭐)`,
          action: `doctor-${d.id}`
        }))
      );
      setChatState(prev => ({ ...prev, step: 'doctor' }));
      return;
    }

    // Handle doctor selection
    if (action.startsWith('doctor-')) {
      const doctorId = action.replace('doctor-', '');
      const doctor = doctors.find(d => d.id === doctorId);
      if (doctor) {
        setChatState(prev => ({ ...prev, selectedDoctor: doctor }));
        await simulateTyping(1000);

        const typeLabel = chatState.appointmentType === 'home' ? 'Home Visit' : 'Video Consultation';
        const fee = doctor.fees[chatState.appointmentType === 'home' ? 'home' : 'online'];
        
        addBotMessage(
          `Great choice! Here are the details for ${doctor.name}:\n\n` +
          `👨‍⚕️ Specialty: ${doctor.specialty}\n` +
          `⭐ Rating: ${doctor.rating} (${doctor.reviewCount} reviews)\n` +
          `📍 Location: ${doctor.location.area}, ${doctor.location.city}\n` +
          `⏰ Experience: ${doctor.experienceYears} years\n` +
          `💰 Fee: ₹${fee}/session (${typeLabel})\n` +
          `🕐 Next Available: ${doctor.nextAvailable}\n` +
          `🌐 Languages: ${doctor.languages.join(', ')}\n\n` +
          `Would you like to book a ${typeLabel} with ${doctor.name}?`,
          [
            { id: 'book-now', label: '📅 Book Now', action: 'book-now', color: 'bg-teal-50 text-teal-700 border-teal-200' },
            { id: 'view-profile', label: '👤 View Full Profile', action: `profile-${doctor.id}`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { id: 'back-to-doctors', label: '🔙 Back to Doctors', action: 'show-doctors', color: 'bg-slate-50 text-slate-700 border-slate-200' }
          ]
        );
        setChatState(prev => ({ ...prev, step: 'booking' }));
      }
    }

    // Handle view profile
    if (action.startsWith('profile-')) {
      const doctorId = action.replace('profile-', '');
      navigate(`/doctor/${doctorId}`);
      onClose();
      return;
    }

    // Handle booking
    if (action === 'book-now') {
      await simulateTyping(1200);

      const doctor = chatState.selectedDoctor;
      const mode = chatState.appointmentType === 'video' ? 'online' : 'home';
      
      openBookingModal({
        doctor: doctor,
        mode: mode,
        symptom: chatState.symptomDetails?.label || 'General Consultation',
        initialStep: 3
      });
      
      onClose();
      return;
    }

    // Handle confirmation
    if (action === 'confirm-booking') {
      await simulateTyping(1000);

      addBotMessage(
        `🎉 Booking Confirmed!\n\n` +
        `Your appointment with ${chatState.selectedDoctor?.name} is confirmed!\n\n` +
        `📅 Date: ${chatState.selectedDoctor?.nextAvailable}\n` +
        `📋 Service: ${chatState.appointmentType === 'home' ? '🏠 Home Visit' : '📹 Video Consultation'}\n` +
        `💰 Fee: ₹${chatState.selectedDoctor?.fees[chatState.appointmentType === 'home' ? 'home' : 'online']}\n\n` +
        `You'll receive a confirmation SMS and email shortly.\n\n` +
        `Need anything else? I'm here to help!`,
        [
          { id: 'new-booking', label: '📅 New Booking', action: 'new-booking', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { id: 'end-chat', label: '👋 End Chat', action: 'end-chat', color: 'bg-slate-50 text-slate-700 border-slate-200' }
        ]
      );
      setChatState(prev => ({ ...prev, step: 'confirmation' }));
    }

    // Handle new booking
    if (action === 'new-booking') {
      setChatState({
        step: 'greeting',
        selectedSymptom: null,
        selectedSeverity: null,
        selectedDuration: null,
        previousTreatment: null,
        selectedSpecialty: null,
        selectedDoctor: null,
        appointmentType: null,
        bookingDetails: null,
        symptomDetails: null
      });
      await simulateTyping(600);
      addBotMessage(
        "👋 Let's start a new booking! What type of care are you looking for?",
        [
          { id: 'home-visit', label: '🏠 Home Visit', action: 'home', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { id: 'video-consult', label: '📹 Video Consult', action: 'video', color: 'bg-teal-50 text-teal-700 border-teal-200' },
          { id: 'symptom-check', label: '🤔 Symptom Check', action: 'symptom', color: 'bg-purple-50 text-purple-700 border-purple-200' }
        ]
      );
    }

    // Handle end chat
    if (action === 'end-chat') {
      await simulateTyping(500);
      addBotMessage(
        "💚 Thank you for using PhysioPrime! We hope you feel better soon.\n\n" +
        "If you need any further assistance, I'm always here to help. Take care! 💪"
      );
      setTimeout(() => onClose(), 3000);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    addUserMessage(userMessage);
    setInput('');

    await simulateTyping(1000);

    const lowerInput = userMessage.toLowerCase();
    const matchedSymptom = SYMPTOMS.find(s => 
      lowerInput.includes(s.label.toLowerCase()) ||
      s.conditions.some(c => lowerInput.includes(c.toLowerCase()))
    );
    
    if (matchedSymptom) {
      handleQuickReply(matchedSymptom.id, matchedSymptom.label);
    } else if (lowerInput.includes('home') || lowerInput.includes('visit')) {
      handleQuickReply('home', 'Home Visit');
    } else if (lowerInput.includes('video') || lowerInput.includes('consult')) {
      handleQuickReply('video', 'Video Consultation');
    } else if (lowerInput.includes('slot') || lowerInput.includes('availability')) {
      handleQuickReply('view-slots', 'Check Slots');
    } else {
      addBotMessage(
        "I understand you have concerns about your health. Let me help you find the right specialist.\n\nPlease select the area that's bothering you:",
        SYMPTOMS.map(s => ({
          id: s.id,
          label: `${s.icon} ${s.label}`,
          action: s.id
        }))
      );
    }
  };

  // Get the height for mobile
  const getMobileHeight = () => {
    if (isMobile) {
      return isMinimized ? 'h-16' : 'h-[100vh] max-h-[100vh]';
    }
    return isMinimized ? 'h-16' : 'h-[600px] max-h-[90vh]';
  };

  // Get the position for mobile
  const getMobilePosition = () => {
    if (isMobile) {
      return 'bottom-0 left-0 right-0 rounded-none';
    }
    return 'bottom-4 right-4 rounded-3xl';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={chatContainerRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25 }}
          className={`fixed z-50 bg-white shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col
            ${getMobileHeight()}
            ${getMobilePosition()}
            ${isMobile ? 'w-full' : 'w-full max-w-[400px] sm:max-w-[440px]'}
            ${!isMobile && 'bottom-4 right-4 rounded-3xl'}
            ${isMobile && 'rounded-t-2xl'}
          `}
          style={{
            maxHeight: isMobile ? '100vh' : '90vh',
            height: isMobile && !isMinimized ? '100vh' : 'auto'
          }}
        >
          {/* Header */}
          <div className="px-3 py-3 sm:px-4 sm:py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <motion.div 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base truncate">PhysioPrime Assistant</h3>
                <p className="text-[10px] sm:text-xs opacity-75 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full inline-block animate-pulse flex-shrink-0" />
                  <span className="truncate">Online • Ready to help</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Toggle voice mode"
              >
                {isVoiceMode ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={handleMinimize}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Toggle minimize"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/50">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    {message.type === 'bot' && (
                      <div className="flex items-start gap-2 max-w-[95%] sm:max-w-[90%]">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm border border-slate-100">
                            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
                              {message.content}
                            </div>
                          </div>
                          {message.options && message.options.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                              {message.options.map((option) => (
                                <motion.button
                                  key={option.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleQuickReply(option.action, option.label)}
                                  className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold transition-all border truncate max-w-full flex-shrink-0 ${
                                    option.color || 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                                  }`}
                                >
                                  <span className="truncate">{option.label}</span>
                                </motion.button>
                              ))}
                            </div>
                          )}
                          <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1 block">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}

                    {message.type === 'user' && (
                      <div className="flex items-start gap-2 justify-end">
                        <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
                          <motion.div 
                            className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl rounded-tr-none px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm"
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                          >
                            <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</div>
                          </motion.div>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1 block text-right">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-1">
                        <motion.div 
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-teal-500 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div 
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-teal-500 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div 
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-teal-500 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isVoiceMode ? "🎤 Listening..." : "Type your message..."}
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs sm:text-sm bg-slate-50 min-w-0"
                    disabled={isTyping}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>
                <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center justify-between text-[8px] sm:text-[10px] text-slate-400 gap-1">
                  <span>Powered by PhysioPrime AI</span>
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-500" />
                      Secure
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">24/7 Support</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};