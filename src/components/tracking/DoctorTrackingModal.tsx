import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import { 
  MapPin, Navigation, Phone, MessageSquare, Clock, 
  ShieldCheck, X, Wifi, 
  Cloud, Sun, CloudRain, Wind, AlertTriangle,
  CheckCircle, Route, Activity, Gauge,
  Navigation2, Radio, Satellite
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackingModalProps {
  appointment: Appointment;
  onClose: () => void;
}

// Enhanced mock data
const ROUTE_WAYPOINTS = [
  { lat: 21.1458, lng: 79.0882, label: 'Start' },
  { lat: 21.1480, lng: 79.0850, label: 'Traffic Signal' },
  { lat: 21.1500, lng: 79.0820, label: 'Landmark' },
  { lat: 21.1520, lng: 79.0790, label: 'Near Destination' },
];

const TRAFFIC_CONDITIONS = ['Light', 'Moderate', 'Heavy'];
const WEATHER_CONDITIONS = ['Clear', 'Cloudy', 'Light Rain', 'Windy'];

export const DoctorTrackingModal: React.FC<TrackingModalProps> = ({ appointment, onClose }) => {
  const [progress, setProgress] = useState(15);
  const [etaMinutes, setEtaMinutes] = useState(18);
  const [distanceKm, setDistanceKm] = useState(2.4);
  const [speed, setSpeed] = useState(12);
  const [statusText, setStatusText] = useState('Doctor is en route via EV Scooter');
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState('');
  const [trafficCondition, setTrafficCondition] = useState('Moderate');
  const [weatherCondition, setWeatherCondition] = useState('Clear');
  const [isArrived, setIsArrived] = useState(false);
  const [currentWaypoint, setCurrentWaypoint] = useState(0);

  // Enhanced notification system
  const triggerNotification = (message: string) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  useEffect(() => {
    // Random weather and traffic updates
    const weatherInterval = setInterval(() => {
      const newWeather = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
      setWeatherCondition(newWeather);
    }, 15000);

    const trafficInterval = setInterval(() => {
      const newTraffic = TRAFFIC_CONDITIONS[Math.floor(Math.random() * TRAFFIC_CONDITIONS.length)];
      setTrafficCondition(newTraffic);
      if (newTraffic === 'Heavy') {
        triggerNotification('⚠️ Heavy traffic detected ahead. ETA may increase.');
      }
    }, 20000);

    return () => {
      clearInterval(weatherInterval);
      clearInterval(trafficInterval);
    };
  }, []);

  useEffect(() => {
    let notificationIndex = 0;
    const notifications = [
      '🚗 Doctor has started the journey',
      '📍 Crossing Nagpur Railway Station',
      '🔄 Taking a right turn at Sitabuldi',
      '⏱️ 10 minutes away from your location',
      '🏠 Approaching Civil Lines',
    ];

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) {
          setIsArrived(true);
          setStatusText(`✅ Doctor ${appointment.doctorName} has arrived at your address!`);
          setEtaMinutes(0);
          setDistanceKm(0);
          setSpeed(0);
          triggerNotification('🎉 Doctor has arrived at your doorstep!');
          return 100;
        }

        // Dynamic speed changes
        const speedVariation = Math.random() * 0.5 + 0.5;
        const next = Math.min(prev + (2 + Math.random() * 3) * speedVariation, 98);
        
        // Update ETA with dynamic calculation
        const remaining = 100 - next;
        const newEta = Math.max(1, Math.round(remaining * 0.12 * (1 + Math.random() * 0.2)));
        setEtaMinutes(newEta);
        
        // Update distance
        setDistanceKm(Number((remaining * 0.028).toFixed(1)));
        
        // Update speed with realistic variation
        const newSpeed = Math.max(8, Math.min(25, 15 + (Math.random() - 0.5) * 10));
        setSpeed(Math.round(newSpeed));
        
        // Update waypoint
        const waypointProgress = next / 100;
        const newWaypoint = Math.min(ROUTE_WAYPOINTS.length - 1, Math.floor(waypointProgress * ROUTE_WAYPOINTS.length));
        if (newWaypoint !== currentWaypoint && newWaypoint > currentWaypoint) {
          setCurrentWaypoint(newWaypoint);
          if (notificationIndex < notifications.length) {
            triggerNotification(notifications[notificationIndex % notifications.length]);
            notificationIndex++;
          }
        }

        // Status updates
        if (next < 30) {
          setStatusText(`🚀 Doctor is on the way via EV Scooter (${speed} km/h)`);
        } else if (next < 60) {
          setStatusText(`📍 Doctor is halfway there - ${Math.round(distanceKm)}km away`);
        } else if (next < 85) {
          setStatusText(`⚡ Doctor is nearby - ${Math.round(distanceKm)}km away`);
        } else {
          setStatusText(`🏠 Doctor is almost at your address!`);
        }

        return next;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [appointment.doctorName, currentWaypoint]);

  // Calculate progress arc for compass
  const progressAngle = (progress / 100) * 360;

  // Get weather icon
  const getWeatherIcon = () => {
    switch(weatherCondition) {
      case 'Clear': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'Cloudy': return <Cloud className="w-4 h-4 text-gray-500" />;
      case 'Light Rain': return <CloudRain className="w-4 h-4 text-blue-500" />;
      case 'Windy': return <Wind className="w-4 h-4 text-teal-500" />;
      default: return <Sun className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-full max-w-4xl bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        >
          
          {/* Status Bar */}
          <div className="px-6 py-2 bg-gradient-to-r from-teal-600 to-blue-600 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Live GPS</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getWeatherIcon()}
              <span className="text-[10px]">{weatherCondition}</span>
              <span className="text-[10px] opacity-75">•</span>
              <span className="text-[10px]">Traffic: {trafficCondition}</span>
            </div>
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 text-white flex items-center justify-center">
                  <Navigation className="w-6 h-6 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  Live Tracking
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">Doctor Home Visit</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Enhanced Map Container */}
            <div className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50 border border-slate-200 shadow-inner">
              
              {/* Grid Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
              
              {/* Building Placeholders */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute bg-slate-300/30 rounded border border-slate-300/20"
                  style={{
                    width: Math.random() * 30 + 15,
                    height: Math.random() * 40 + 20,
                    left: `${Math.random() * 90 + 5}%`,
                    top: `${Math.random() * 80 + 10}%`,
                    transform: 'rotate(45deg)',
                  }}
                />
              ))}

              {/* Route Path with Glow Effect */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" strokeWidth="4">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.3" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path 
                  d="M 80 200 C 180 120, 240 220, 480 80 C 520 60, 580 100, 620 120" 
                  fill="none" 
                  stroke="url(#routeGradient)"
                  strokeDasharray="4 8"
                />
                <path 
                  d="M 80 200 C 180 120, 240 220, 480 80 C 520 60, 580 100, 620 120" 
                  fill="none" 
                  stroke="#14b8a6"
                  strokeDasharray="600"
                  strokeDashoffset={600 - (progress / 100) * 600}
                  filter="url(#glow)"
                />
              </svg>

              {/* Waypoint Markers */}
              {ROUTE_WAYPOINTS.map((waypoint, index) => (
                <div
                  key={index}
                  className="absolute z-10"
                  style={{
                    left: `${15 + (index / (ROUTE_WAYPOINTS.length - 1)) * 65}%`,
                    top: `${60 - Math.sin((index / (ROUTE_WAYPOINTS.length - 1)) * Math.PI) * 35}%`,
                  }}
                >
                  <div className="relative -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    {index === 0 && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-2 py-0.5 rounded text-[8px] font-bold whitespace-nowrap">
                        Start
                      </div>
                    )}
                    {index === ROUTE_WAYPOINTS.length - 1 && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-2 py-0.5 rounded text-[8px] font-bold whitespace-nowrap">
                        Destination
                      </div>
                    )}
                  </div>
                </div>
              ))}





{/* Doctor Moving Marker with Cartoon Avatar */}

{/* Doctor Moving Marker with Cartoon Avatar */}
<motion.div
  className="absolute z-20"
  animate={{
    left: `${15 + (progress / 100) * 65}%`,
    top: `${60 - Math.sin((progress / 100) * Math.PI) * 35}%`,
  }}
  transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
>
  <div className="relative -translate-x-1/2 -translate-y-1/2">
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
      }}
    >
      <div className="bg-white rounded-full p-1 shadow-2xl border-2 border-teal-500">
        <img 
          src={appointment.doctorPhoto || "https://cdn-icons-png.flaticon.com/512/3774/3774299.png"}      
          alt={appointment.doctorName || "Doctor"}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            // Enhanced fallback with multiple options
            const fallbacks = [
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2314b8a6'/%3E%3Ccircle cx='50' cy='35' r='20' fill='white'/%3E%3Ccircle cx='35' cy='30' r='5' fill='%2314b8a6'/%3E%3Ccircle cx='65' cy='30' r='5' fill='%2314b8a6'/%3E%3Cpath d='M40 45 Q50 55 60 45' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3Crect x='35' y='55' width='30' height='25' rx='5' fill='white'/%3E%3C/svg%3E",
              "https://cdn-icons-png.flaticon.com/512/3774/3774299.png"
            ];
            
            let index = 0;
            const tryFallback = () => {
              if (index < fallbacks.length) {
                e.currentTarget.src = fallbacks[index];
                index++;
              }
            };
            tryFallback();
          }}
        />
      </div>
    </motion.div>
    {/* Glow rings */}
    <div className="absolute inset-0 -m-2 rounded-full border-2 border-teal-500/30 animate-ping" />
    <div className="absolute inset-0 -m-6 rounded-full border border-teal-500/20 animate-pulse" />
  </div>
</motion.div>



              {/* ETA Dashboard - Floating */}
              <div className="absolute top-4 left-4 z-10 glass-panel bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Clock className="w-6 h-6 text-teal-600 animate-spin" style={{ animationDuration: '8s' }} />
                    <div className="absolute inset-0 rounded-full border-2 border-teal-500/30 animate-ping" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Estimated Arrival</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-black text-teal-600">
                        {etaMinutes > 0 ? `${etaMinutes}m` : 'Arrived!'}
                      </p>
                      {etaMinutes > 0 && (
                        <p className="text-[10px] text-slate-500">{distanceKm}km away</p>
                      )}
                    </div>
                    {etaMinutes > 0 && (
                      <div className="flex items-center gap-1 text-[9px] text-slate-400">
                        <Gauge className="w-3 h-3" />
                        <span>{speed} km/h</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Traffic & Weather Widget */}
              <div className="absolute top-4 right-4 z-10 glass-panel bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-white/50">
                <div className="flex items-center gap-2">
                  {getWeatherIcon()}
                  <div className="h-4 w-px bg-slate-200" />
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      trafficCondition === 'Light' ? 'bg-green-500' :
                      trafficCondition === 'Moderate' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-[9px] font-bold text-slate-600">{trafficCondition}</span>
                  </div>
                </div>
              </div>

              {/* Compass - Bottom Right */}
              <div className="absolute bottom-4 right-4 z-10">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-slate-200 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                    <Navigation2 
                      className="w-5 h-5 text-slate-600" 
                      style={{ transform: `rotate(${progressAngle}deg)` }}
                    />
                  </div>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-rose-500">N</div>
                </div>
              </div>

              {/* Progress Bar - Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="relative z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/50">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-teal-500" />
                      {statusText}
                    </span>
                    <span className="text-teal-600 font-extrabold bg-teal-50 px-2 py-0.5 rounded-full">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden mt-1.5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400"
                      style={{ width: `${progress}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="h-full w-full bg-gradient-to-r from-transparent to-white/30 animate-shimmer" />
                    </motion.div>
                  </div>
                </div>
              </div>

            </div>

            {/* Doctor Info & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Doctor Profile */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={appointment.doctorPhoto} 
                      alt={appointment.doctorName} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{appointment.doctorName}</span>
                      <ShieldCheck className="w-4 h-4 text-teal-500" />
                      {isArrived && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded-full"
                        >
                          Arrived
                        </motion.span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">{appointment.doctorSpecialty}</p>
                    <p className="text-[11px] text-teal-600 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      Nagpur Verified Home Physio
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="px-2 py-1 bg-blue-50 rounded-lg text-[8px] font-bold text-blue-600">
                      ⭐ 4.9
                    </div>
                    <div className="px-2 py-1 bg-green-50 rounded-lg text-[8px] font-bold text-green-600">
                      ✅ Verified
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={`tel:${appointment.doctorPhone || '+919876543210'}`}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Phone className="w-4 h-4" /> Call Doctor
                </motion.a>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerNotification('📱 Message sent to doctor: "Patient is ready"');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-all"
                >
                  <MessageSquare className="w-4 h-4" /> Message
                </motion.button>
              </div>
            </div>

            {/* Live Updates Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-500" />
                  Live Updates
                </h5>
                <span className="text-[9px] text-slate-400">Real-time</span>
              </div>
              <div className="space-y-2 max-h-20 overflow-y-auto">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span>📍 Doctor is en route - {distanceKm}km away</span>
                  <span className="text-[9px] text-slate-400 ml-auto">Now</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  <span>🛣️ Route: {trafficCondition} traffic on main road</span>
                  <span className="text-[9px] text-slate-400 ml-auto">2m ago</span>
                </div>
                {isArrived && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-xs text-green-600 font-bold bg-green-50 p-2 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>✅ Doctor has arrived at your doorstep!</span>
                  </motion.div>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Satellite className="w-3 h-3" />
                GPS Active
              </span>
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Live
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-8 py-2.5 rounded-xl font-extrabold text-xs shadow-md hover:shadow-lg transition-all"
            >
              {isArrived ? 'Close Tracker' : 'Close Live Tracker'}
            </motion.button>
          </div>

          {/* Notification Toast */}
          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ opacity: 0, y: 50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 20, x: '-50%' }}
                className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md max-w-md"
              >
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
                    {notification.includes('arrived') ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                  </div>
                  <span>{notification}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
