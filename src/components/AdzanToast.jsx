import React, { useEffect } from 'react';
import { BellRing, X } from 'lucide-react';
import { useZanTime } from '../context/ZanTimeContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';

/** Notifikasi masuk waktu shalat (+ opsional jeda musik). */
export default function AdzanToast() {
  const z = useZanTime();
  const { isPlaying, togglePlay } = usePlayer();
  const alert = z.adzanAlert;

  useEffect(() => {
    if (!alert) return;
    if (z.pauseOnAdzan && isPlaying) togglePlay();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Waktu ${z.labelFor(alert.key)} telah tiba`, {
          body: `${z.location.name} · ${z.cal.hijri}`,
        });
      } catch {}
    }
    const t = setTimeout(() => z.dismissAdzan(), 60_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alert]);

  if (!alert) return null;

  return (
    <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-1.5rem)] max-w-md animate-in slide-in-from-top-6 fade-in duration-500">
      <div className="flex items-center gap-3 p-3.5 rounded-2xl glass-dock border-emerald-300/30">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <BellRing className="w-5 h-5 text-white animate-bounce" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Waktu {z.labelFor(alert.key)} telah tiba</p>
          <p className="text-xs text-zinc-400 truncate">
            {z.pauseOnAdzan ? 'Musik dijeda. ' : ''}Yuk sejenak tunaikan shalat 🤲
          </p>
        </div>
        <button onClick={z.dismissAdzan} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
