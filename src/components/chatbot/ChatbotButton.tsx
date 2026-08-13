import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { Chatbot } from './Chatbot';
// If you must use an image, use one with transparent background
import chatbotImg from '../../assets/chatbot.png';

export const ChatbotButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <>
            {showTooltip && !isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed bottom-24 right-6 z-40 max-w-[200px]"
              >
                <p className="text-xs text-slate-600">
                  Need help? <span className="font-semibold text-teal-600">Chat with us</span>
                </p>
                <div className="absolute -bottom-2 right-4 w-3 h-3 border-r border-b border-slate-200 rotate-45"></div>
              </motion.div>
            )}

<motion.button
  initial={{ scale: 0.85, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0.8, opacity: 0 }}
  whileHover={{ scale: isMobile ? 1 : 1.05, y: isMobile ? 0 : -2 }}
  whileTap={{ scale: 0.9 }}
  onClick={handleToggleChat}
  className={`fixed z-40 flex items-center justify-center group overflow-hidden cursor-pointer
    transition-shadow duration-300 shadow-[0_8px_32px_rgba(13,148,136,0.3)] hover:shadow-[0_12px_44px_rgba(13,148,136,0.45)]
    ${isMobile ? 'bottom-4 right-4 w-14 h-14' : 'bottom-6 right-6 w-16 h-16'}
  `}
  style={{
    background: 'transparent',
    borderRadius: '12px',
    padding: '0',
    border: 'none',
    outline: 'none'
  }}
>
  <img 
    src={chatbotImg} 
    alt="Chat with us" 
    className="w-full h-full object-cover pointer-events-none" // Add pointer-events-none
    style={{ 
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      background: 'transparent',
      borderRadius: '12px',
      pointerEvents: 'none' // This ensures clicks pass through to the button
    }}
  />
  

</motion.button>

          </>
        )}
      </AnimatePresence>

      <Chatbot 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
      />

      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className={`fixed z-40 bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg rounded-full flex items-center justify-center
              ${isMobile ? 'bottom-4 right-4 w-12 h-12' : 'bottom-4 right-4 w-14 h-14'}
            `}
          >
            <ChevronUp className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};