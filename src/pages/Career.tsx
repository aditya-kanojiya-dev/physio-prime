import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { email, file, hasErrors, phone10, required, type Errors } from '../lib/validate';

type CareerErrors = Errors<
  | 'fullName'
  | 'email'
  | 'phone'
  | 'position'
  | 'specialization'
  | 'qualification'
  | 'experience'
  | 'resume'
  | 'supportingDocType'
  | 'supportingDoc'
  | 'photo'
  | 'doctorCertificate'
  | 'joiningDate'
  | 'consent'
>;
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
  supportingDocType: string;
  supportingDoc: File | null;
  photo: File | null;
  doctorCertificate: File | null;
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
    consent: false,
    supportingDocType: '',
    supportingDoc: null,
    photo: null,
    doctorCertificate: null,
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [supportingFileName, setSupportingFileName] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [certificateFileName, setCertificateFileName] = useState('');
  const [errors, setErrors] = useState<CareerErrors>({});
  const [submitError, setSubmitError] = useState('');

  const resetForm = () => {
    setFormData({
      fullName: '', email: '', phone: '', position: '', specialization: [],
      qualification: '', experience: '', currentOrganization: '',
      certifications: '', resume: null, coverLetter: '', joiningDate: '',
      consent: false, supportingDocType: '', supportingDoc: null,
      photo: null, doctorCertificate: null,
    });
    setFileName(''); setSupportingFileName(''); setPhotoFileName(''); setCertificateFileName('');
    setIsSubmitted(false); setErrors({}); setSubmitError('');
  };

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

  const documentTypes = [
    'Aadhaar Card',
    'PAN Card',
    'Passport',
    'Voter ID',
    'Driving License',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError(name as keyof CareerErrors);
  };

  const clearError = (key: keyof CareerErrors) =>
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const handleSpecializationChange = (spec: string) => {
    setFormData(prev => {
      const updated = prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec];
      return { ...prev, specialization: updated };
    });
    clearError('specialization');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, resume: file }));
      setFileName(file.name);
      clearError('resume');
    }
  };

  const handleSupportingDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, supportingDoc: file }));
      setSupportingFileName(file.name);
      clearError('supportingDoc');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      setPhotoFileName(file.name);
      clearError('photo');
    }
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, doctorCertificate: file }));
      setCertificateFileName(file.name);
      clearError('doctorCertificate');
    }
  };

  // ponytail: client-side upload to Supabase "media" bucket, same path as admin ImageUpload
  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `careers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  // wired to POST /api/v1/careers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const f = formData;
    const next: CareerErrors = {
      fullName: required(f.fullName, 'Full name'),
      email: email(f.email),
      phone: phone10(f.phone),
      position: required(f.position, 'Position'),
      specialization: f.specialization.length ? undefined : 'Select at least one specialization',
      qualification: required(f.qualification, 'Qualification'),
      experience: required(f.experience, 'Years of experience'),
      resume: file(f.resume, { label: 'Resume', types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], maxMb: 10 }),
      supportingDocType: required(f.supportingDocType, 'Document type'),
      supportingDoc: file(f.supportingDoc, { label: 'Supporting document', types: ['application/pdf', 'image/jpeg', 'image/png'], maxMb: 10 }),
      photo: file(f.photo, { label: 'Photo', types: ['image/jpeg', 'image/png', 'image/webp'], maxMb: 10 }),
      doctorCertificate: file(f.doctorCertificate, { label: 'Doctor certificate', types: ['application/pdf', 'image/jpeg', 'image/png'], maxMb: 10 }),
      joiningDate: required(f.joiningDate, 'Joining preference'),
      consent: f.consent ? undefined : 'Consent is required',
    };
    setErrors(next);
    if (hasErrors(next)) return;

    setIsLoading(true);
    try {
      const [resumeUrl, supportingDocUrl, photoUrl, doctorCertificateUrl] = await Promise.all([
        uploadFile(formData.resume!),
        uploadFile(formData.supportingDoc!),
        uploadFile(formData.photo!),
        uploadFile(formData.doctorCertificate!),
      ]);

      const res = await fetch('/api/v1/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          position: formData.position,
          specialization: formData.specialization,
          qualification: formData.qualification,
          experience: formData.experience,
          currentOrganization: formData.currentOrganization,
          certifications: formData.certifications,
          coverLetter: formData.coverLetter,
          joiningDate: formData.joiningDate,
          consent: formData.consent,
          resumeUrl,
          supportingDocType: formData.supportingDocType,
          supportingDocUrl,
          photoUrl,
          doctorCertificateUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? 'Submission failed');
      }

      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
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
          {!isSubmitted && (
            <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">
              
              {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="career-fullName" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="career-fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your complete name"
                    aria-invalid={errors.fullName ? true : undefined}
                    aria-describedby={errors.fullName ? 'career-fullName-error' : undefined}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  {errors.fullName ? (
                    <p id="career-fullName-error" role="alert" className="text-xs font-semibold text-red-600">{errors.fullName}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Candidate's complete name.</p>
                  )}
                </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="career-email" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="career-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? 'career-email-error' : undefined}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  {errors.email ? (
                    <p id="career-email-error" role="alert" className="text-xs font-semibold text-red-600">{errors.email}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">For interview and application communication.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="career-phone" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    Phone / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="career-phone"
                    type="tel"
                    inputMode="numeric"
                    name="phone"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    aria-invalid={errors.phone ? true : undefined}
                    aria-describedby={errors.phone ? 'career-phone-error' : undefined}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  {errors.phone ? (
                    <p id="career-phone-error" role="alert" className="text-xs font-semibold text-red-600">{errors.phone}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Primary contact number.</p>
                  )}
                </div>
              </div>

              {/* Position Applying For */}
                <div className="space-y-1.5">
                  <label htmlFor="career-position" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    Position Applying For <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="career-position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    aria-invalid={errors.position ? true : undefined}
                    aria-describedby={errors.position ? 'career-position-error' : undefined}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="">Select position</option>
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  {errors.position && (
                    <p id="career-position-error" role="alert" className="text-xs font-semibold text-red-600">{errors.position}</p>
                  )}
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
                {errors.specialization ? (
                  <p role="alert" className="text-xs font-semibold text-red-600">{errors.specialization}</p>
                ) : (
                  <p className="text-[10px] text-slate-400">Select all that apply.</p>
                )}
              </div>

              {/* Qualification & Experience Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="career-qualification" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    Highest Qualification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="career-qualification"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    aria-invalid={errors.qualification ? true : undefined}
                    aria-describedby={errors.qualification ? 'career-qualification-error' : undefined}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="">Select qualification</option>
                    {qualifications.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  {errors.qualification && (
                    <p id="career-qualification-error" role="alert" className="text-xs font-semibold text-red-600">{errors.qualification}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="career-experience" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Years of Experience <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="career-experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    aria-invalid={errors.experience ? true : undefined}
                    aria-describedby={errors.experience ? 'career-experience-error' : undefined}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="">Select experience</option>
                    {experienceOptions.map(exp => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                  {errors.experience && (
                    <p id="career-experience-error" role="alert" className="text-xs font-semibold text-red-600">{errors.experience}</p>
                  )}
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
                      aria-invalid={errors.resume ? true : undefined}
                      aria-describedby={errors.resume ? 'career-resume-error' : undefined}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 flex items-center justify-between">
                      <span className="text-slate-500">
                        {fileName || 'Choose file (PDF/DOC/DOCX)'}
                      </span>
                      <span className="text-blue-600 font-bold text-xs">Browse</span>
                    </div>
                  </div>
                  {errors.resume ? (
                    <p id="career-resume-error" role="alert" className="text-xs font-semibold text-red-600">{errors.resume}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Upload your resume in PDF, DOC, or DOCX format.</p>
                  )}
                </div>

              {/* Supporting Document (for verification) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  Supporting Document <span className="text-rose-500">*</span>
                </label>
                  <select
                    id="career-supportingDocType"
                    name="supportingDocType"
                    value={formData.supportingDocType}
                    onChange={handleInputChange}
                    aria-invalid={errors.supportingDocType ? true : undefined}
                    aria-describedby={errors.supportingDocType ? 'career-supportingDocType-error' : undefined}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="">Select document type</option>
                    {documentTypes.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                  {errors.supportingDocType && (
                    <p id="career-supportingDocType-error" role="alert" className="text-xs font-semibold text-red-600">{errors.supportingDocType}</p>
                  )}
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleSupportingDocChange}
                      aria-invalid={errors.supportingDoc ? true : undefined}
                      aria-describedby={errors.supportingDoc ? 'career-supportingDoc-error' : undefined}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 flex items-center justify-between">
                      <span className="text-slate-500">
                        {supportingFileName || 'Choose file (PDF/JPG/PNG)'}
                      </span>
                      <span className="text-blue-600 font-bold text-xs">Browse</span>
                    </div>
                  </div>
                  {errors.supportingDoc ? (
                    <p id="career-supportingDoc-error" role="alert" className="text-xs font-semibold text-red-600">{errors.supportingDoc}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Upload a clear copy for identity verification (Aadhaar, PAN, passport, voter ID, driving license).</p>
                  )}
                </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-500" />
                  Photo Upload <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handlePhotoChange}
                      aria-invalid={errors.photo ? true : undefined}
                      aria-describedby={errors.photo ? 'career-photo-error' : undefined}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 flex items-center justify-between">
                      <span className="text-slate-500">
                        {photoFileName || 'Choose photo (JPG/PNG)'}
                      </span>
                      <span className="text-blue-600 font-bold text-xs">Browse</span>
                    </div>
                  </div>
                  {errors.photo ? (
                    <p id="career-photo-error" role="alert" className="text-xs font-semibold text-red-600">{errors.photo}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Upload a recent professional photo.</p>
                  )}
                </div>

              {/* Doctor Certificate Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                  Doctor Certificate <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleCertificateChange}
                      aria-invalid={errors.doctorCertificate ? true : undefined}
                      aria-describedby={errors.doctorCertificate ? 'career-doctorCertificate-error' : undefined}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 flex items-center justify-between">
                      <span className="text-slate-500">
                        {certificateFileName || 'Choose certificate (PDF/JPG/PNG)'}
                      </span>
                      <span className="text-blue-600 font-bold text-xs">Browse</span>
                    </div>
                  </div>
                  {errors.doctorCertificate ? (
                    <p id="career-doctorCertificate-error" role="alert" className="text-xs font-semibold text-red-600">{errors.doctorCertificate}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Upload your physiotherapy degree / registration certificate.</p>
                  )}
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
                  <label htmlFor="career-joiningDate" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Preferred Joining Date <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="career-joiningDate"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    aria-invalid={errors.joiningDate ? true : undefined}
                    aria-describedby={errors.joiningDate ? 'career-joiningDate-error' : undefined}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="">Select joining preference</option>
                    {joiningOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.joiningDate && (
                    <p id="career-joiningDate-error" role="alert" className="text-xs font-semibold text-red-600">{errors.joiningDate}</p>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={formData.consent}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, consent: e.target.checked }));
                      clearError('consent');
                    }}
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={errors.consent ? 'consent-error' : undefined}
                    className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed">
                    I confirm that the information provided is accurate and I consent to PhysioPrime 
                    contacting me regarding my application. <span className="text-rose-500">*</span>
                    {errors.consent && (
                      <span id="consent-error" role="alert" className="block mt-1 font-bold text-red-600">{errors.consent}</span>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              {submitError && (
                <div role="alert" className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  {submitError}
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
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
          )}

          {/* Success Popup */}
          {isSubmitted && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center space-y-5">
                <div className="w-20 h-20 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Application Submitted!</h3>
                  <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                    Your data will only be shared by our representative, and they will contact you shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full btn-gradient text-white py-3 rounded-2xl font-extrabold text-sm shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Done
                </button>
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
