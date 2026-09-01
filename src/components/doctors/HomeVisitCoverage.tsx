import React from 'react';
import { Globe, Home, MapPin, XCircle } from 'lucide-react';
import { Doctor } from '../../types';
import { useLocationContext } from '../../context/LocationContext';

interface HomeVisitCoverageProps {
  doctor: Doctor;
}

export const HomeVisitCoverage: React.FC<HomeVisitCoverageProps> = ({ doctor }) => {
  const { area, panIndia, doctorServesHome } = useLocationContext();

  const servedAreas = (doctor.locations ?? [])
    .filter((l) => l.active)
    .map((l) => l.area)
    .filter((a): a is string => Boolean(a));

  const hasHome = doctor.fees.home > 0;
  const hasOnline = doctor.fees.online > 0;
  const servesSelected = doctorServesHome(doctor);
  const showNotAvailable = hasHome && !servesSelected;

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-teal-500" /> Home Visit Coverage
      </h3>

      {hasHome ? (
        servedAreas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {servedAreas.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-xs font-bold text-teal-700"
              >
                <Home className="w-3 h-3" /> {area}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Not available for home visits.</p>
        )
      ) : (
        <p className="text-xs text-slate-500">No home visits offered.</p>
      )}

      {hasOnline && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          Online ({panIndia}) — available anywhere in India
        </div>
      )}

      {showNotAvailable && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          Not available for home visits in {area}
        </div>
      )}
    </div>
  );
};
