import React, { useState } from 'react';
import {
  MapPin, LocateFixed, Moon, Sunrise, Sun, CloudSun, Sunset, Clock3, Settings2, Minus, Plus, BellRing,
} from 'lucide-react';
import { useZanTime, CITIES, fmtCountdown } from '../context/ZanTimeContext.jsx';
import { fmtHM } from '../lib/prayTimes.js';

const ROWS = [
  { key: 'imsak', icon: Moon },
  { key: 'subuh', icon: Moon, wajib: true },
  { key: 'terbit', icon: Sunrise },
  { key: 'dhuha', icon: CloudSun },
  { key: 'dzuhur', icon: Sun, wajib: true },
  { key: 'ashar', icon: CloudSun, wajib: true },
  { key: 'maghrib', icon: Sunset, wajib: true },
  { key: 'isya', icon: Moon, wajib: true },
];

export default function PrayerWidget({ compact = false }) {
  const z = useZanTime();
  const [showSettings, setShowSettings] = useState(false);
  const [gpsState, setGpsState] = useState('');

  // Progress menuju shalat berikutnya (dari shalat sebelumnya)
  const prevSec = (() => {
    const order = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
    const idx = order.indexOf(z.next.key);
    // Sebelum Subuh: hitung dari Isya semalam; setelah Isya: dari Isya hari ini
    if (idx === 0) return Math.round(z.times.isya) * 60 - (z.next.tomorrow ? 0 : 86400);
    return Math.round(z.times[order[idx - 1]]) * 60;
  })();
  const targetSec = z.secOfDay + z.next.secLeft;
  const span = Math.max(1, targetSec - prevSec);
  const progress = Math.min(1, Math.max(0, (z.secOfDay - prevSec) / span));

  const R = 44;
  const C = 2 * Math.PI * R;

  const handleGps = async () => {
    setGpsState('loading');
    try {
      await z.useGps();
      setGpsState('');
    } catch {
      setGpsState('error');
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl glass-panel shadow-2xl">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative p-5 sm:p-7 space-y-6">
        {/* ===== Header: Jam + Kalender + Countdown ===== */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Jam & kalender */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tighter tabular-nums leading-none">
                {z.clock}
              </span>
              <span className="text-lg font-bold text-zinc-400 tabular-nums mb-1">{z.seconds}</span>
              <span className="mb-1.5 ml-1 px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold tracking-wider text-zinc-300">
                {z.tzLabel}
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm sm:text-base font-semibold text-white">
                {z.cal.masehi}
                <span className="mx-2 text-zinc-600">•</span>
                <span className="text-amber-300">{z.cal.weton}</span>
              </p>

              <div className="flex flex-wrap gap-2">
                <Chip tone="emerald" label="Hijriah" value={z.cal.hijri} />
                <Chip tone="amber" label="Jawa" value={`${z.cal.jawa} ${z.cal.windu}`} />
                <Chip tone="zinc" label="Neptu" value={z.cal.neptu} />
              </div>

              <p dir="rtl" lang="ar" className="font-arabic text-xl sm:text-2xl text-emerald-200/90 text-right lg:text-left lg:[direction:rtl] leading-relaxed">
                {z.cal.arabic}
              </p>

              {z.cal.malam && (
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  Sudah lewat Maghrib — <span className="text-amber-200 font-semibold">{z.cal.malam}</span>
                  <span className="hidden sm:inline">({z.cal.hariJawa})</span>
                </p>
              )}
            </div>
          </div>

          {/* Countdown ring */}
          <div className="flex items-center gap-4 lg:flex-col lg:gap-2 p-4 rounded-2xl bg-black/20 border border-white/10 lg:w-56">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
                <circle
                  cx="50" cy="50" r={R} fill="none" strokeWidth="7" strokeLinecap="round"
                  stroke="url(#zanRing)" strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="zanRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Clock3 className="w-4 h-4 text-emerald-300 mb-0.5" />
                <span className="text-[11px] font-bold tabular-nums">{fmtHM(z.next.minute)}</span>
              </div>
            </div>
            <div className="lg:text-center">
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">Menuju</p>
              <p className="text-xl font-black text-white">{z.labelFor(z.next.key)}</p>
              <p className="text-2xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-amber-300">
                -{fmtCountdown(z.next.secLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* ===== Grid jadwal ===== */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {ROWS.map(({ key, icon: Icon, wajib }) => {
            const isNext = z.next.key === key && !z.next.tomorrow;
            const isNextTomorrow = z.next.key === key && z.next.tomorrow;
            const isCurrent = z.current === key && wajib;
            return (
              <div
                key={key}
                className={`relative rounded-2xl px-2 py-3 sm:py-4 text-center border transition-all duration-300 ${
                  isNext || isNextTomorrow
                    ? 'bg-gradient-to-b from-emerald-400/25 to-emerald-500/5 border-emerald-300/50 shadow-lg shadow-emerald-500/10 scale-[1.03]'
                    : isCurrent
                    ? 'bg-white/[0.08] border-white/20'
                    : 'bg-white/[0.03] border-white/[0.06]'
                } ${wajib ? '' : 'opacity-80'}`}
              >
                <Icon className={`w-4 h-4 mx-auto mb-1.5 ${isNext || isNextTomorrow ? 'text-emerald-300' : 'text-zinc-400'}`} />
                <p className={`text-[10px] sm:text-xs font-semibold ${wajib ? 'text-zinc-200' : 'text-zinc-400'}`}>
                  {z.labelFor(key)}
                </p>
                <p className="text-sm sm:text-lg font-black tabular-nums tracking-tight">{fmtHM(z.times[key])}</p>
                {isCurrent && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* ===== Lokasi & pengaturan ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
            <span className="truncate">
              {z.location.name} · {z.location.lat.toFixed(2)}, {z.location.lng.toFixed(2)} · Kemenag RI (20°/18°)
            </span>
          </div>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showSettings ? 'bg-white/15 border-white/25 text-white' : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Pengaturan
          </button>
        </div>

        {showSettings && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-black/25 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Kota</label>
              <div className="flex gap-2">
                <select
                  value={z.location.id}
                  onChange={(e) => {
                    const c = CITIES.find((x) => x.id === e.target.value);
                    if (c) z.setLocation(c);
                  }}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                >
                  {z.location.id === 'gps' && <option value="gps">📍 Lokasi Saya</option>}
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900">
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleGps}
                  title="Pakai GPS"
                  className="px-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/30"
                >
                  <LocateFixed className={`w-4 h-4 ${gpsState === 'loading' ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {gpsState === 'error' && <p className="text-[11px] text-rose-300">Izin lokasi ditolak / gagal.</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Koreksi Hijriah</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => z.setHijriOffset(Math.max(-2, z.hijriOffset - 1))}
                  className="p-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center text-sm font-bold tabular-nums">
                  {z.hijriOffset > 0 ? `+${z.hijriOffset}` : z.hijriOffset} hari
                </span>
                <button
                  onClick={() => z.setHijriOffset(Math.min(2, z.hijriOffset + 1))}
                  className="p-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Saat Adzan</label>
              <button
                onClick={() => z.setPauseOnAdzan(!z.pauseOnAdzan)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 border border-white/15"
              >
                <span className="flex items-center gap-2 text-sm">
                  <BellRing className="w-4 h-4 text-amber-300" /> Jeda musik
                </span>
                <span className={`w-10 h-6 rounded-full p-0.5 transition-colors ${z.pauseOnAdzan ? 'bg-emerald-500' : 'bg-white/20'}`}>
                  <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${z.pauseOnAdzan ? 'translate-x-4' : ''}`} />
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Chip({ label, value, tone }) {
  const tones = {
    emerald: 'bg-emerald-400/10 border-emerald-300/25 text-emerald-100',
    amber: 'bg-amber-400/10 border-amber-300/25 text-amber-100',
    zinc: 'bg-white/5 border-white/10 text-zinc-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${tones[tone]}`}>
      <span className="opacity-60 font-medium">{label}</span>
      {value}
    </span>
  );
}
