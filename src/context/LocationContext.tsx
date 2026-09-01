import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { Doctor } from '../types';

const NAGPUR = 'Nagpur';

interface MasterLocations {
  areas: string[];
  cities: { name: string; areas: string[] }[];
  panIndia: string;
}

interface LocationContextValue {
  cities: string[];
  areaByCity: Record<string, string[]>;
  /** Areas of the currently selected city (empty when the city has none). */
  areas: string[];
  city: string;
  setCity: (city: string) => void;
  /** '' = all areas of the selected city. */
  area: string;
  setArea: (area: string) => void;
  panIndia: string;
  /** True when the doctor serves the selected area for home visits, or none is selected. */
  doctorServesHome: (doctor: Doctor) => boolean;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const doctorAreas = (doctor: Doctor): string[] =>
  [doctor.location?.area, ...(doctor.locations ?? []).map((l) => l?.area)]
    .filter((a): a is string => Boolean(a))
    .map((a) => a.toLowerCase());

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [areaByCity, setAreaByCity] = useState<Record<string, string[]>>({ [NAGPUR]: [] });
  const [panIndia, setPanIndia] = useState('Pan-India');
  const [city, setCityState] = useState<string>(
    () => localStorage.getItem('physio.city') || NAGPUR,
  );
  const [area, setAreaState] = useState<string>(
    () => localStorage.getItem('physio.area') || '',
  );

  useEffect(() => {
    let alive = true;
    api
      .get<MasterLocations>('/doctors/locations/master')
      .then((res) => {
        if (!alive) return;
        const map: Record<string, string[]> = {};
        for (const c of res.cities) map[c.name] = c.areas;
        setAreaByCity(map);
        setPanIndia(res.panIndia);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setCity = (c: string) => {
    setCityState(c);
    try {
      localStorage.setItem('physio.city', c);
    } catch {
      /* ignore storage errors */
    }
  };

  const setArea = (a: string) => {
    setAreaState(a);
    try {
      localStorage.setItem('physio.area', a);
    } catch {
      /* ignore storage errors */
    }
  };

  const value = useMemo<LocationContextValue>(() => {
    const cities = Object.keys(areaByCity).length ? Object.keys(areaByCity) : [NAGPUR];
    const doctorServesHome = (doctor: Doctor) => {
      if (!area) return true;
      return doctorAreas(doctor).includes(area.toLowerCase());
    };
    return {
      cities,
      areaByCity,
      areas: areaByCity[city] ?? [],
      city,
      setCity,
      area,
      setArea,
      panIndia,
      doctorServesHome,
    };
  }, [areaByCity, city, area, panIndia]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
}
