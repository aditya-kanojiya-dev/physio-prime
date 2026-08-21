import React, { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Star,
  Users,
  Wallet,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  SearchX,
  ShieldCheck,
} from 'lucide-react';
import { useDoctors, useCategories, useSymptoms } from '../hooks/queries';
import { ConsultationMode, Doctor } from '../types';
import { DoctorListCard } from '../components/doctors/DoctorListCard';
import { conditionsForCategory } from '../data/conditions';

// same fuzzy match the Find Therapists page uses for category filtering
function matchesCategory(doc: Doctor, title: string): boolean {
  const hay = [doc.specialty, ...doc.expertise, ...doc.treatments, doc.bio].join(' ').toLowerCase();
  const t = title.toLowerCase();
  if (hay.includes(t)) return true;
  return t.split(' ').filter((w) => w.length > 3).some((term) => hay.includes(term));
}

export const CategoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const { data: symptoms = [] } = useSymptoms();

  const category = categories.find((c) => c.slug === slug);
  const linkedConditions = useMemo(
    () => (slug ? conditionsForCategory(slug, symptoms) : []),
    [slug, symptoms]
  );

  // SEO title per category
  useEffect(() => {
    if (category) document.title = `${category.title} Specialists in Nagpur | PhysioPrime`;
    return () => { document.title = 'PhysioPrime'; };
  }, [category]);

  // filters
  const [cityInput, setCityInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<ConsultationMode | 'all'>('all');
  const [showAllConditions, setShowAllConditions] = useState(false);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'rating-high' | 'experience'>('recommended');

  const categoryDoctors = useMemo(
    () => (category ? doctors.filter((d) => matchesCategory(d, category.title)) : []),
    [doctors, category]
  );

  const filteredDoctors = useMemo(() => {
    return categoryDoctors.filter((doc) => {
      if (cityInput.trim() && !doc.location.city.toLowerCase().includes(cityInput.trim().toLowerCase())) return false;
      if (selectedMode === 'home' && !(doc.fees.home > 0)) return false;
      if (selectedMode === 'online' && !(doc.fees.online > 0)) return false;
      if (doc.fees.home > maxPrice && doc.fees.online > maxPrice) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.fees.home - b.fees.home;
      if (sortBy === 'rating-high') return b.rating - a.rating;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      return 0;
    });
  }, [categoryDoctors, cityInput, selectedMode, maxPrice, sortBy]);

  const stats = useMemo(() => ({
    count: categoryDoctors.length || category?.doctorCount || 0,
    avgRating: categoryDoctors.length
      ? (categoryDoctors.reduce((s, d) => s + d.rating, 0) / categoryDoctors.length).toFixed(1)
      : '—',
    startingFee: categoryDoctors.length ? Math.min(...categoryDoctors.map((d) => Math.min(d.fees.home, d.fees.online) || d.fees.home || d.fees.online)) : 0,
  }), [categoryDoctors, category]);

  const related = categories.filter((c) => c.slug !== slug).slice(0, 4);

  if (categoriesLoading) {
    return (
      <div className="pt-28 pb-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="pt-28 pb-20 min-h-screen text-center">
        <p className="text-slate-500 mb-4">Category not found.</p>
        <Link to="/categories" className="text-blue-600 font-bold hover:underline">Browse all categories</Link>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6" aria-label="Breadcrumb">
          <Link to="/categories" className="hover:text-blue-600 transition-colors">Categories</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">{category.title}</span>
        </nav>

        {/* Category header */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start mb-10">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {category.title}
            </h1>
            <p className="text-slate-600 text-base leading-relaxed mt-4 max-w-2xl">{category.description}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {category.conditions.map((cond) => (
                <span key={cond} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold">
                  {cond}
                </span>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 lg:sticky lg:top-24">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">At a glance</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 leading-none">{stats.count}</p>
                <p className="text-[11px] text-slate-400 font-medium">specialists available</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 leading-none">{stats.avgRating}</p>
                <p className="text-[11px] text-slate-400 font-medium">average rating</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 leading-none">
                  {stats.startingFee ? `₹${stats.startingFee.toLocaleString('en-IN')}` : '—'}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">starting session fee</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" /> All specialists verified
            </p>
          </div>
        </div>

        {/* Linked condition guides */}
        {linkedConditions.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Conditions we treat
              </h2>
              <Link
                to="/conditions"
                className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-teal-600 transition-colors"
              >
                All conditions <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {(showAllConditions ? linkedConditions : linkedConditions.slice(0, 5)).map((cond) => (
                <Link
                  key={cond.slug}
                  to={`/conditions/${cond.slug}`}
                  className="inline-flex items-center gap-1.5 bg-white rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:bg-teal-50/40 hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  {cond.name}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>
              ))}
              {linkedConditions.length > 5 && (
                <button
                  onClick={() => setShowAllConditions(!showAllConditions)}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {showAllConditions ? 'See less' : `+${linkedConditions.length - 5} more`}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllConditions ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </section>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 flex-wrap">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            Filters
          </span>

          {/* Location */}
          <div className="relative flex-1 min-w-[160px]">
            <MapPin className="w-4 h-4 text-teal-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="City"
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Visit type */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold shrink-0">
            {([
              ['all', 'All'],
              ['home', 'Home'],
              ['online', 'Video'],
            ] as [ConsultationMode | 'all', string][]).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Max fee */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
            <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
            <input
              type="range"
              min="400"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-28 accent-blue-600 cursor-pointer"
              aria-label="Max consultation fee"
            />
            <span className="text-xs font-extrabold text-slate-900 tabular-nums w-14 text-right">
              ₹{maxPrice.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Sort */}
          <div className="relative shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none bg-blue-50 border border-blue-200 rounded-xl pl-9 pr-9 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price Low</option>
              <option value="rating-high">Top Rated</option>
              <option value="experience">Most Experienced</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Specialist list */}
        {doctorsLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-20 flex items-center justify-center gap-3 text-sm font-medium text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading specialists...
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">{filteredDoctors.length}</span>{' '}
              specialists in <span className="font-bold text-slate-900">{cityInput.trim() || 'all cities'}</span>
            </p>
            {filteredDoctors.map((doctor) => {
              const areas = [
                ...new Set([
                  doctor.location.area,
                  ...(doctor.locations ?? []).map((l) => l.area).filter(Boolean),
                ]),
              ].filter(Boolean).slice(0, 4);
              const visitTypes = [
                ...(doctor.fees.home > 0 ? ['home'] : []),
                ...(doctor.fees.online > 0 ? ['online'] : []),
              ];
              return (
                <DoctorListCard
                  key={doctor.id}
                  name={doctor.name}
                  photoUrl={doctor.photo}
                  specialty={doctor.specialty}
                  verified={doctor.verified}
                  experienceYears={doctor.experienceYears}
                  availabilityDate={doctor.nextAvailable}
                  sessionFee={doctor.fees.home}
                  visitTypes={visitTypes}
                  locationTags={areas}
                  profileUrl={`/doctor/${doctor.id}`}
                  onBookHomeVisit={() => navigate('/book', { state: { doctor, mode: 'home' } })}
                  onBookOnline={() => navigate('/book', { state: { doctor, mode: 'online' } })}
                  shareUrl={`${window.location.origin}/doctor/${doctor.id}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-16 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <SearchX className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1.5">No specialists match right now</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
              Try widening your filters, or check back soon — new verified specialists join every week.
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full btn-gradient text-white text-sm font-bold shadow-md"
            >
              Browse other categories
            </Link>
          </div>
        )}

        {/* Related categories */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-5">
              You might also be interested in
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden h-32 border border-slate-200 hover:border-teal-300 hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <img src={cat.image} alt={cat.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-sm font-extrabold text-white leading-tight">{cat.title}</p>
                    <p className="text-[10px] text-slate-300 font-medium mt-0.5">{cat.doctorCount} doctors</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
