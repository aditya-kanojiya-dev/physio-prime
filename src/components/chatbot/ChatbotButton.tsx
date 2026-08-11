import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Sparkles, ChevronUp } from 'lucide-react';
import { Chatbot } from './Chatbot';

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
    
    // Hide tooltip after 5 seconds
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  // Handle keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Escape key to close
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

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <>
            {/* Tooltip */}
            {showTooltip && !isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed bottom-24 right-6 z-40 bg-white rounded-xl shadow-lg px-4 py-2 border border-slate-200 max-w-[200px]"
              >
                <p className="text-xs text-slate-600">
                  Need help? <span className="font-semibold text-teal-600">Chat with us</span>
                </p>
                <div className="absolute -bottom-2 right-4 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45"></div>
              </motion.div>
            )}

            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: isMobile ? 1 : 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleChat}
              className={`fixed z-40 bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-2xl flex items-center justify-center group
                ${isMobile ? 'bottom-4 right-4 w-14 h-14 rounded-full' : 'bottom-6 right-6 w-16 h-16 rounded-full'}
              `}
              style={{
                boxShadow: '0 8px 32px rgba(13, 148, 136, 0.3)'
              }}
            >
              <div className="relative">
                <MessageSquare className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                
                {/* Status indicator */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                
                {/* Sparkle decoration */}
                <Sparkles className={`absolute -top-1 -left-1 text-yellow-400 animate-pulse
                  ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}
                `} />
              </div>

              {/* Animated glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              
              {/* Notification badge */}
              <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1.5 border-2 border-white">
                1
              </div>
            </motion.button>

            {/* Keyboard shortcut hint */}
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="fixed bottom-20 right-6 z-40 text-[10px] text-slate-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200"
              >
                ⌘K
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Chatbot Component */}
      <Chatbot 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        onMinimize={handleMinimize}
      />

      {/* Floating action indicator when chat is minimized */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
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