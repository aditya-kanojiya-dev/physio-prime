import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar, 
  FileText, 
  Upload, 
  CheckCircle,
  ArrowRight,
  Award,
  Building,
  Stethoscope,
  Users,
  Sparkles
} from 'lucide-react';

interface CareerFormData {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  specialization: string[];
  qualification: string;
  experience: string;
  currentOrganization: string;
  certifications: string;
  resume: File | null;
  coverLetter: string;
  joiningDate: string;
  consent: boolean;
}

export const Career: React.FC = () => {
  const [formData, setFormData] = useState<CareerFormData>({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    specialization: [],
    qualification: '',
    experience: '',
    currentOrganization: '',
    certifications: '',
    resume: null,
    coverLetter: '',
    joiningDate: '',
    consent: false
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const positions = [
    'Physiotherapist',
    'Senior Physiotherapist',
    'Physiotherapy Intern',
    'Rehabilitation Therapist',
    'Sports Physiotherapist',
    'Pediatric Physiotherapist',
    'Other'
  ];

  const specializations = [
    'Orthopedic Physiotherapy',
    'Neurological Rehabilitation',
    'Cardio-Pulmonary Therapy',
    'Sports Injury & Performance',
    "Women's Health Physiotherapy",
    'Pediatric Physiotherapy',
    'Geriatric Rehabilitation',
    'Hand & Micro-Rehabilitation',
    'Psychosomatic & Ergonomic Care'
  ];

  const qualifications = [
    'BPT (Bachelor of Physiotherapy)',
    'MPT (Master of Physiotherapy)',
    'Diploma in Physiotherapy',
    'Certification Course',
    'Other'
  ];

  const experienceOptions = [
    'Fresher',
    '0–1 Year',
    '1–3 Years',
    '3–5 Years',
    '5+ Years'
  ];

  const joiningOptions = [
    'Immediately',
    'Within 15 Days',
    'Within 30 Days',
    '1–3 Months',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecializationChange = (spec: string) => {
    setFormData(prev => {
      const updated = prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec];
      return { ...prev, specialization: updated };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, resume: file }));
      setFileName(file.name);
    }
  };

  // ponytail: simulated submit, no backend yet — wire to API when careers endpoint exists
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          position: '',
          specialization: [],
          qualification: '',
          experience: '',
          currentOrganization: '',
          certifications: '',
          resume: null,
          coverLetter: '',
          joiningDate: '',
          consent: false
        });
        setFileName('');
      }, 3000);
    }, 1500);
  };

  return (
    <section className="py-20 bg-slate-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto space-y-4 mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Join Our Team</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Physiotherapy Career <span className="text-gradient">Application</span>
          </h2>
          <p className="text-slate-600 text-base">
            Take the next step in your physiotherapy career. Join India's leading physiotherapy network and make a difference in patients' lives.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
        >
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your complete name"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-slate-400">Candidate's complete name.</p>
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400">For interview and application communication.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    Phone / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Primary contact number.</p>
                </div>
              </div>

              {/* Position Applying For */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                  Position Applying For <span className="text-rose-500">*</span>
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                >
                  <option value="">Select position</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* Area of Specialization */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                  Area of Specialization <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {specializations.map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSpecializationChange(spec)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                        formData.specialization.includes(spec)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">Select all that apply.</p>
              </div>

              {/* Qualification & Experience Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    Highest Qualification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="">Select qualification</option>
                    {qualifications.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Years of Experience <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="">Select experience</option>
                    {experienceOptions.map(exp => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Current Organization */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                  Current / Previous Organization
                </label>
                <input
                  type="text"
                  name="currentOrganization"
                  value={formData.currentOrganization}
                  onChange={handleInputChange}
                  placeholder="Hospital, clinic, rehabilitation center, sports facility, etc."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              {/* Professional Certifications */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-500" />
                  Professional Certifications
                </label>
                <input
                  type="text"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleInputChange}
                  placeholder="Dry Needling, Manual Therapy, Sports Rehabilitation, Neuro Rehabilitation, etc."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-slate-400">List your professional certifications and specializations.</p>
              </div>

              {/* Resume Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-500" />
                  Resume / CV Upload <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 flex items-center justify-between">
                    <span className="text-slate-500">
                      {fileName || 'Choose file (PDF/DOC/DOCX)'}
                    </span>
                    <span className="text-blue-600 font-bold text-xs">Browse</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Upload your resume in PDF, DOC, or DOCX format.</p>
              </div>

              {/* Cover Letter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  Cover Letter / Additional Information
                </label>
                <textarea
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Explain your experience, interests, or why you want to join PhysioPrime..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Joining Date & Consent */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Preferred Joining Date <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="">Select joining preference</option>
                    {joiningOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={formData.consent}
                    onChange={(e) => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
                    required
                    className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed">
                    I confirm that the information provided is accurate and I consent to PhysioPrime 
                    contacting me regarding my application. <span className="text-rose-500">*</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !formData.consent}
                className="w-full btn-gradient text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          ) : (
            // Success State
            <div className="p-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Application Submitted!</h3>
                <p className="text-slate-500 text-sm mt-2">
                  Thank you for applying to PhysioPrime. Our HR team will review your application and get back to you within 48 hours.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>You'll receive a confirmation email shortly.</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Growth Opportunities</h4>
            <p className="text-xs text-slate-500 mt-1">Continuous learning and career advancement</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Expert Team</h4>
            <p className="text-xs text-slate-500 mt-1">Work with India's top physiotherapists</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Modern Facilities</h4>
            <p className="text-xs text-slate-500 mt-1">State-of-the-art equipment and technology</p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
