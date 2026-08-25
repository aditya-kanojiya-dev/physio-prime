import React from 'react';
import { Link } from 'react-router-dom';
import { Star, BadgeCheck, MapPin, Clock } from 'lucide-react';
import primeBadge from '../../assets/prime-badge.png';

export interface DoctorCardProps {
  name: string;
  specialty: string;
  location: string;
  photoUrl?: string;
  rating?: number | null;
  reviewCount?: number;
  verified?: boolean;
  featured?: boolean;
  experienceYears: number;
  consultationFee: number;
  nextAvailableDate?: string | null;
  profileUrl?: string;
  onBookNow?: () => void;
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  name,
  specialty,
  location,
  photoUrl,
  rating,
  reviewCount,
  verified,
  featured,
  experienceYears,
  consultationFee,
  nextAvailableDate,
  profileUrl,
  onBookNow,
}) => {
  const fullyBooked = !nextAvailableDate;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors duration-300 overflow-hidden flex flex-col h-full">
      {/* Photo / avatar block */}
      <div className="relative h-[170px] bg-slate-50 flex items-center justify-center shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-50 text-blue-600 ring-4 ring-white shadow-sm flex items-center justify-center text-xl font-extrabold">
            {initialsOf(name)}
          </div>
        )}

        {/* Prime badge — stamp style */}
        {featured && (
          <div className="absolute bottom-2 right-2 drop-shadow-lg z-10">
            <img src={primeBadge} alt="Prime Physiotherapist" className="h-16 w-auto" />
          </div>
        )}
        {/* Rating badge */}
        <div className="absolute top-2.5 left-2.5 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-900 flex items-center gap-1 shadow-sm">
          {rating != null ? (
            <>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{rating}</span>
              {reviewCount != null && reviewCount > 0 && (
                <span className="text-[10px] font-medium text-slate-400">({reviewCount})</span>
              )}
            </>
          ) : (
            <span className="text-slate-500">New</span>
          )}
        </div>

        {/* Verified badge */}
        {verified && (
          <div className="absolute top-2.5 right-2.5 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" />
            Verified doctor
          </div>
        )}
      </div>

      {/* Identity */}
      <div className="px-3.5 pt-3">
        <h3 className="text-[15px] font-bold text-slate-900 truncate">{name}</h3>
        <p className="text-[13px] font-semibold text-blue-600 truncate">{specialty}</p>
        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{location}</span>
        </p>
      </div>

      {/* Stats row */}
      <div className="mx-3.5 mt-2.5 grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
        <div>
          <p className="text-[10px] font-medium text-slate-400">Experience</p>
          <p className="text-[13px] font-extrabold text-slate-900">{experienceYears} years</p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-slate-400">Home consultation</p>
          <p className="text-[13px] font-extrabold text-blue-600">
            ₹{consultationFee.toLocaleString('en-IN')}
            <span className="text-[10px] font-medium text-slate-400"> / session</span>
          </p>
        </div>
      </div>

      {/* Availability strip */}
      <div className="mx-3.5 mt-2.5">
        <div
          className={`w-full px-3 py-1.5 rounded-full border text-[11px] flex items-center gap-1.5 ${
            fullyBooked
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-teal-200 bg-teal-50/60 text-teal-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {fullyBooked ? (
            <span className="font-medium">Fully booked</span>
          ) : (
            <span className="font-medium truncate">
              Next available: <strong className="font-bold">{nextAvailableDate}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="p-3.5 pt-2.5 mt-auto grid grid-cols-2 gap-2">
        {profileUrl ? (
          <Link
            to={profileUrl}
            className="text-center py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold transition-colors"
          >
            View profile
          </Link>
        ) : (
          <button className="py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold transition-colors">
            View profile
          </button>
        )}
        <button
          onClick={onBookNow}
          className="py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-[11px] font-bold transition-all"
        >
          Book now
        </button>
      </div>
    </div>
  );
};
