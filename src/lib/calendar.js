// Kalender Hijriah (Umm al-Qura via Intl) + Kalender Jawa (Sultan Agungan)

export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const HARI_JAWA = ['Ngahad', 'Senen', 'Selasa', 'Rebo', 'Kemis', 'Jemuwah', 'Setu'];
export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
const NEPTU_HARI = [5, 4, 3, 7, 8, 6, 9];
const NEPTU_PASARAN = [5, 9, 7, 4, 8];

export const BULAN_HIJRI = [
  'Muharram', 'Safar', "Rabi'ul Awal", "Rabi'ul Akhir", 'Jumadil Awal', 'Jumadil Akhir',
  'Rajab', "Sya'ban", 'Ramadhan', 'Syawal', "Dzulqa'dah", 'Dzulhijjah',
];
export const BULAN_JAWA = [
  'Sura', 'Sapar', 'Mulud', 'Bakda Mulud', 'Jumadilawal', 'Jumadilakir',
  'Rejeb', 'Ruwah', 'Pasa', 'Sawal', 'Sela', 'Besar',
];
const WINDU = ['Alip', 'Ehe', 'Jimawal', 'Je', 'Dal', 'Be', 'Wawu', 'Jimakir'];

// Julian Day Number untuk tanggal sipil (tengah hari)
function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

// Referensi: 17 Agustus 1945 = Jumat Legi → JDN % 5 === 0 adalah Legi
export function pasaranOf(y, m, d) {
  return ((jdn(y, m, d) % 5) + 5) % 5;
}

function hijriParts(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric',
  }).formatToParts(date);
  const get = (type) => parseInt(parts.find((p) => p.type === type)?.value, 10);
  return { day: get('day'), month: get('month'), year: get('year'), date };
}

function shiftDate(y, m, d, delta) {
  const dt = new Date(Date.UTC(y, m - 1, d + delta, 12));
  return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), dt.getUTCDay()];
}

/**
 * @param {number} y,m,d tanggal sipil
 * @param {boolean} afterMaghrib — hari Hijriah & Jawa berganti saat Maghrib
 * @param {number} hijriOffset koreksi rukyat (-2..+2)
 */
export function buildCalendar(y, m, d, weekday, afterMaghrib = false, hijriOffset = 0) {
  const pas = pasaranOf(y, m, d);

  // Tanggal "malam" (setelah Maghrib) dihitung ke hari berikutnya
  const [ny, nm, nd, nWeekday] = shiftDate(y, m, d, afterMaghrib ? 1 : 0);
  const nPas = pasaranOf(ny, nm, nd);

  const [hy, hm, hd] = shiftDate(ny, nm, nd, hijriOffset);
  const h = hijriParts(hy, hm, hd);

  const arabic = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(h.date);

  const tahunJawa = h.year + 512;

  return {
    masehi: `${HARI[weekday]}, ${d} ${BULAN[m - 1]} ${y}`,
    weton: `${HARI[weekday]} ${PASARAN[pas]}`,
    neptu: NEPTU_HARI[weekday] + NEPTU_PASARAN[pas],
    malam: afterMaghrib ? `Malam ${HARI[nWeekday]} ${PASARAN[nPas]}` : null,
    hijri: `${h.day} ${BULAN_HIJRI[h.month - 1]} ${h.year} H`,
    hijriMonth: h.month,
    hijriDay: h.day,
    arabic,
    jawa: `${h.day} ${BULAN_JAWA[h.month - 1]} ${tahunJawa}`,
    hariJawa: `${HARI_JAWA[nWeekday]} ${PASARAN[nPas]}`,
    windu: WINDU[(tahunJawa + 5) % 8],
  };
}
