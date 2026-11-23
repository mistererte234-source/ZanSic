import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Moon, X } from 'lucide-react';
import { useZanTime, fmtCountdown } from '../context/ZanTimeContext.jsx';
import PrayerWidget from './PrayerWidget.jsx';

/** Pill kecil di navbar: shalat berikutnya + countdown. Tap → sheet lengkap. */
export default function TimePill() {
  const z = useZanTime();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-emerald-400/10 hover:bg-emerald-400/15 border border-emerald-300/20 transition-all"
        title="Waktu shalat & kalender"
      >
        <span className="w-6 h-6 rounded-lg bg-emerald-400/20 flex items-center justify-center">
          <Moon className="w-3.5 h-3.5 text-emerald-300" />
        </span>
        <span className="hidden lg:inline text-xs font-bold tabular-nums text-white">{z.clock}</span>
        <span className="hidden lg:inline w-px h-4 bg-white/15" />
        <span className="text-[11px] sm:text-xs font-semibold text-emerald-100 whitespace-nowrap">
          {z.labelFor(z.next.key)}
          <span className="ml-1.5 tabular-nums text-amber-200">-{fmtCountdown(z.next.secLeft)}</span>
        </span>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#070a12]/95 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-10 h-1.5 rounded-full bg-white/25 mx-auto mt-2.5" />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-2 sm:p-3">
              <PrayerWidget />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
