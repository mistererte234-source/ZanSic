import React from 'react';
import { useZanTime } from '../context/ZanTimeContext.jsx';
import { fmtHM } from '../lib/prayTimes.js';

/** Kartu kalender ringkas untuk sidebar desktop. */
export default function SidebarCalendar() {
  const z = useZanTime();
  return (
    <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-400/5 border border-white/10 space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-black tabular-nums tracking-tight">{z.clock}</span>
        <span className="text-[10px] font-bold text-zinc-400">{z.tzLabel}</span>
      </div>
      <p className="text-xs font-semibold text-amber-200">{z.cal.weton}</p>
      <p className="text-[11px] text-emerald-200/90">{z.cal.hijri}</p>
      <p className="text-[11px] text-zinc-400">{z.cal.jawa} · {z.cal.windu}</p>
      <p dir="rtl" lang="ar" className="font-arabic text-sm text-emerald-100/80 leading-relaxed">{z.cal.arabic}</p>
      <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[11px]">
        <span className="text-zinc-400">{z.labelFor(z.next.key)}</span>
        <span className="font-bold tabular-nums text-emerald-300">{fmtHM(z.next.minute)}</span>
      </div>
    </div>
  );
}
