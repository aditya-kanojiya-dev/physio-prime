import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake, Phone, Mail, MapPin, Send, CheckCircle2, Loader2 } from 'lucide-react';

export const CaretakerSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState('Caretaker');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/caretaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ''),
          serviceType,
          message: message.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? 'Submission failed');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-8 lg:py-12 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — pitch + contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 shadow-sm">
              <HeartHandshake className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-teal-700">Need a Caretaker?</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Compassionate Care <span className="text-gradient">At Home</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
              Looking for a trained caretaker for yourself or a loved one? Share your details and our team will contact you to arrange personalized care at home.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a href="tel:+918055541478" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 transition-all duration-200">
                <Phone className="w-3.5 h-3.5 text-teal-500" />
                +91 80555 41478
              </a>
              <a href="mailto:care@physio-prime.in" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 transition-all duration-200">
                <Mail className="w-3.5 h-3.5 text-teal-500" />
                care@physio-prime.in
              </a>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                Nagpur, MH
              </span>
            </div>
          </motion.div>

          {/* Right — form card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8"
          >
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-teal-500 mx-auto" />
                <h3 className="text-xl font-extrabold text-slate-900">Request Received</h3>
                <p className="text-slate-600">Thank you! Our care team will call you back shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-lg font-extrabold text-slate-900">Get a Call Back</h3>

                <div>
                  <label htmlFor="caretaker-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="caretaker-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="caretaker-service" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Service You Need
                  </label>
                  <select
                    id="caretaker-service"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="Caretaker">Caretaker</option>
                    <option value="Occupational Therapist">Occupational Therapist</option>
                    <option value="Speech Therapist">Speech Therapist</option>
                    <option value="Nursing Care">Nursing Care</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="caretaker-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="caretaker-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="caretaker-message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Message <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="caretaker-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us briefly about the care you need"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none"
                  />
                </div>

                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  )}
                  <span>{loading ? 'Submitting...' : 'Request Call Back'}</span>
                </button>
              </form>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
};