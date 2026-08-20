import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDoctors, useCategories, useSymptoms } from '../../hooks/queries';
import { Doctor } from '../../types';
import { DoctorChatCard } from './DoctorChatCard';
import {
  X, Send, User, Bot, Shield,
  Mic, MicOff, Minimize2, Maximize2,
  ChevronDown, Sparkles
} from 'lucide-react';
import chatbotImg from '../../assets/chatbot.png';

// Types
interface Message {
  id: string;
  type: 'user' | 'bot' | 'quick-reply' | 'option' | 'system';
  content: string;
  timestamp: Date;
  options?: QuickReplyOption[];
  specialty?: string;
  doctor?: any;
  doctors?: Doctor[];
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

// Constants
const DURATION_OPTIONS = [
  { id: 'less-than-week', label: 'Less than a week' },
  { id: '1-2-weeks', label: '1-2 weeks' },
  { id: '2-4-weeks', label: '2-4 weeks' },
  { id: '1-3-months', label: '1-3 months' },
  { id: '3-6-months', label: '3-6 months' },
  { id: '6-plus-months', label: '6+ months' },
];

const SEVERITY_OPTIONS = [
  { id: 'little-pain', label: '😊 Little Pain', description: 'Noticeable but manageable' },
  { id: 'more-pain', label: '😐 More Pain', description: 'Affects daily activities' },
  { id: 'strong-pain', label: '😰 Strong Pain', description: 'Significantly impacts life' },
];

const PREVIOUS_TREATMENT_OPTIONS = [
  { id: 'none', label: 'No, first time' },
  { id: 'general-physio', label: 'Yes, general physiotherapy' },
  { id: 'specialist', label: 'Yes, specialist physiotherapy' },
  { id: 'other-treatment', label: 'Yes, other treatment' },
];

const SKIP_OPTION: QuickReplyOption = {
  id: 'skip-step',
  label: '⏭️ Skip',
  action: 'skip-step',
  color: 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-600 border-slate-200',
};

const severityOptions = (): QuickReplyOption[] =>
  SEVERITY_OPTIONS.map(s => ({
    id: s.id,
    label: s.label,
    action: `severity-${s.id}`,
    color: s.id === 'little-pain' ? 'bg-green-50/80 hover:bg-green-100/80 text-green-700 border-green-200' :
           s.id === 'more-pain' ? 'bg-yellow-50/80 hover:bg-yellow-100/80 text-yellow-700 border-yellow-200' :
           'bg-red-50/80 hover:bg-red-100/80 text-red-700 border-red-200'
  }));

const durationOptions = (): QuickReplyOption[] =>
  DURATION_OPTIONS.map(d => ({ id: d.id, label: d.label, action: `duration-${d.id}` }));

const treatmentOptions = (): QuickReplyOption[] =>
  PREVIOUS_TREATMENT_OPTIONS.map(p => ({ id: p.id, label: p.label, action: `treatment-${p.id}` }));

const withSkip = (options: QuickReplyOption[]): QuickReplyOption[] => [...options, SKIP_OPTION];

const matchSeverity = (text: string): string | null => {
  const numMatch = text.match(/\b(\d{1,2})\b/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (n >= 8) return 'strong-pain';
    if (n >= 4) return 'more-pain';
    if (n >= 1) return 'little-pain';
  }
  const keywords: Array<[string, string[]]> = [
    ['strong-pain', ['severe', 'unbearable', 'agoniz', 'excruciat', 'worst', 'extreme', 'crippl', 'intense', 'awful', 'terrible', 'a lot', 'lots', 'very bad']],
    ['little-pain', ['little', 'mild', 'slight', 'barely', 'minor', 'okay', 'ok ', 'not much', 'manageable', 'light', 'a bit']],
    ['more-pain', ['moderate', 'painful', 'hurts', 'hurt', 'bad', 'affect', 'difficult', 'discomfort', 'medium']],
  ];
  for (const [key, words] of keywords) {
    if (words.some(w => text.includes(w))) return key;
  }
  return null;
};

const matchDuration = (text: string): string | null => {
  const yearMatch = text.match(/\d+\s*years?|\byears?\b/);
  if (yearMatch) return '6-plus-months';

  const monthMatch = text.match(/(\d+)\s*months?/);
  if (monthMatch) {
    const n = Number(monthMatch[1]);
    if (n >= 6) return '6-plus-months';
    if (n >= 3) return '3-6-months';
    return '1-3-months';
  }
  if (text.includes('month')) return '1-3-months';

  const weekMatch = text.match(/(\d+)\s*weeks?/);
  if (weekMatch) {
    const n = Number(weekMatch[1]);
    if (n >= 6) return '6-plus-months';
    if (n >= 4) return '2-4-weeks';
    if (n >= 2) return '1-2-weeks';
    return 'less-than-week';
  }
  if (text.includes('week')) return '1-2-weeks';

  const dayMatch = text.match(/(\d+)\s*days?/);
  if (dayMatch) return Number(dayMatch[1]) >= 7 ? '1-2-weeks' : 'less-than-week';

  const keywords: Record<string, string> = {
    'today': 'less-than-week', 'yesterday': 'less-than-week', 'few days': 'less-than-week',
    'since morning': 'less-than-week', 'just started': 'less-than-week',
    'long time': '6-plus-months', 'since childhood': '6-plus-months', 'forever': '6-plus-months',
    'few months': '3-6-months', 'couple of months': '3-6-months',
  };
  for (const [word, duration] of Object.entries(keywords)) {
    if (text.includes(word)) return duration;
  }
  return null;
};

const matchTreatment = (text: string): string | null => {
  if (/^no\b/.test(text)) return 'none';
  const keywords: Array<[string, string[]]> = [
    ['none', ['first time', 'never', "haven't", 'not yet', 'not consulted', 'nothing', 'nope']],
    ['specialist', ['specialist', 'specialized', 'specialised', 'special physio']],
    ['general-physio', ['general physio', 'regular physio', 'normal physio', 'physio']],
    ['other-treatment', ['medicine', 'medication', 'tablet', 'other treatment', 'doctor', 'ayurved', 'massage', 'oil', 'home remed', 'chiropract', 'painkiller']],
  ];
  for (const [key, words] of keywords) {
    if (words.some(w => text.includes(w))) return key;
  }
  return null;
};

// Helper functions
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

// Reusable Components
const ChatHeader: React.FC<{
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  isVoiceMode: boolean;
  onToggleVoice: () => void;
  speechSupported: boolean;
}> = ({ isMinimized, onToggleMinimize, onClose, isVoiceMode, onToggleVoice, speechSupported }) => (
  <div className="relative px-4 py-3.5 bg-gradient-to-r from-teal-600 via-teal-600 to-blue-600 text-white flex items-center justify-between flex-shrink-0 overflow-hidden">
    {/* Background decorative elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-x-12 -translate-y-12" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-xl -translate-x-8 translate-y-8" />
    </div>
    
    <div className="flex items-center gap-3 min-w-0 relative z-10">
      <motion.div 
        className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white/30"
        animate={{ 
          y: [0, -4, 0],
          boxShadow: ['0 0 0 0 rgba(255,255,255,0)', '0 0 20px 4px rgba(255,255,255,0.15)', '0 0 0 0 rgba(255,255,255,0)']
        }}
        transition={{ 
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <img src={chatbotImg} alt="PhysioPrime Assistant" className="w-full h-full object-cover" />
      </motion.div>
      <div className="min-w-0">
        <h3 className="font-bold text-sm truncate">PhysioPrime Assistant</h3>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          <p className="text-[10px] opacity-75 truncate">Online • Ready to help</p>
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-0.5 relative z-10">
      <motion.button
        whileHover={speechSupported ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' } : undefined}
        whileTap={speechSupported ? { scale: 0.92 } : undefined}
        onClick={onToggleVoice}
        disabled={!speechSupported}
        className={`relative p-1.5 rounded-lg transition-all duration-200 ${!speechSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
        aria-label={isVoiceMode ? "Stop voice input" : "Start voice input"}
        title={!speechSupported ? 'Voice input is not supported in this browser' : isVoiceMode ? 'Stop listening' : 'Talk to the assistant'}
      >
        {isVoiceMode && (
          <motion.span
            className="absolute inset-0 rounded-lg border-2 border-white/80"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {isVoiceMode ? (
          <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
        whileTap={{ scale: 0.92 }}
        onClick={onToggleMinimize}
        className="p-1.5 rounded-lg transition-all duration-200"
        aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
      >
        {isMinimized ? <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
        whileTap={{ scale: 0.92 }}
        onClick={onClose}
        className="p-1.5 rounded-lg transition-all duration-200"
        aria-label="Close chat"
      >
        <X className="w-4 h-4 sm:w-5 sm:h-5" />
      </motion.button>
    </div>
  </div>
);

const TypingIndicator: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-2 max-w-[85%]"
  >
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-100/80 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <motion.div 
          className="w-2 h-2 bg-teal-500 rounded-full"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0, ease: "easeInOut" }}
        />
        <motion.div 
          className="w-2 h-2 bg-teal-500 rounded-full"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2, ease: "easeInOut" }}
        />
        <motion.div 
          className="w-2 h-2 bg-teal-500 rounded-full"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4, ease: "easeInOut" }}
        />
      </div>
    </div>
  </motion.div>
);

const MessageBubble: React.FC<{
  message: Message;
  isNew: boolean;
  mode: 'home' | 'online';
}> = ({ message, isNew, mode }) => {
  const isBot = message.type === 'bot';
  const isUser = message.type === 'user';
  
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 20, scale: 0.95 } : false}
      animate={isNew ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={isNew ? { 
        type: 'spring', 
        damping: 25, 
        stiffness: 300,
        duration: 0.3
      } : {}}
    >
      {isBot && (
        <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-100/80">
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
                {message.content}
              </div>
            </div>
            {message.options && message.options.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {message.options.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (window as any).handleQuickReply?.(option.action, option.label)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border shadow-sm ${
                      option.color || 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 hover:border-teal-300'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            )}
            {message.doctors && message.doctors.length > 0 && (
              <div className="mt-2.5 space-y-2">
                {message.doctors.map((doctor) => (
                  <DoctorChatCard key={doctor.id} doctor={doctor} mode={mode} />
                ))}
              </div>
            )}
            <span className="text-[10px] text-slate-400 mt-1 block">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      {isUser && (
        <div className="flex items-start gap-2 justify-end">
          <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
            <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md">
              <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block text-right">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ChatInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isTyping: boolean;
  isVoiceMode: boolean;
  disabled?: boolean;
}> = ({ value, onChange, onSend, isTyping, isVoiceMode, disabled }) => (
  <div className="relative bg-white/95 backdrop-blur-sm border-t border-slate-200/80 p-3 flex-shrink-0">
    {/* Decorative gradient line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
    
    <div className="flex items-center gap-2 max-w-full">
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder={isVoiceMode ? "🎤 Listening..." : "Type your message..."}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm bg-slate-50/80 backdrop-blur-sm transition-all duration-200 placeholder:text-slate-400"
          disabled={isTyping || disabled}
          aria-label="Type your message"
        />
        {value && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400"
          />
        )}
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={onSend}
        disabled={!value.trim() || isTyping}
        className="p-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200"
        aria-label="Send message"
      >
        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
      </motion.button>
    </div>
    <div className="mt-2 flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-1 px-1">
      <span className="flex items-center gap-1">
        <Shield className="w-3 h-3 text-teal-500" />
        Secure & Private
      </span>
      <span className="flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>AI-Powered</span>
      </span>
    </div>
  </div>
);

// Main Chatbot Component
interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, onMinimize }) => {
  const navigate = useNavigate();
  const { data: doctors = [] } = useDoctors();
  const { data: categories = [] } = useCategories();
  const { data: symptoms = [] } = useSymptoms();

  const SYMPTOMS = useMemo(() => 
    symptoms.map((s) => ({
      id: s.id,
      label: s.title,
      icon: symptomIcon(s.iconName),
      conditions: typeof s.popularFor === 'string' ? s.popularFor.split(', ') : [],
      severity: ['Little pain', 'More pain', 'Strong pain'],
      description: s.description,
      recoveryEstimate: s.recoveryEstimate,
      image: s.image,
    })), [symptoms]
  );

  const SPECIALTIES = useMemo(() =>
    categories.map((cat) => ({
      id: cat.slug,
      label: cat.title,
      count: cat.doctorCount,
      icon: specialtyIcon(cat.slug),
      conditions: cat.conditions,
      description: cat.description,
    })), [categories]
  );

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
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isReduceMotion, setIsReduceMotion] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Mobile detection and viewport handling
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    const checkReducedMotion = () => {
      setIsReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    checkMobile();
    checkReducedMotion();
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', checkReducedMotion);
    window.addEventListener('resize', checkMobile);
    window.visualViewport?.addEventListener('resize', checkMobile);
    
    return () => {
      reducedMotionQuery.removeEventListener('change', checkReducedMotion);
      window.removeEventListener('resize', checkMobile);
      window.visualViewport?.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Smart auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setIsUserScrolling(!isNearBottom);
      lastScrollTopRef.current = scrollTop;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        if (!isNearBottom && messages.length > 0) {
          setShowNewMessageIndicator(true);
        }
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages.length]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    if (isNearBottom || !isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setShowNewMessageIndicator(false);
    } else {
      setShowNewMessageIndicator(true);
    }
  }, [messages, isUserScrolling]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: `greeting-${Date.now()}`,
        type: 'bot',
        content: "👋 Hello! I'm your PhysioPrime assistant. I'll help you find the right physiotherapist for your needs.\n\nWhat type of care are you looking for?",
        timestamp: new Date(),
        options: [
          { id: 'home-visit', label: '🏠 Home Visit', action: 'home', color: 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border-blue-200' },
          { id: 'video-consult', label: '📹 Video Consult', action: 'video', color: 'bg-teal-50/80 hover:bg-teal-100/80 text-teal-700 border-teal-200' },
          { id: 'symptom-check', label: '🤔 Symptom Check', action: 'symptom', color: 'bg-purple-50/80 hover:bg-purple-100/80 text-purple-700 border-purple-200' }
        ]
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
    if (onMinimize) onMinimize();
  }, [onMinimize]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const addBotMessage = useCallback((content: string, options?: QuickReplyOption[], specialty?: string, doctor?: any) => {
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
  }, [addMessage]);

  const addUserMessage = useCallback((content: string) => {
    const message: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    addMessage(message);
  }, [addMessage]);

  const simulateTyping = useCallback(async (duration: number = 800) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, duration));
    setIsTyping(false);
  }, []);

  const askDuration = useCallback(async (severity: string | null) => {
    setChatState(prev => ({ ...prev, selectedSeverity: severity, step: 'duration' }));
    await simulateTyping(800);
    addBotMessage(
      "Thank you for sharing. How long have you been experiencing these symptoms?",
      withSkip(durationOptions())
    );
  }, [addBotMessage, simulateTyping]);

  const askTreatment = useCallback(async (duration: string | null) => {
    setChatState(prev => ({ ...prev, selectedDuration: duration, step: 'previous-treatment' }));
    await simulateTyping(800);
    addBotMessage(
      "Have you consulted with a physiotherapist or any other healthcare professional about this condition before?",
      withSkip(treatmentOptions())
    );
  }, [addBotMessage, simulateTyping]);

  const askSummary = useCallback(async (treatment: string | null) => {
    const symptomId = chatState.selectedSymptom;
    let matchingSpecialtyId = '';
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

    setChatState(prev => ({
      ...prev,
      previousTreatment: treatment,
      selectedSpecialty: matchingSpecialtyId,
      step: 'specialty',
    }));

    const symptom = SYMPTOMS.find(s => s.id === symptomId);
    const specialty = SPECIALTIES.find(s => s.id === matchingSpecialtyId);
    const severity = SEVERITY_OPTIONS.find(s => s.id === chatState.selectedSeverity);
    const severityEmoji = chatState.selectedSeverity === 'strong-pain' ? '🔴' :
                          chatState.selectedSeverity === 'more-pain' ? '🟡' : '🟢';

    const lines: string[] = ['Based on your responses:'];
    if (symptom) lines.push(`\n📋 Symptom: ${symptom.label}`);
    if (severity) lines.push(`${severityEmoji} Severity: ${severity.label}`);
    if (chatState.selectedDuration) {
      lines.push(`⏰ Duration: ${DURATION_OPTIONS.find(d => d.id === chatState.selectedDuration)?.label}`);
    }
    if (treatment) {
      const treatmentMsg =
        treatment === 'none' ? 'This is your first time seeking treatment.' :
        treatment === 'general-physio' ? "You've had general physiotherapy before." :
        treatment === 'specialist' ? "You've seen a specialist physiotherapist before." :
        "You've tried other treatments before.";
      lines.push(`🩺 Previous Treatment: ${treatmentMsg}`);
    }
    if (symptom?.recoveryEstimate) lines.push(`\n📈 Recovery Estimate: ${symptom.recoveryEstimate}`);

    lines.push(
      `\nI recommend consulting a ${specialty?.label || 'Physiotherapy'} specialist who can provide targeted treatment for your condition.\n\nWould you like to see available doctors?`
    );

    await simulateTyping(1200);
    addBotMessage(
      lines.join('\n'),
      [
        { id: 'show-doctors', label: '👨‍⚕️ Show Doctors', action: 'show-doctors', color: 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border-blue-200' },
        { id: 'back-to-symptoms', label: '🔄 Different Symptom', action: 'symptom', color: 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-700 border-slate-200' },
        { id: 'view-slots', label: '📅 Check Slots', action: 'view-slots', color: 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-700 border-amber-200' }
      ],
      matchingSpecialtyId
    );
  }, [addBotMessage, simulateTyping, chatState, SYMPTOMS, SPECIALTIES]);

  const handleQuickReply = useCallback(async (action: string, label: string) => {
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
        withSkip(severityOptions())
      );
      setChatState(prev => ({ ...prev, step: 'severity' }));
      return;
    }

    // Handle severity selection
    if (action.startsWith('severity-')) {
      const severity = action.replace('severity-', '');
      await askDuration(severity);
      return;
    }

    // Handle duration selection
    if (action.startsWith('duration-')) {
      const duration = action.replace('duration-', '');
      await askTreatment(duration);
      return;
    }

    // Handle previous treatment selection
    if (action.startsWith('treatment-')) {
      const treatment = action.replace('treatment-', '');
      await askSummary(treatment);
      return;
    }

    // Handle skipping the current guided question
    if (action === 'skip-step') {
      if (chatState.step === 'severity') {
        await askDuration(null);
      } else if (chatState.step === 'duration') {
        await askTreatment(null);
      } else if (chatState.step === 'previous-treatment') {
        await askSummary(null);
      }
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
      const filteredDoctors = doctors.filter((d: any) => 
        d.specialty.toLowerCase().includes(specialty?.label?.toLowerCase() || '') ||
        d.expertise.some((e: string) => specialty?.conditions?.some((c: string) => 
          e.toLowerCase().includes(c.toLowerCase())
        ))
      );

      if (filteredDoctors.length === 0) {
        addBotMessage(
          "I couldn't find any doctors matching your criteria. Please try selecting a different symptom or check our available slots.",
          [
            { id: 'back-to-symptoms', label: '🔄 Different Symptom', action: 'symptom', color: 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-700 border-slate-200' },
            { id: 'view-slots', label: '📅 Check Slots', action: 'view-slots', color: 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-700 border-amber-200' }
          ]
        );
        return;
      }

      addMessage({
        id: `doctors-${Date.now()}`,
        type: 'bot',
        content: 'Here are the top specialists for your condition:',
        timestamp: new Date(),
        doctors: filteredDoctors.slice(0, 3),
      });
      addBotMessage(
        'Tap **Book Now** on your preferred doctor, or explore other options:',
        [
          { id: 'back-to-symptoms', label: '🔄 Different Symptom', action: 'symptom', color: 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-700 border-slate-200' },
          { id: 'view-slots', label: '📅 Check Slots', action: 'view-slots', color: 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-700 border-amber-200' }
        ]
      );
      setChatState(prev => ({ ...prev, step: 'doctor' }));
      return;
    }

    // Handle doctor selection
    if (action.startsWith('doctor-')) {
      const doctorId = action.replace('doctor-', '');
      const doctor = doctors.find((d: any) => d.id === doctorId);
      if (doctor) {
        setChatState(prev => ({ ...prev, selectedDoctor: doctor }));
        await simulateTyping(1000);

        const typeLabel = chatState.appointmentType === 'home' ? 'Home Visit' : 'Video Consultation';
        const fee = doctor.fees[chatState.appointmentType === 'home' ? 'home' : 'online'];
        
        addBotMessage(
          `Great choice! Here are the details for ${doctor.name}:\n\n👨‍⚕️ Specialty: ${doctor.specialty}\n⭐ Rating: ${doctor.rating} (${doctor.reviewCount} reviews)\n📍 Location: ${doctor.location.area}, ${doctor.location.city}\n⏰ Experience: ${doctor.experienceYears} years\n💰 Fee: ₹${fee}/session (${typeLabel})\n🕐 Next Available: ${doctor.nextAvailable}\n🌐 Languages: ${doctor.languages.join(', ')}\n\nWould you like to book a ${typeLabel} with ${doctor.name}?`,
          [
            { id: 'book-now', label: '📅 Book Now', action: 'book-now', color: 'bg-teal-50/80 hover:bg-teal-100/80 text-teal-700 border-teal-200' },
            { id: 'view-profile', label: '👤 View Full Profile', action: `profile-${doctor.id}`, color: 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border-blue-200' },
            { id: 'back-to-doctors', label: '🔙 Back to Doctors', action: 'show-doctors', color: 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-700 border-slate-200' }
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
      
      navigate('/book', { state: { doctor, mode } });
      
      onClose();
      return;
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
          { id: 'home-visit', label: '🏠 Home Visit', action: 'home', color: 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border-blue-200' },
          { id: 'video-consult', label: '📹 Video Consult', action: 'video', color: 'bg-teal-50/80 hover:bg-teal-100/80 text-teal-700 border-teal-200' },
          { id: 'symptom-check', label: '🤔 Symptom Check', action: 'symptom', color: 'bg-purple-50/80 hover:bg-purple-100/80 text-purple-700 border-purple-200' }
        ]
      );
    }

    // Handle end chat
    if (action === 'end-chat') {
      await simulateTyping(500);
      addBotMessage(
        "💚 Thank you for using PhysioPrime! We hope you feel better soon.\n\nIf you need any further assistance, I'm always here to help. Take care! 💪"
      );
      setTimeout(() => onClose(), 3000);
    }
  }, [addUserMessage, simulateTyping, addBotMessage, addMessage, askDuration, askTreatment, askSummary, SYMPTOMS, SPECIALTIES, chatState, doctors, navigate, onClose]);

  // Expose handleQuickReply globally for button clicks
  useEffect(() => {
    (window as any).handleQuickReply = handleQuickReply;
    return () => {
      delete (window as any).handleQuickReply;
    };
  }, [handleQuickReply]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');

    const lowerInput = userMessage.toLowerCase();
    const step = chatState.step;

    const reask = (title: string, options: QuickReplyOption[]) => {
      addUserMessage(userMessage);
      simulateTyping(800).then(() => addBotMessage(title, options));
    };

    if (step === 'severity') {
      const severity = matchSeverity(lowerInput);
      if (severity) return handleQuickReply(`severity-${severity}`, userMessage);
      return reask("I didn't quite catch that — could you tell me how severe your symptoms are?", withSkip(severityOptions()));
    }

    if (step === 'duration') {
      const duration = matchDuration(lowerInput);
      if (duration) return handleQuickReply(`duration-${duration}`, userMessage);
      return reask("Hmm, I couldn't place that — how long have you been experiencing these symptoms?", withSkip(durationOptions()));
    }

    if (step === 'previous-treatment') {
      const treatment = matchTreatment(lowerInput);
      if (treatment) return handleQuickReply(`treatment-${treatment}`, userMessage);
      return reask("I didn't catch that — have you consulted a physiotherapist or other professional about this before?", withSkip(treatmentOptions()));
    }

    const matchedSymptom = SYMPTOMS.find(s => 
      lowerInput.includes(s.label.toLowerCase()) ||
      s.conditions.some(c => lowerInput.includes(c.toLowerCase()))
    );
    
    if (matchedSymptom) {
      return handleQuickReply(matchedSymptom.id, matchedSymptom.label);
    } else if (lowerInput.includes('home') || lowerInput.includes('visit')) {
      return handleQuickReply('home', 'Home Visit');
    } else if (lowerInput.includes('video') || lowerInput.includes('consult')) {
      return handleQuickReply('video', 'Video Consultation');
    } else if (lowerInput.includes('slot') || lowerInput.includes('availability')) {
      return handleQuickReply('view-slots', 'Check Slots');
    } else {
      addUserMessage(userMessage);
      await simulateTyping(1000);
      return addBotMessage(
        "I understand you have concerns about your health. Let me help you find the right specialist.\n\nPlease select the area that's bothering you:",
        SYMPTOMS.map(s => ({
          id: s.id,
          label: `${s.icon} ${s.label}`,
          action: s.id
        }))
      );
    }
  }, [input, chatState, addUserMessage, simulateTyping, SYMPTOMS, handleQuickReply, addBotMessage]);

  // Speech-to-text support detection + cleanup
  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setIsSpeechSupported(supported);
    return () => recognitionRef.current?.stop();
  }, []);

  const toggleVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (isVoiceMode) {
      recognitionRef.current?.stop();
      setIsVoiceMode(false);
      inputRef.current?.focus();
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsVoiceMode(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    };

    recognition.onerror = () => setIsVoiceMode(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsVoiceMode(true);
  }, [isVoiceMode]);

  // Get the height for mobile
  const getMobileHeight = useCallback(() => {
    if (isMobile) {
      if (isMinimized) return 'h-16';
      return `h-[100dvh] max-h-[100dvh]`;
    }
    return isMinimized ? 'h-16' : 'h-[620px] max-h-[85vh]';
  }, [isMobile, isMinimized]);

  // Get the position for mobile
  const getMobilePosition = useCallback(() => {
    if (isMobile) {
      return 'bottom-0 left-0 right-0 rounded-none';
    }
    return 'bottom-6 right-6 rounded-3xl';
  }, [isMobile]);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring', 
        damping: 25,
        stiffness: 350,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      transition: { 
        duration: 0.25,
        ease: "easeOut"
      }
    }
  };

  const mobileContainerVariants: Variants = {
    hidden: { 
      opacity: 0,
      y: '100%'
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { 
        type: 'spring',
        damping: 30,
        stiffness: 350,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0,
      y: '100%',
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={chatContainerRef}
          variants={isMobile ? mobileContainerVariants : containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`fixed z-50 bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(13,148,136,0.12),0_2px_8px_rgba(2,6,23,0.08)] border border-teal-100/70 overflow-hidden flex flex-col
            ${getMobileHeight()}
            ${getMobilePosition()}
            ${isMobile ? 'w-full' : 'w-full max-w-[420px] sm:max-w-[440px]'}
            ${isMobile && 'rounded-t-2xl'}
          `}
          style={{
            maxHeight: isMobile ? '100dvh' : '90vh',
            height: isMobile && !isMinimized ? '100dvh' : 'auto',
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0
          }}
          role="dialog"
          aria-label="Chat with PhysioPrime Assistant"
        >
          {/* Background visual effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl animate-slow-float" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-slow-float-delayed" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl" />
          </div>

          {/* Header */}
          <ChatHeader
            isMinimized={isMinimized}
            onToggleMinimize={handleMinimize}
            onClose={onClose}
            isVoiceMode={isVoiceMode}
            onToggleVoice={toggleVoice}
            speechSupported={isSpeechSupported}
          />

          {!isMinimized && (
            <>
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white/50 relative"
                style={{
                  scrollBehavior: isReduceMotion ? 'auto' : 'smooth'
                }}
              >
                {messages.map((message, index) => (
                  <MessageBubble 
                    key={message.id} 
                    message={message}
                    isNew={index === messages.length - 1 && message.type !== 'system'}
                    mode={chatState.appointmentType === 'home' ? 'home' : 'online'}
                  />
                ))}
                
                {isTyping && <TypingIndicator />}
                
                {/* New message indicator */}
                {showNewMessageIndicator && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                      setShowNewMessageIndicator(false);
                    }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-lg rounded-full px-4 py-2 text-xs font-medium text-teal-600 border border-slate-200 hover:bg-teal-50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      New messages
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </motion.button>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSendMessage}
                isTyping={isTyping}
                isVoiceMode={isVoiceMode}
                disabled={isMinimized}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Add to your global CSS (or include in the component's styles)
const globalStyles = `
  @keyframes slow-float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.1); }
    66% { transform: translate(-20px, 30px) scale(0.9); }
  }
  @keyframes slow-float-delayed {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-30px, 20px) scale(0.9); }
    66% { transform: translate(20px, -30px) scale(1.1); }
  }
  .animate-slow-float {
    animation: slow-float 20s ease-in-out infinite;
  }
  .animate-slow-float-delayed {
    animation: slow-float-delayed 25s ease-in-out infinite;
  }
`;

// Add styles if not already present
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}