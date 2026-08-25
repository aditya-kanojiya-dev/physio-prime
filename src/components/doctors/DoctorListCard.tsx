import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, Calendar, Share2, Check, Home, Video } from 'lucide-react';
import primeBadge from '../../assets/prime-badge.png';

export interface DoctorListCardProps {
  name: string;
  photoUrl?: string;
  specialty: string;
  verified?: boolean;
  featured?: boolean;
  experienceYears: number;
  availabilityDate?: string | null;
  sessionFee: number;
  visitTypes: string[];
  locationTags: string[];
  profileUrl?: string;
  onBookHomeVisit?: () => void;
  onBookOnline?: () => void;
  shareUrl?: string;
}

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export const DoctorListCard: React.FC<DoctorListCardProps> = ({
  name,
  photoUrl,
  specialty,
  verified,
  featured,
  experienceYears,
  availabilityDate,
  sessionFee,
  visitTypes,
  locationTags,
  profileUrl,
  onBookHomeVisit,
  onBookOnline,
  shareUrl,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const hasHome = visitTypes.includes('home');
  const hasOnline = visitTypes.includes('online');
  const visitLabel = hasHome && hasOnline
    ? 'Home & online visits'
    : hasHome
      ? 'Home visits'
      : hasOnline
        ? 'Online consultations'
        : '';

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 p-4 sm:p-5"
    >
      {/* Info left · fee right */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-[70px] h-[70px] rounded-full object-cover ring-1 ring-slate-200 shrink-0"
            />
          ) : (
            <div className="w-[70px] h-[70px] rounded-full bg-blue-50 text-blue-600 ring-1 ring-slate-200 shrink-0 flex items-center justify-center text-lg font-extrabold">
              {initialsOf(name)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                onClick={() => profileUrl && navigate(profileUrl)}
                className="text-base sm:text-lg font-bold text-slate-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
              >
                {name}
              </h3>
              {verified && (
                <BadgeCheck className="w-[18px] h-[18px] text-blue-600 fill-blue-100 shrink-0" />
              )}
              {featured && (
                <img src={primeBadge} alt="Prime" className="h-5 w-auto shrink-0" />
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">{specialty}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {experienceYears}+ years experience
            </p>
            {availabilityDate && (
              <p className="text-xs text-emerald-600 flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Available · <strong className="font-bold">{availabilityDate}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="md:text-right shrink-0">
          <p className="text-[11px] text-slate-400 font-medium">Session fee</p>
          <p className="leading-tight mt-0.5">
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              ₹{sessionFee.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400"> /session</span>
          </p>
          {visitLabel && (
            <p className="text-xs font-medium text-emerald-600 mt-0.5">{visitLabel}</p>
          )}
        </div>
      </div>

      {/* Divider between info zone and tags/actions zone */}
      <div className="border-t border-slate-100 mt-4 pt-3" />

      {/* Tags left · actions right */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {locationTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-[11px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end items-stretch sm:items-center gap-2">
          <button
            onClick={() => profileUrl && navigate(profileUrl)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            View profile
          </button>
          {hasHome && onBookHomeVisit && (
            <button
              onClick={onBookHomeVisit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Home className="w-3.5 h-3.5" />
              Book home visit
            </button>
          )}
          {hasOnline && onBookOnline && (
            <button
              onClick={onBookOnline}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Video className="w-3.5 h-3.5" />
              Book online
            </button>
          )}
          <button
            onClick={handleShare}
            aria-label="Share profile"
            className="w-full sm:w-9 h-9 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
