import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../../lib/motion';

export interface Step {
  number: string;
  title: string;
  desc: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ponytail: shared numbered step card row — Pricing (3 cols) and How It Works (4 cols)
export const StepCards: React.FC<{ steps: Step[]; cols?: 3 | 4 }> = ({ steps, cols = 3 }) => (
  <motion.div
    variants={staggerContainer(0.1, 0.05)}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-40px' }}
    className={`grid grid-cols-1 md:grid-cols-2 ${cols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}
  >
    {steps.map((s) => {
      const Icon = s.icon;
      return (
        <motion.div
          key={s.number}
          variants={fadeUp(24)}
          className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-lg hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-300 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            {Icon && (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <span className="text-2xl font-extrabold text-teal-500/70 leading-none">{s.number}</span>
          </div>
          <h3 className="font-bold text-slate-900">{s.title}</h3>
          <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{s.desc}</p>
        </motion.div>
      );
    })}
  </motion.div>
);
