import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Users, 
  Award, 
  Heart,
  TrendingUp,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const CareerSection: React.FC = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Expert Team',
      description: 'Work with India\'s top physiotherapists'
    },
    {
      icon: <GraduationCap className="w-5 h-5" />,
      title: 'Continuous Learning',
      description: 'Regular workshops and certifications'
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Career Growth',
      description: 'Clear path to senior roles'
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: 'Patient Impact',
      description: 'Make a real difference in lives'
    }
  ];

  return (
    <section className="py-8 lg:py-12 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 shadow-sm">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-700">Career Opportunities</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Grow With <span className="text-gradient">Us</span>
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
              Take the next step in your physiotherapy career and grow with a team that values expertise, compassion, and continuous learning.
            </p>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/career')}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
            >
              <Sparkles className="w-5 h-5 text-teal-300" />
              <span>Explore Career Opportunities</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span className="text-xs font-semibold text-slate-600">100+ Happy Employees</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-600">Top Workplace 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-slate-600">Flexible Hours</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg transition-all duration-300 hover:bg-teal-50 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-100/50 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center text-blue-600 group-hover:text-teal-600 group-hover:scale-110 transition-all duration-300 mb-4">
                  {benefit.icon}
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">{benefit.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};
