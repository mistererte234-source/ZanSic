import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { computePrayerTimes } from '../lib/prayTimes.js';
import { buildCalendar } from '../lib/calendar.js';

export const CITIES = [
  { id: 'jakarta', name: 'Jakarta', lat: -6.2088, lng: 106.8456, tz: 7 },
  { id: 'bandung', name: 'Bandung', lat: -6.9175, lng: 107.6191, tz: 7 },
  { id: 'semarang', name: 'Semarang', lat: -6.9667, lng: 110.4167, tz: 7 },
  { id: 'yogyakarta', name: 'Yogyakarta', lat: -7.7956, lng: 110.3695, tz: 7 },
  { id: 'solo', name: 'Surakarta', lat: -7.5755, lng: 110.8243, tz: 7 },
  { id: 'surabaya', name: 'Surabaya', lat: -7.2575, lng: 112.7521, tz: 7 },
  { id: 'malang', name: 'Malang', lat: -7.9666, lng: 112.6326, tz: 7 },
  { id: 'medan', name: 'Medan', lat: 3.5952, lng: 98.6722, tz: 7 },
  { id: 'palembang', name: 'Palembang', lat: -2.9761, lng: 104.7754, tz: 7 },
  { id: 'pontianak', name: 'Pontianak', lat: -0.0263, lng: 109.3425, tz: 7 },
  { id: 'denpasar', name: 'Denpasar', lat: -8.6705, lng: 115.2126, tz: 8 },
  { id: 'makassar', name: 'Makassar', lat: -5.1477, lng: 119.4327, tz: 8 },
  { id: 'balikpapan', name: 'Balikpapan', lat: -1.2379, lng: 116.8529, tz: 8 },
  { id: 'jayapura', name: 'Jayapura', lat: -2.5337, lng: 140.7181, tz: 9 },
];

const TZ_LABEL = { 7: 'WIB', 8: 'WITA', 9: 'WIT' };
export const PRAYER_KEYS = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
export const LABELS = {
  imsak: 'Imsak', subuh: 'Subuh', terbit: 'Terbit', dhuha: 'Dhuha',
  dzuhur: 'Dzuhur', ashar: 'Ashar', maghrib: 'Maghrib', isya: 'Isya',
};

const ZanTimeContext = createContext(null);

const load = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export function ZanTimeProvider({ children }) {
  const [location, setLocation] = useState(() => load('zansic_location', CITIES[0]));
  const [hijriOffset, setHijriOffset] = useState(() => load('zansic_hijri_offset', 0));
  const [pauseOnAdzan, setPauseOnAdzan] = useState(() => load('zansic_pause_adzan', false));
  const [now, setNow] = useState(Date.now());
  const [adzanAlert, setAdzanAlert] = useState(null);
  const firedRef = useRef('');

  useEffect(() => localStorage.setItem('zansic_location', JSON.stringify(location)), [location]);
  useEffect(() => localStorage.setItem('zansic_hijri_offset', JSON.stringify(hijriOffset)), [hijriOffset]);
  useEffect(() => localStorage.setItem('zansic_pause_adzan', JSON.stringify(pauseOnAdzan)), [pauseOnAdzan]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const useGps = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation tidak didukung'));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const tz = Math.round(-new Date().getTimezoneOffset() / 60);
          const loc = {
            id: 'gps',
            name: 'Lokasi Saya',
            lat: +pos.coords.latitude.toFixed(4),
            lng: +pos.coords.longitude.toFixed(4),
            tz,
          };
          setLocation(loc);
          resolve(loc);
        },
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });

  const data = useMemo(() => {
    const { lat, lng, tz } = location;
    // Waktu lokal di zona lokasi
    const local = new Date(now + tz * 3600e3);
    const y = local.getUTCFullYear();
    const m = local.getUTCMonth() + 1;
    const d = local.getUTCDate();
    const weekday = local.getUTCDay();
    const secOfDay = local.getUTCHours() * 3600 + local.getUTCMinutes() * 60 + local.getUTCSeconds();

    const times = computePrayerTimes(y, m, d, lat, lng, tz);
    const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
    const timesTomorrow = computePrayerTimes(
      tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate(), lat, lng, tz
    );

    // Shalat berikutnya
    let next = null;
    let current = null;
    for (const k of PRAYER_KEYS) {
      const sec = Math.round(times[k]) * 60;
      if (sec > secOfDay) {
        next = { key: k, secLeft: sec - secOfDay, minute: times[k] };
        break;
      }
      current = k;
    }
    if (!next) {
      const sec = Math.round(timesTomorrow.subuh) * 60 + 86400;
      next = { key: 'subuh', secLeft: sec - secOfDay, minute: timesTomorrow.subuh, tomorrow: true };
      current = 'isya';
    }
    if (!current) current = 'isya'; // sebelum subuh masih waktu isya
    const isFriday = weekday === 5;

    const afterMaghrib = secOfDay >= Math.round(times.maghrib) * 60;
    const cal = buildCalendar(y, m, d, weekday, afterMaghrib, hijriOffset);

    return {
      times,
      next,
      current,
      isFriday,
      cal,
      clock: `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`,
      seconds: String(local.getUTCSeconds()).padStart(2, '0'),
      tzLabel: TZ_LABEL[tz] || `UTC${tz >= 0 ? '+' : ''}${tz}`,
      secOfDay,
    };
  }, [now, location, hijriOffset]);

  // Pemicu saat masuk waktu shalat
  useEffect(() => {
    for (const k of PRAYER_KEYS) {
      const sec = Math.round(data.times[k]) * 60;
      const diff = data.secOfDay - sec;
      const tag = `${data.cal.masehi}-${k}`;
      if (diff >= 0 && diff < 5 && firedRef.current !== tag) {
        firedRef.current = tag;
        setAdzanAlert({ key: k, at: Date.now() });
      }
    }
  }, [data]);

  const labelFor = (k) => (k === 'dzuhur' && data.isFriday ? "Jum'at" : LABELS[k]);

  return (
    <ZanTimeContext.Provider
      value={{
        ...data,
        location,
        setLocation,
        useGps,
        hijriOffset,
        setHijriOffset,
        pauseOnAdzan,
        setPauseOnAdzan,
        adzanAlert,
        dismissAdzan: () => setAdzanAlert(null),
        labelFor,
      }}
    >
      {children}
    </ZanTimeContext.Provider>
  );
}

export const useZanTime = () => useContext(ZanTimeContext);

export const fmtCountdown = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}j ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};
