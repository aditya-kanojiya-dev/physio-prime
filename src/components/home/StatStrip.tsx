import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView } from 'framer-motion';
import { ShieldCheck, Star, Users, MapPin } from 'lucide-react';

const METRICS = [
  { value: '10K', suffix: '+', label: 'Happy Patients', Icon: Users, color: 'text-blue-500' },
  { value: '100', suffix: '+', label: 'Verified Doctors', Icon: ShieldCheck, color: 'text-teal-500' },
  { value: '10', suffix: '+', label: 'Active Cities', Icon: MapPin, color: 'text-cyan-500' },
  { value: '5K', suffix: '+', label: 'Recovery Stories', Icon: Star, color: 'text-amber-500' },
];

function MetricValue({ value, suffix, active }: { value: string; suffix: string; active: boolean }) {
  const [text, setText] = useState('0');
  useEffect(() => {
    if (!active) return;
    const target = value.endsWith('K') ? Number(value.slice(0, -1)) * 1000 : Number(value);
    const controls = animate(0, target, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) =>
        setText(value.endsWith('K') ? `${+(v / 1000).toFixed(1)}K` : String(Math.round(v))),
    });
    return () => controls.stop();
  }, [active, value]);
  return (
    <>
      {text}
      {suffix}
    </>
  );
}

export const StatStrip: React.FC = () => {
  const metricsRef = useRef<HTMLDivElement>(null);
  const metricsInView = useInView(metricsRef, { once: true, margin: '-80px' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-8">
      <motion.div
        ref={metricsRef}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="w-full rounded-3xl glass-panel border border-slate-200 shadow-xl px-6 sm:px-10 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6"
      >
        {METRICS.map(({ value, suffix, label, Icon, color }) => (
          <div key={label} className="space-y-1">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
              <MetricValue value={value} suffix={suffix} active={metricsInView} />
            </p>
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
