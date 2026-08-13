import React from 'react';
import { motion } from 'framer-motion';
import bottomVid from '../../assets/bottom-vid.mp4';

export const HeroShowcase: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 mt-12 lg:mt-16 w-full relative">
      {/* Glow effect behind the image */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-100/50 via-teal-100/50 to-blue-100/50 rounded-3xl blur-2xl animate-pulse" />

      {/* Main Image Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative rounded-4xl overflow-hidden shadow-2xl border border-slate-200/50 group"
      >
        {/* Image */}
        <video
          src={bottomVid}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-56 sm:h-72 md:h-96 lg:h-[26rem] object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradient overlays for depth and luxury feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-teal-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />

        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12" />

        {/* Decorative top and bottom border lines */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />

        {/* Minimal floating badge overlay */}
        <motion.div
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">Trusted by 10K+ Patients</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
