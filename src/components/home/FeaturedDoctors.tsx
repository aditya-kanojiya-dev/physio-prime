import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDoctors } from '../../hooks/queries';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { DoctorCard } from '../doctors/DoctorCard';

export const FeaturedDoctors: React.FC = () => {
  const { data: doctors = [], isLoading } = useDoctors();
  const navigate = useNavigate();
  const marqueeRef = useRef<HTMLDivElement>(null);

  const pauseMarquee = () => {
    if (marqueeRef.current) marqueeRef.current.style.animationPlayState = 'paused';
  };
  const resumeMarquee = () => {
    if (marqueeRef.current) marqueeRef.current.style.animationPlayState = 'running';
  };

  return (
    <section className="py-10 lg:py-14 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span>Certified Healthcare Specialists</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Top Prime <span className="text-gradient">Physiotherapists</span>
            </h2>
            <p className="text-slate-600 text-base max-w-xl">
              Hand-picked certified physical therapists available for home visits and HD video consultations today.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link to="/doctors" className="px-5 py-2.5 rounded-xl font-bold text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading therapists...
          </div>
        ) : (
          <>
            {/* Infinite auto-slider — responsive: 1 card mobile, 3 desktop */}
            <div className="-mx-4 sm:-mx-6 md:mx-0 overflow-hidden">
              <div
                ref={marqueeRef}
                onTouchStart={pauseMarquee}
                onTouchEnd={resumeMarquee}
                onTouchCancel={resumeMarquee}
                className="flex gap-4 md:gap-5 animate-marquee px-4 sm:px-6 md:px-0"
                style={{ width: 'max-content' }}
              >
                {[...doctors, ...doctors].map((doctor, i) => (
                  <div
                    key={`${doctor.id}-${i}`}
                    className="shrink-0 w-[85vw] md:w-[calc((min(100vw,80rem)-2rem-2.5rem)/3)]"
                  >
                    <DoctorCard
                      name={doctor.name}
                      specialty={doctor.specialty}
                      location={`${doctor.location.area}, ${doctor.location.city}`}
                      photoUrl={doctor.photo}
                      rating={doctor.rating}
                      reviewCount={doctor.reviewCount}
                      verified={doctor.verified}
                      featured={doctor.featured}
                      experienceYears={doctor.experienceYears}
                      consultationFee={doctor.fees.home}
                      nextAvailableDate={doctor.nextAvailable}
                      profileUrl={`/doctor/${doctor.id}`}
                      onBookNow={() => navigate('/book', { state: { doctor, mode: 'home' } })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee ${doctors.length * 4}s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};
