import React, { useState } from 'react';
import { Smartphone, CheckCircle, Apple, Calendar, Stethoscope, User } from 'lucide-react';

export const AppDownload: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'profile'>('home');

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-r from-blue-50 via-white to-teal-50 rounded-3xl p-8 sm:p-12 border border-blue-200 shadow-xl relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
                <Smartphone className="w-4 h-4 text-teal-500" />
                <span>PhysioPrime Mobile App</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
                Manage Your Health & Appointments <span className="text-gradient">On The Go.</span>
              </h2>

              <p className="text-slate-600 text-base leading-relaxed">
                Download the official PhysioPrime iOS and Android app. Track your therapy sessions, get live doctor arrival updates for home visits, and access personalized exercise videos anytime.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                  <span>Real-time GPS tracking for home physiotherapist visits</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                  <span>HD 1-on-1 video call rooms with digital prescriptions</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                  <span>Instant appointment rescheduling & reminders</span>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button className="px-6 py-3.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-sm flex items-center gap-3 shadow-xl transition-transform hover:scale-[1.02]">
                  <Apple className="w-6 h-6 fill-white" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-300 font-bold uppercase">Download on the</p>
                    <p className="text-sm font-black leading-none">App Store</p>
                  </div>
                </button>

                <button className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 font-extrabold text-sm flex items-center gap-3 shadow-xl border border-slate-200 transition-transform hover:scale-[1.02]">
                  <div className="w-6 h-6 text-teal-500 flex items-center justify-center font-black">▶</div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Get it on</p>
                    <p className="text-sm font-black leading-none">Google Play</p>
                  </div>
                </button>
              </div>

            </div>

            {/* Right Interactive App Screen Mockup - keeping dark as it's a phone screen */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-72 sm:w-80 h-[32rem] bg-slate-950 rounded-[40px] p-3 border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between">
                
                {/* Phone Notch */}
                <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-3 h-3 bg-slate-900 rounded-full" />
                </div>

                {/* Mobile Screen Header */}
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      PP
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">Hello, Guest User</p>
                      <p className="text-[9px] text-teal-400">Nagpur, MH</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Screen Content (Tab Dependent) */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  
                  {activeTab === 'home' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-900/60 rounded-2xl border border-blue-700/50 space-y-1">
                        <span className="text-[10px] font-bold text-teal-300">Quick Symptoms Search</span>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <span className="text-[10px] bg-slate-800 p-1.5 rounded-lg text-center font-semibold">Back Pain</span>
                          <span className="text-[10px] bg-slate-800 p-1.5 rounded-lg text-center font-semibold">Knee Pain</span>
                          <span className="text-[10px] bg-slate-800 p-1.5 rounded-lg text-center font-semibold">Neck Pain</span>
                          <span className="text-[10px] bg-slate-800 p-1.5 rounded-lg text-center font-semibold">Stroke Rehab</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>Top Physiotherapist</span>
                          <span className="text-teal-400">⭐ 4.9</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-semibold">Dr. Tarannum Sayyed</p>
                        <button className="w-full bg-blue-600 text-[10px] py-1.5 rounded-lg font-bold">Book Now</button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'appointments' && (
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-slate-300 text-center">My Appointments</p>
                      <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-left">
                        <span className="text-[9px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded-full font-bold">UPCOMING HOME VISIT</span>
                        <p className="text-[11px] font-bold text-white">Dr. Tarannum Sayyed</p>
                        <p className="text-[10px] text-slate-400">Today • 03:00 PM</p>
                        <button className="w-full bg-teal-600 text-[10px] py-1.5 rounded-lg font-bold">View Details</button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'profile' && (
                    <div className="space-y-3 text-center pt-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600 mx-auto flex items-center justify-center text-white font-bold text-sm">
                        AK
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-white">Aditya Kumar</p>
                        <p className="text-[10px] text-slate-400">aditya@example.com</p>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl text-[10px] font-semibold text-slate-300">
                        2 Completed Sessions
                      </div>
                    </div>
                  )}

                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div className="p-2 bg-slate-900 border-t border-slate-800 grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 ${
                      activeTab === 'home' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('appointments')}
                    className={`py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 ${
                      activeTab === 'appointments' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Appts</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 ${
                      activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Account</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
