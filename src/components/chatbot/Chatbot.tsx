import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, User, Bot, Clock, Calendar,
  MapPin, Phone, Video, Home, ArrowRight, CheckCircle,
  ChevronRight, ChevronLeft, Star, Shield, Award,
  Sparkles, Heart, Activity, Brain, Bone, Zap,
  Loader2, Mic, MicOff, Minimize2, Maximize2
} from 'lucide-react';

// Types
interface Message {
  id: string;
  type: 'user' | 'bot' | 'quick-reply' | 'option';
  content: string;
  timestamp: Date;
  options?: QuickReplyOption[];
  specialty?: string;
  doctor?: any;
}

interface QuickReplyOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: string;
}

interface ChatState {
  step: 'greeting' | 'symptom' | 'specialty' | 'doctor' | 'booking' | 'confirmation';
  selectedSymptom: string | null;
  selectedSpecialty: string | null;
  selectedDoctor: any | null;
  appointmentType: 'home' | 'video' | null;
  bookingDetails: any;
}

// Data
const SYMPTOMS = [
  { id: 'back-pain', label: 'Back Pain', icon: '🔴', conditions: ['Disc Herniation', 'Muscle Strain', 'Postural Pain'] },
  { id: 'neck-pain', label: 'Neck Pain', icon: '🔵', conditions: ['Cervical Spondylosis', 'Tech-Neck', 'Nerve Compression'] },
  { id: 'knee-pain', label: 'Knee Pain', icon: '🟢', conditions: ['ACL Strain', 'Meniscus Tear', 'Arthritis'] },
  { id: 'shoulder-pain', label: 'Frozen Shoulder', icon: '🟡', conditions: ['Adhesive Capsulitis', 'Joint Stiffness'] },
  { id: 'sports-injury', label: 'Sports Injury', icon: '🟣', conditions: ['Muscle Sprains', 'Rotator Cuff', 'Hamstring'] },
  { id: 'stroke-rehab', label: 'Stroke Rehab', icon: '🟠', conditions: ['Gait Retraining', 'Paralysis Recovery'] },
  { id: 'sciatica', label: 'Sciatica Pain', icon: '🟤', conditions: ['Disc Prolapse', 'Nerve Pain', 'Numbness'] },
  { id: 'arthritis', label: 'Arthritis Care', icon: '⚪', conditions: ['Osteoarthritis', 'Joint Pain', 'Stiffness'] },
];

const SPECIALTIES = [
  { id: 'orthopedic', label: 'Orthopedic Physiotherapy', count: 42, icon: '🦴' },
  { id: 'neurological', label: 'Neurological Rehabilitation', count: 28, icon: '🧠' },
  { id: 'cardio', label: 'Cardio-Pulmonary Therapy', count: 19, icon: '❤️' },
  { id: 'sports', label: 'Sports Injury & Performance', count: 35, icon: '⚡' },
  { id: 'womens-health', label: "Women's Health Physiotherapy", count: 22, icon: '👩' },
  { id: 'pediatric', label: 'Pediatric Physiotherapy', count: 16, icon: '👶' },
  { id: 'geriatric', label: 'Geriatric Rehabilitation', count: 31, icon: '👴' },
  { id: 'hand-rehab', label: 'Hand & Micro-Rehabilitation', count: 14, icon: '🤲' },
];

const DOCTORS = [
  {
    id: 'tarannum',
    name: 'Dr. Tarannum Sayyed',
    rating: 4.9,
    reviews: 142,
    specialty: 'Orthopedic & Post-Op Rehab Specialist',
    location: 'Raj Nagar, Nagpur',
    experience: 6,
    fee: 1000,
    availability: 'Today 03:00 PM',
    languages: ['Hindi', 'English', 'Marathi'],
    image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png',
    verified: true,
    services: ['home', 'video']
  },
  {
    id: 'pritam',
    name: 'Dr. Pritam Rathod',
    rating: 5.0,
    reviews: 98,
    specialty: 'Sports Injury & Stroke Rehabilitation',
    location: 'Dharampeth, Nagpur',
    experience: 7,
    fee: 899,
    availability: 'Today 04:30 PM',
    languages: ['Hindi', 'English', 'Marathi'],
    image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png',
    verified: true,
    services: ['home', 'video']
  },
  {
    id: 'jayshree',
    name: 'Dr. Jayshree Ingole',
    rating: 4.9,
    reviews: 84,
    specialty: 'Antenatal & Postnatal Physiotherapy',
    location: 'Medical Square, Nagpur',
    experience: 5,
    fee: 799,
    availability: 'Tomorrow 10:00 AM',
    languages: ['Hindi', 'English', 'Marathi'],
    image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png',
    verified: true,
    services: ['home', 'video']
  },
  {
    id: 'pratyush',
    name: 'Dr. Pratyush Kulkarni',
    rating: 4.8,
    reviews: 110,
    specialty: 'Joint & Vertebral Spine Care',
    location: 'Ramdaspeth, Nagpur',
    experience: 8,
    fee: 899,
    availability: 'Today 05:00 PM',
    languages: ['Hindi', 'English', 'Marathi'],
    image: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png',
    verified: true,
    services: ['home', 'video']
  }
];

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({
    step: 'greeting',
    selectedSymptom: null,
    selectedSpecialty: null,
    selectedDoctor: null,
    appointmentType: null,
    bookingDetails: null
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
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
    }
  }, [isOpen]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: 'greeting',
        type: 'bot',
        content: "👋 Hello! I'm your PhysioPrime assistant. I'll help you find the right physiotherapist for your needs.\n\nWhat type of care are you looking for?",
        timestamp: new Date(),
        options: [
          { id: 'home-visit', label: '🏠 Home Visit', action: 'home' },
          { id: 'video-consult', label: '📹 Video Consult', action: 'video' },
          { id: 'symptom-check', label: '🤔 Symptom Check', action: 'symptom' }
        ]
      };
      setMessages([greeting]);
    }
  }, [isOpen]);

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

  const handleQuickReply = async (action: string, label: string) => {
    addUserMessage(label);

    // Handle appointment type selection
    if (action === 'home' || action === 'video') {
      setChatState(prev => ({ ...prev, appointmentType: action as 'home' | 'video' }));
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsTyping(false);
      
      const typeLabel = action === 'home' ? 'Home Visit' : 'Video Consultation';
      addBotMessage(
        `Great! I'll help you find the best physiotherapist for a **${typeLabel}**.\n\nPlease select your primary concern or symptom:`,
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
    if (action === 'symptom') {
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsTyping(false);
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

    // Handle symptom selection (from symptom list)
    const selectedSymptom = SYMPTOMS.find(s => s.id === action);
    if (selectedSymptom) {
      setChatState(prev => ({ ...prev, selectedSymptom: action }));
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setIsTyping(false);

      // Find matching specialty
      let matchingSpecialty = '';
      if (['back-pain', 'neck-pain', 'knee-pain', 'shoulder-pain'].includes(action)) {
        matchingSpecialty = 'orthopedic';
      } else if (['stroke-rehab', 'sciatica'].includes(action)) {
        matchingSpecialty = 'neurological';
      } else if (action === 'sports-injury') {
        matchingSpecialty = 'sports';
      } else if (action === 'arthritis') {
        matchingSpecialty = 'geriatric';
      }

      const specialty = SPECIALTIES.find(s => s.id === matchingSpecialty);
      
      addBotMessage(
        `I understand you're experiencing **${selectedSymptom.label}**. This typically involves:\n\n${selectedSymptom.conditions.map(c => `• ${c}`).join('\n')}\n\nBased on your symptoms, I recommend consulting a **${specialty?.label || 'Physiotherapy'}** specialist.\n\nWould you like to see available doctors?`,
        [
          { id: 'show-doctors', label: '👨‍⚕️ Show Doctors', action: 'show-doctors' },
          { id: 'back-to-symptoms', label: '🔄 Different Symptom', action: 'symptom' }
        ],
        matchingSpecialty
      );
      setChatState(prev => ({ ...prev, step: 'specialty' }));
      return;
    }

    // Handle show doctors
    if (action === 'show-doctors') {
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setIsTyping(false);

      const specialty = SPECIALTIES.find(s => s.id === chatState.selectedSpecialty);
      const filteredDoctors = DOCTORS.filter(d => 
        d.specialty.toLowerCase().includes(specialty?.label?.toLowerCase() || '')
      );

      let doctorList = '';
      filteredDoctors.slice(0, 3).forEach((d, i) => {
        doctorList += `${i + 1}. **${d.name}** - ${d.rating}⭐ (${d.reviews} reviews)\n   ${d.specialty}\n   ${d.experience} years experience\n   ₹${d.fee}/session\n\n`;
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
      const doctor = DOCTORS.find(d => d.id === doctorId);
      if (doctor) {
        setChatState(prev => ({ ...prev, selectedDoctor: doctor }));
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsTyping(false);

        const typeLabel = chatState.appointmentType === 'home' ? 'Home Visit' : 'Video Consultation';
        addBotMessage(
          `Great choice! Here are the details for **${doctor.name}**:\n\n` +
          `👨‍⚕️ **Specialty**: ${doctor.specialty}\n` +
          `⭐ **Rating**: ${doctor.rating} (${doctor.reviews} reviews)\n` +
          `📍 **Location**: ${doctor.location}\n` +
          `⏰ **Experience**: ${doctor.experience} years\n` +
          `💰 **Fee**: ₹${doctor.fee}/session (${typeLabel})\n` +
          `🕐 **Next Available**: ${doctor.availability}\n` +
          `🌐 **Languages**: ${doctor.languages.join(', ')}\n\n` +
          `Would you like to book a ${typeLabel} with ${doctor.name}?`,
          [
            { id: 'book-now', label: '📅 Book Now', action: 'book-now' },
            { id: 'view-profile', label: '👤 View Full Profile', action: 'view-profile' },
            { id: 'back-to-doctors', label: '🔙 Back to Doctors', action: 'show-doctors' }
          ]
        );
        setChatState(prev => ({ ...prev, step: 'booking' }));
      }
    }

    // Handle booking
    if (action === 'book-now') {
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setIsTyping(false);

      const doctor = chatState.selectedDoctor;
      const typeLabel = chatState.appointmentType === 'home' ? 'Home Visit' : 'Video Consultation';
      
      addBotMessage(
        `✅ **Booking Confirmation!**\n\n` +
        `I've initiated your booking with **${doctor?.name}**\n` +
        `📋 **Service**: ${typeLabel}\n` +
        `💰 **Fee**: ₹${doctor?.fee}/session\n` +
        `🕐 **Preferred Time**: ${doctor?.availability}\n\n` +
        `To complete your booking, please confirm your details:`,
        [
          { id: 'confirm-booking', label: '✅ Confirm Booking', action: 'confirm-booking' },
          { id: 'reschedule', label: '🔄 Reschedule', action: 'reschedule' },
          { id: 'cancel', label: '❌ Cancel', action: 'cancel' }
        ]
      );
    }

    // Handle confirmation
    if (action === 'confirm-booking') {
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsTyping(false);

      addBotMessage(
        `🎉 **Booking Confirmed!**\n\n` +
        `Your appointment with **${chatState.selectedDoctor?.name}** is confirmed!\n\n` +
        `📅 **Date**: ${chatState.selectedDoctor?.availability}\n` +
        `📋 **Service**: ${chatState.appointmentType === 'home' ? '🏠 Home Visit' : '📹 Video Consultation'}\n` +
        `💰 **Fee**: ₹${chatState.selectedDoctor?.fee}\n\n` +
        `You'll receive a confirmation SMS and email shortly.\n\n` +
        `Need anything else? I'm here to help!`,
        [
          { id: 'new-booking', label: '📅 New Booking', action: 'new-booking' },
          { id: 'end-chat', label: '👋 End Chat', action: 'end-chat' }
        ]
      );
      setChatState(prev => ({ ...prev, step: 'confirmation' }));
    }

    // Handle new booking
    if (action === 'new-booking') {
      setChatState({
        step: 'greeting',
        selectedSymptom: null,
        selectedSpecialty: null,
        selectedDoctor: null,
        appointmentType: null,
        bookingDetails: null
      });
      addBotMessage(
        "👋 Let's start a new booking! What type of care are you looking for?",
        [
          { id: 'home-visit', label: '🏠 Home Visit', action: 'home' },
          { id: 'video-consult', label: '📹 Video Consult', action: 'video' },
          { id: 'symptom-check', label: '🤔 Symptom Check', action: 'symptom' }
        ]
      );
    }

    // Handle end chat
    if (action === 'end-chat') {
      onClose();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    addUserMessage(userMessage);
    setInput('');

    // Process user message
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
    setIsTyping(false);

    // Simple keyword matching
    const lowerInput = userMessage.toLowerCase();
    if (lowerInput.includes('back') || lowerInput.includes('pain')) {
      handleQuickReply('back-pain', 'Back Pain');
    } else if (lowerInput.includes('knee')) {
      handleQuickReply('knee-pain', 'Knee Pain');
    } else if (lowerInput.includes('neck')) {
      handleQuickReply('neck-pain', 'Neck Pain');
    } else if (lowerInput.includes('shoulder')) {
      handleQuickReply('shoulder-pain', 'Frozen Shoulder');
    } else if (lowerInput.includes('sports') || lowerInput.includes('injury')) {
      handleQuickReply('sports-injury', 'Sports Injury');
    } else if (lowerInput.includes('stroke')) {
      handleQuickReply('stroke-rehab', 'Stroke Rehab');
    } else if (lowerInput.includes('sciatica')) {
      handleQuickReply('sciatica', 'Sciatica Pain');
    } else if (lowerInput.includes('arthritis')) {
      handleQuickReply('arthritis', 'Arthritis Care');
    } else if (lowerInput.includes('home') || lowerInput.includes('visit')) {
      handleQuickReply('home', 'Home Visit');
    } else if (lowerInput.includes('video') || lowerInput.includes('consult')) {
      handleQuickReply('video', 'Video Consultation');
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25 }}
          className={`fixed z-50 bg-white rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col
            ${isMinimized ? 'h-16' : 'h-[600px] max-h-[90vh]'}
            ${isMobile ? 'bottom-0 left-0 right-0 rounded-b-none rounded-t-3xl w-full' : 'bottom-4 right-4 w-full max-w-md'}
          `}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate">PhysioPrime Assistant</h3>
                <p className="text-[10px] opacity-75 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse flex-shrink-0" />
                  <span className="truncate">Online • Ready to help</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Toggle voice mode"
              >
                {isVoiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Toggle minimize"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/50">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.type === 'bot' && (
                      <div className="flex items-start gap-2">
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
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleQuickReply(option.action, option.label)}
                                  className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-[10px] sm:text-xs font-semibold transition-colors border border-teal-200 truncate max-w-full"
                                >
                                  {option.label}
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
                          <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl rounded-tr-none px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm">
                            <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</div>
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1 block text-right">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
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
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-500" />
                      Secure
                    </span>
                    <span className="hidden xs:inline">•</span>
                    <span className="hidden xs:inline">24/7 Support</span>
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