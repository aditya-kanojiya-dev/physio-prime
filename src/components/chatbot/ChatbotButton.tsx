import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Sparkles } from 'lucide-react';
import { Chatbot } from './Chatbot';

export const ChatbotButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chatbot Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-2xl flex items-center justify-center group"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-yellow-400 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      </motion.button>

      {/* Chatbot Modal */}
      <Chatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};