// ZanSic Cache-First Engine ("CDN pribadi")
// Cache hit: serve dari disk (Range/206 otomatis) | Miss: stream-through yt-dlp
// Prefetch: unduh background | Eviksi LRU cap 5 GB
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const DIR = process.env.ZANSIC_CACHE || '/var/lib/zansic/cache';
fs.mkdirSync(DIR, { recursive: true });

const MAX_BYTES = Number(process.env.ZANSIC_CACHE_MAX || 5 * 1024 ** 3);
const safeId = (id) => String(id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);

export const cachePath = (id) => path.join(DIR, `${safeId(id)}.m4a`);
export const hasCache = (id) => safeId(id).length > 0 && fs.existsSync(cachePath(id));

const busy = new Map();

const ytdlpArgs = (id, extra) => [
  ...extra,
  '-f', 'bestaudio[ext=m4a]/140/bestaudio',
  '-o', '-', '--no-playlist', '--no-warnings', '--quiet',
  `https://www.youtube.com/watch?v=${safeId(id)}`
];

export function downloadToCache(id, extra = []) {
  id = safeId(id);
  if (!id) return Promise.reject(new Error('id tidak valid'));
  if (hasCache(id)) return Promise.resolve(cachePath(id));
  if (busy.has(id)) return busy.get(id);

  const p = new Promise((resolve, reject) => {
    const tmp = cachePath(id) + '.part';
    const out = fs.createWriteStream(tmp);
    const yt = spawn('yt-dlp', ytdlpArgs(id, extra));
    yt.stdout.pipe(out);
    yt.stderr.on('data', (d) => console.error('[cache-dl]', d.toString().trim()));
    yt.on('close', (code) => {
      out.end();
      if (code === 0) { fs.renameSync(tmp, cachePath(id)); resolve(cachePath(id)); }
      else { fs.unlink(tmp, () => {}); reject(new Error('yt-dlp exit ' + code)); }
    });
    yt.on('error', (e) => { out.end(); fs.unlink(tmp, () => {}); reject(e); });
  }).finally(() => busy.delete(id));

  busy.set(id, p);
  return p;
}

export function streamAndCache(id, req, res, extra = []) {
  id = safeId(id);
  return new Promise((resolve, reject) => {
    if (!id) return reject(new Error('id tidak valid'));
    const tmp = cachePath(id) + '.part';
    const file = fs.createWriteStream(tmp);
    const yt = spawn('yt-dlp', ytdlpArgs(id, extra));

    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-store');

    yt.stdout.on('data', (chunk) => {
      file.write(chunk);
      if (!res.write(chunk)) yt.stdout.pause();
    });
    res.on('drain', () => yt.stdout.resume());
    yt.stderr.on('data', (d) => console.error('[cache-stream]', d.toString().trim()));

    const cleanup = () => { file.end(); fs.unlink(tmp, () => {}); };
    yt.on('close', (code) => {
      file.end();
      if (code === 0) fs.rename(tmp, cachePath(id), () => {});
      else fs.unlink(tmp, () => {});
      if (!res.writableEnded) res.end();
      resolve();
    });
    yt.on('error', (e) => { cleanup(); reject(e); });
    req.on('close', () => { yt.kill(); cleanup(); resolve(); });
  });
}

export function cacheStats() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.m4a'));
  const bytes = files.reduce((a, f) => a + fs.statSync(path.join(DIR, f)).size, 0);
  return { tracks: files.length, bytes, dir: DIR };
}

setInterval(() => {
  try {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.m4a'))
      .map((f) => { const st = fs.statSync(path.join(DIR, f)); return { f, t: st.atimeMs, s: st.size }; })
      .sort((a, b) => a.t - b.t);
    let total = files.reduce((a, x) => a + x.s, 0);
    for (const x of files) {
      if (total <= MAX_BYTES) break;
      fs.unlink(path.join(DIR, x.f), () => {});
      total -= x.s;
    }
  } catch {}
}, 3600_000).unref();