import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import {
  searchMusic,
  getSearchSuggestions,
  getHomeExplore,
  getSongInfo,
  getLyrics,
  debugSearch,
  debugStream
} from './yt.js';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.leptons.xyz',
];

app.use(cors());
app.use(express.json());

// ===== Image proxy =====
const IMG_HOSTS = /^(yt3|lh3|lh4|lh5|lh6)\.googleusercontent\.com$|^i\d?\.ytimg\.com$|^[a-z0-9-]+\.mzstatic\.com$/;
const isAllowedImg = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && IMG_HOSTS.test(url.hostname);
  } catch {
    return false;
  }
};

const proxify = (val) => {
  if (typeof val === 'string') return isAllowedImg(val) ? `/api/img?u=${encodeURIComponent(val)}` : val;
  if (Array.isArray(val)) return val.map(proxify);
  if (val && typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = proxify(val[k]);
    return out;
  }
  return val;
};

app.use('/api', (req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => json(proxify(body));
  next();
});

app.get('/api/img', async (req, res) => {
  const u = req.query.u;
  if (!u || !isAllowedImg(u)) return res.status(400).end();
  try {
    const r = await fetch(u);
    if (!r.ok) return res.status(r.status).end();
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch {
    res.status(502).end();
  }
});

// ===== API Routes =====
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query parameter q is required' });
  try {
    const results = await searchMusic(query);
    res.json({ results });
  } catch (err) {
    console.error('Error in /api/search:', err);
    res.status(500).json({ error: 'Failed to search' });
  }
});

app.get('/api/suggestions', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ suggestions: [] });
  try {
    const suggestions = await getSearchSuggestions(query);
    res.json({ suggestions });
  } catch {
    res.json({ suggestions: [] });
  }
});

app.get('/api/explore', async (req, res) => {
  try {
    const sections = await getHomeExplore();
    res.json({ sections });
  } catch (err) {
    console.error('Error in /api/explore:', err);
    res.status(500).json({ error: 'Failed to load explore feed' });
  }
});

app.get('/api/song/:id', async (req, res) => {
  try {
    const info = await getSongInfo(req.params.id);
    if (!info) return res.status(404).json({ error: 'Song not found' });
    res.json(info);
  } catch (err) {
    console.error('Error in /api/song/:id:', err);
    res.status(500).json({ error: 'Failed to get song info' });
  }
});

app.get('/api/lyrics/:id', async (req, res) => {
  try {
    const lyrics = await getLyrics(req.params.id, req.query.title || '', req.query.artist || '');
    res.json(lyrics);
  } catch {
    res.json({ hasLyrics: false, text: '', synced: [] });
  }
});

// ===== Stream Helpers =====
async function tryPiped(videoId) {
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${videoId}`, {
        headers: { 'User-Agent': 'ZanSic/1.0' },
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const audio = data.audioStreams?.find(s => s.mimeType?.includes('audio')) || data.audioStreams?.[0];
      if (audio?.url) {
        console.log(`[Piped] OK from ${base}`);
        return { url: audio.url, source: 'piped' };
      }
    } catch {}
  }
  return null;
}

async function tryYtDlpDirect(videoId) {
  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      '-f', 'bestaudio/best',
      '-g',
      '--no-playlist',
      '--no-warnings',
      `https://www.youtube.com/watch?v=${videoId}`
    ]);
    const url = stdout.trim().split('\n')[0];
    if (url) {
      console.log(`[yt-dlp] Got direct URL`);
      return { url, source: 'ytdlp-direct' };
    }
  } catch {}
  return null;
}

function streamViaPipe(videoId, res, req) {
  return new Promise((resolve, reject) => {
    console.log(`[yt-dlp] Fallback to pipe mode`);
    const ytdlp = spawn('yt-dlp', [
      '-f', 'bestaudio/best',
      '-o', '-',
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      `https://www.youtube.com/watch?v=${videoId}`
    ]);

    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-store');

    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on('data', (data) => {
      console.error(`[yt-dlp] ${data.toString().trim()}`);
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) console.error(`[yt-dlp] pipe exited ${code}`);
      if (!res.writableEnded) res.end();
      resolve();
    });

    ytdlp.on('error', (err) => {
      console.error(`[yt-dlp] spawn error: ${err.message}`);
      reject(err);
    });

    req.on('close', () => ytdlp.kill());
  });
}

async function proxyDirect(streamUrl, req, res) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': 'https://www.youtube.com/',
    'Origin': 'https://www.youtube.com',
  };
  if (req.headers.range) headers.Range = req.headers.range;

  const response = await fetch(streamUrl, { headers, redirect: 'follow' });
  if (!response.ok && response.status !== 206) {
    throw new Error(`Upstream ${response.status}`);
  }

  res.status(response.status);
  res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');

  for (const h of ['content-length', 'content-range']) {
    if (response.headers.get(h)) res.setHeader(h, response.headers.get(h));
  }

  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (res.destroyed) { reader.cancel().catch(() => {}); return; }
      if (!res.write(value)) await new Promise(r => res.once('drain', r));
    }
  }
  res.end();
}

app.get('/api/stream/:id', async (req, res) => {
  const trackId = req.params.id;
  try {
    let videoId = trackId.replace(/^(it_|au_)/, '');
    console.log(`[Stream] ${videoId}`);

    // 1. Piped
    let stream = await tryPiped(videoId);
    if (stream) {
      try {
        await proxyDirect(stream.url, req, res);
        return;
      } catch (err) {
        console.log(`[Piped] proxy failed: ${err.message}`);
      }
    }

    // 2. yt-dlp direct
    stream = await tryYtDlpDirect(videoId);
    if (stream) {
      try {
        await proxyDirect(stream.url, req, res);
        return;
      } catch (err) {
        console.log(`[yt-dlp] direct proxy failed: ${err.message}`);
      }
    }

    // 3. Fallback pipe
    await streamViaPipe(videoId, res, req);
  } catch (err) {
    console.error(`[Stream Error] ${trackId}:`, err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.destroy();
  }
});

// Debug
app.get('/api/debug/search', async (req, res) => {
  try {
    res.json(await debugSearch(String(req.query.q || 'tulus')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debug/stream', async (req, res) => {
  try {
    res.json(await debugStream(String(req.query.id || 'E7kHvjvU6JY')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 ZanSic Server running on http://localhost:${PORT}`);
});