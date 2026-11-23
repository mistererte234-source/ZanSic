// Perhitungan waktu shalat lokal (tanpa API) — parameter Kemenag RI
// Subuh 20°, Isya 18°, Ashar Syafi'i, ihtiyat +2 menit, Imsak = Subuh - 10 menit.

const dtr = (d) => (d * Math.PI) / 180;
const rtd = (r) => (r * 180) / Math.PI;
const sin = (d) => Math.sin(dtr(d));
const cos = (d) => Math.cos(dtr(d));
const tan = (d) => Math.tan(dtr(d));
const arcsin = (x) => rtd(Math.asin(x));
const arccos = (x) => rtd(Math.acos(Math.max(-1, Math.min(1, x))));
const arctan2 = (y, x) => rtd(Math.atan2(y, x));
const arccot = (x) => rtd(Math.atan(1 / x));
const fixAngle = (a) => a - 360 * Math.floor(a / 360);
const fixHour = (a) => a - 24 * Math.floor(a / 24);

function julian(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = arctan2(cos(e) * sin(L), cos(L)) / 15;
  return { declination: arcsin(sin(e) * sin(L)), equation: q / 15 - fixHour(RA) };
}

export const KEMENAG = { fajr: 20, isha: 18, asrFactor: 1, ihtiyat: 2, imsakMinutes: 10 };

/**
 * @param {number} y,m,d tanggal sipil di lokasi
 * @param {number} lat, lng
 * @param {number} tz offset jam (WIB=7)
 * @returns objek menit-dalam-hari (float) per waktu
 */
export function computePrayerTimes(y, m, d, lat, lng, tz, cfg = KEMENAG) {
  const jDate = julian(y, m, d) - lng / (15 * 24);

  const midDay = (t) => fixHour(12 - sunPosition(jDate + t / 24).equation);
  const sunAngleTime = (angle, t, ccw = false) => {
    const decl = sunPosition(jDate + t / 24).declination;
    const noon = midDay(t);
    const h = arccos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
    return noon + (ccw ? -h : h);
  };
  const asrTime = (factor, t) => {
    const decl = sunPosition(jDate + t / 24).declination;
    return sunAngleTime(-arccot(factor + tan(Math.abs(lat - decl))), t);
  };

  let t = { fajr: 5, sunrise: 6, dhuha: 6.5, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
  for (let i = 0; i < 2; i++) {
    t = {
      fajr: sunAngleTime(cfg.fajr, t.fajr, true),
      sunrise: sunAngleTime(0.833, t.sunrise, true),
      dhuha: sunAngleTime(-4.5, t.dhuha, true),
      dhuhr: midDay(t.dhuhr),
      asr: asrTime(cfg.asrFactor, t.asr),
      sunset: sunAngleTime(0.833, t.sunset),
      isha: sunAngleTime(cfg.isha, t.isha),
    };
  }

  const toMin = (h) => fixHour(h + tz - lng / 15) * 60;
  const ih = cfg.ihtiyat;
  const fajr = toMin(t.fajr) + ih;
  return {
    imsak: fajr - cfg.imsakMinutes,
    subuh: fajr,
    terbit: toMin(t.sunrise) - ih,
    dhuha: toMin(t.dhuha) + ih,
    dzuhur: toMin(t.dhuhr) + ih,
    ashar: toMin(t.asr) + ih,
    maghrib: toMin(t.sunset) + ih,
    isya: toMin(t.isha) + ih,
  };
}

export const fmtHM = (min) => {
  const total = Math.round(min);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
