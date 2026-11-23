// Tes cepat mesin audio ZanSic. Jalankan dari folder proyek:  node scripts/test-stream.mjs "tulus hati-hati di jalan"
import { searchMusic, resolveStream, getSongInfo } from '../server/yt.js';

const query = process.argv.slice(2).join(' ') || 'Tulus Hati-Hati di Jalan';
console.log('Cari:', query);
const results = await searchMusic(query);
console.log(`Hasil: ${results.length} lagu`);
const track = results[0];
if (!track) { console.error('GAGAL: pencarian kosong'); process.exit(1); }
console.log('Lagu pertama:', track.title, '-', track.artist, `(${track.duration})`, track.id);

const stream = await resolveStream(track.id);
console.log('Klien yang berhasil:', stream.client, '| format:', stream.mimeType);
const res = await fetch(stream.url, { headers: { Range: 'bytes=0-1' } });
const total = (res.headers.get('content-range') || '').split('/')[1];
console.log('Status stream:', res.status, '| ukuran file:', total ? (total / 1048576).toFixed(2) + ' MB' : 'tidak diketahui');

const info = await getSongInfo(track.id);
console.log('Up next:', info.upNext.length, 'lagu');
console.log(res.status === 206 || res.status === 200 ? 'OK: audio full bisa diambil' : 'GAGAL: stream ditolak');
process.exit(0);
