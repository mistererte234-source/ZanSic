import { computePrayerTimes, fmtHM } from '../src/lib/prayTimes.js';
import { buildCalendar, pasaranOf, PASARAN } from '../src/lib/calendar.js';

const show = (name, y, m, d, lat, lng, tz) => {
  const t = computePrayerTimes(y, m, d, lat, lng, tz);
  console.log(name, `${d}/${m}/${y}`, Object.entries(t).map(([k, v]) => `${k} ${fmtHM(v)}`).join(' | '));
};

show('Jakarta', 2026, 11, 14, -6.2088, 106.8456, 7);
show('Yogyakarta', 2026, 11, 14, -7.7956, 110.3695, 7);
show('Makassar', 2026, 11, 14, -5.1477, 119.4327, 8);

console.log('17 Agt 1945 (harus Legi):', PASARAN[pasaranOf(1945, 8, 17)]);
console.log('16 Jun 2026 (harus Wage):', PASARAN[pasaranOf(2026, 6, 16)]);
console.log('Siang ini:', buildCalendar(2026, 11, 14, 6, false, 0));
console.log('Habis Maghrib:', buildCalendar(2026, 11, 14, 6, true, 0));
console.log('17 Jun 2026 (1 Muharram 1448?):', buildCalendar(2026, 6, 17, 3, false, 0).hijri);
