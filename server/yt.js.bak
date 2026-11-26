// ZanSic Audio Engine (pemakaian pribadi / lokal)
// - YouTube Music via InnerTube (youtubei.js): pencarian, antrean "up next", audio full
// - Teknik meniru Metrolist: coba beberapa klien InnerTube bergantian, uji URL-nya,
//   ingat klien yang berhasil, dan resolve ulang kalau stream ditolak / kedaluwarsa
// - Audius tetap didukung untuk item lama ber-id "au_"
// - Item lama ber-id "it_" (preview iTunes 30 detik) dicarikan padanan full-nya di YouTube Music
// - LRCLIB untuk lirik tersinkron

import vm from 'node:vm';
import { Innertube, Platform } from 'youtubei.js';

// ---------- Evaluator untuk decipher URL ----------
// youtubei.js tidak membawa evaluator JS sendiri. Script player YouTube dijalankan
// di context vm terpisah; kalau gagal, fallback ke new Function.
Platform.shim.eval = async (data) => {
  try {
    return vm.runInNewContext(`(function(){${data.output}\n})()`, { URL, URLSearchParams }, { timeout: 5000 });
  } catch {
    return new Function(data.output)();
  }
};

// Urutan klien yang dicoba (klien yang terakhir berhasil selalu dicoba lebih dulu).
const STREAM_CLIENTS = [
  'ANDROID_VR',
  'YTMUSIC_ANDROID',
  'IOS',
  'TV',
  'TV_SIMPLY',
  'WEB_EMBEDDED',
  'YTMUSIC',
  'MWEB',
  'WEB'
];
const CLIENT_FAILURE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_STREAM_TTL_MS = 5 * 60 * 1000;

const trackMetaCache = new Map(); // id -> track
const streamCache = new Map(); // id -> { url, mimeType, client, expiresAt }
const failedClients = new Map(); // id -> { names:Set, at:number }
const legacyMap = new Map(); // it_xxx -> videoId
let lastGoodClient = null;

let ytPromise = null;
function getYT() {
  if (!ytPromise) {
    ytPromise = Innertube.create({ lang: 'en', location: 'ID', retrieve_player: true }).catch((err) => {
      ytPromise = null;
      throw err;
    });
  }
  return ytPromise;
}

// ---------- Helper ----------
function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function bestThumb(thumbs) {
  if (!Array.isArray(thumbs) || thumbs.length === 0) return '';
  const best = [...thumbs].sort((a, b) => (b.width || 0) - (a.width || 0))[0];
  const url = best?.url || '';
  // Artwork YouTube Music bisa diminta ukuran lebih besar lewat parameter di URL
  return url.replace(/=w\d+-h\d+/, '=w544-h544');
}

function cacheTrack(track) {
  if (track?.id) trackMetaCache.set(track.id, track);
  return track;
}

function namesOf(list) {
  return (list || []).map((a) => a?.name).filter(Boolean).join(', ');
}

// Cadangan: kalau library tidak mengisi durasi, telusuri isi item dan cari teks berbentuk "m:ss"
// Bahasa Indonesia menulis durasi dengan titik ("3.33"), jadi titik juga diterima
const DURATION_RE = /^\d{1,2}[:.]\d{2}([:.]\d{2})?$/;
function durationFromColumns(item) {
  const seen = new Set();
  const walk = (node, depth) => {
    if (node == null || depth > 7) return '';
    if (typeof node === 'string') {
      for (const part of node.split(/\s*[\u2022\u00b7|]\s*/)) {
        if (DURATION_RE.test(part.trim())) return part.trim().replace(/\./g, ':');
      }
      return '';
    }
    if (typeof node !== 'object' || seen.has(node)) return '';
    seen.add(node);
    for (const key of Object.keys(node)) {
      if (key === 'endpoint' || key === 'menu' || key === 'thumbnail') continue;
      const hit = walk(node[key], depth + 1);
      if (hit) return hit;
    }
    return '';
  };
  try {
    return walk(item, 0);
  } catch {
    return '';
  }
}

// DEBUG (sementara): teks mentah item pertama hasil pencarian
export async function debugSearch(query) {
  const yt = await getYT();
  const res = await yt.music.search(query, { type: 'song' });
  const shelf = res.songs || res.contents?.find((c) => c?.type === 'MusicShelf');
  const item = shelf?.contents?.[0];
  if (!item) return { empty: true };
  const txt = (t) => { try { return t?.toString?.() ?? null; } catch { return null; } };
  return {
    keys: Object.keys(item),
    item_type: item.item_type,
    duration: item.duration ?? null,
    subtitle: txt(item.subtitle),
    flex: (item.flex_columns || []).map((c) => txt(c.title)),
    fixed: (item.fixed_columns || []).map((c) => txt(c.title)),
    overlay: JSON.stringify(item.overlay ?? null).slice(0, 600),
    badges: JSON.stringify(item.badges ?? null).slice(0, 300)
  };
}

// Item hasil pencarian YouTube Music (MusicResponsiveListItem)
function mapListItem(item) {
  if (!item?.id || !item.title) return null;
  const artist = namesOf(item.artists) || namesOf(item.authors) || item.author?.name || 'Unknown Artist';
  return cacheTrack({
    id: item.id,
    title: item.title,
    artist,
    album: item.album?.name || '',
    duration: item.duration?.text || formatDuration(item.duration?.seconds) || durationFromColumns(item),
    thumbnail: bestThumb(item.thumbnails),
    badge: 'Full'
  });
}

// Item antrean "up next" (PlaylistPanelVideo)
function mapPanelVideo(v) {
  if (!v?.video_id) return null;
  const title = v.title?.toString?.() || '';
  if (!title) return null;
  return cacheTrack({
    id: v.video_id,
    title,
    artist: namesOf(v.artists) || v.author || 'Unknown Artist',
    album: v.album?.name || '',
    duration: v.duration?.text || formatDuration(v.duration?.seconds),
    thumbnail: bestThumb(v.thumbnail),
    badge: 'Full'
  });
}

async function searchSongs(query, limit = 20) {
  const yt = await getYT();
  const res = await yt.music.search(query, { type: 'song' });
  const shelf = res.songs || res.contents?.find((c) => c?.type === 'MusicShelf');
  const items = [];
  for (const it of shelf?.contents || []) {
    const t = mapListItem(it);
    if (t) items.push(t);
    if (items.length >= limit) break;
  }
  return items;
}

// ---------- 1. Search ----------
export async function searchMusic(query) {
  return searchSongs(query, 24);
}

// ---------- 2. Search suggestions ----------
export async function getSearchSuggestions(query) {
  if (!query || query.length < 2) return [];
  try {
    const yt = await getYT();
    const sections = await yt.music.getSearchSuggestions(query);
    const out = [];
    for (const sec of sections || []) {
      for (const node of sec.contents || []) {
        const text = node?.suggestion?.toString?.();
        if (text && !out.includes(text)) out.push(text);
      }
    }
    return out.slice(0, 6);
  } catch {
    return [];
  }
}

// ---------- 3. Home / Explore (cache 30 menit) ----------
let exploreCache = { timestamp: 0, sections: [] };
const EXPLORE_SECTIONS = [
  { title: 'Top Hits Indonesia', queries: ['Tulus', 'Sal Priadi', 'Bernadya', 'Mahalini'], per: 2 },
  { title: 'Lofi & Chill', queries: ['lofi chill beats'], per: 8 },
  { title: 'Global Top Hits', queries: ['Bruno Mars', 'Billie Eilish', 'The Weeknd'], per: 3 }
];

export async function getHomeExplore() {
  const now = Date.now();
  if (exploreCache.sections.length > 0 && now - exploreCache.timestamp < 1000 * 60 * 30) {
    return exploreCache.sections;
  }
  const sections = [];
  for (const def of EXPLORE_SECTIONS) {
    const lists = await Promise.all(def.queries.map((q) => searchSongs(q, def.per).catch(() => [])));
    const seen = new Set();
    const items = lists.flat().filter((t) => !seen.has(t.id) && seen.add(t.id));
    if (items.length > 0) sections.push({ title: def.title, items: items.slice(0, 8) });
  }
  if (sections.length > 0) exploreCache = { timestamp: now, sections };
  return sections;
}

// ---------- Id lama (it_ / au_) ----------
async function resolveLegacyItunes(trackId) {
  if (legacyMap.has(trackId)) return legacyMap.get(trackId);
  let meta = trackMetaCache.get(trackId);
  if (!meta) {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId.slice(3))}&country=ID`);
    const r = (await res.json()).results?.[0];
    if (r) meta = { title: r.trackName, artist: r.artistName };
  }
  if (!meta?.title) throw new Error('Metadata lagu lama tidak ditemukan: ' + trackId);
  const hit = (await searchSongs(`${meta.title} ${meta.artist || ''}`.trim(), 1))[0];
  if (!hit) throw new Error('Padanan YouTube Music tidak ditemukan: ' + trackId);
  legacyMap.set(trackId, hit.id);
  return hit.id;
}

async function toVideoId(trackId) {
  return trackId.startsWith('it_') ? resolveLegacyItunes(trackId) : trackId;
}

// ---------- 4. Info lagu & antrean Up Next ----------
export async function getSongInfo(trackId) {
  const cached = trackMetaCache.get(trackId);
  let upNext = [];
  try {
    if (!trackId.startsWith('au_')) {
      const yt = await getYT();
      const videoId = await toVideoId(trackId);
      const panel = await yt.music.getUpNext(videoId, true);
      upNext = (panel?.contents || [])
        .filter((n) => n?.type === 'PlaylistPanelVideo')
        .map(mapPanelVideo)
        .filter((t) => t && t.id !== videoId && t.id !== trackId)
        .slice(0, 20);
    }
  } catch (err) {
    console.error('[UpNext] gagal:', err.message);
  }
  return {
    id: trackId,
    title: cached?.title || 'ZanSic Track',
    artist: cached?.artist || '',
    thumbnail: cached?.thumbnail || '',
    durationText: cached?.duration || '',
    upNext
  };
}

// ---------- 5. Lirik via LRCLIB ----------
function parseLrc(lrcText) {
  if (!lrcText) return [];
  const parsed = [];
  const timeExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;
  for (const line of lrcText.split('\n')) {
    const match = timeExp.exec(line);
    if (!match) continue;
    const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
    const text = line.replace(timeExp, '').trim();
    if (text) parsed.push({ time: parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + ms / 1000, text });
  }
  return parsed;
}

export async function getLyrics(trackId, title = '', artist = '') {
  const cached = trackMetaCache.get(trackId);
  const cleanTitle = (title || cached?.title || '').replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanArtist = (artist || cached?.artist || '').replace(/Unknown Artist/i, '').split(',')[0].trim();

  if (cleanTitle) {
    try {
      const q = `${cleanArtist} ${cleanTitle}`.trim();
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const bestSynced = list.find((item) => item.syncedLyrics);
          const picked = bestSynced || list.find((item) => item.plainLyrics);
          if (picked) {
            const synced = bestSynced ? parseLrc(bestSynced.syncedLyrics) : [];
            return {
              hasLyrics: true,
              text: picked.plainLyrics || synced.map((s) => s.text).join('\n'),
              synced,
              footer: 'Synchronized Lyrics via LRCLIB'
            };
          }
        }
      }
    } catch (err) {
      console.error('[LRCLIB] Error:', err.message);
    }
  }
  return { hasLyrics: false, text: '', synced: [] };
}

// ---------- 6. Resolve URL audio full ----------
function activeFailures(id) {
  const f = failedClients.get(id);
  if (!f) return new Set();
  if (Date.now() - f.at > CLIENT_FAILURE_TTL_MS) {
    failedClients.delete(id);
    return new Set();
  }
  return f.names;
}

function markClientFailed(id, client) {
  const names = activeFailures(id);
  names.add(client);
  failedClients.set(id, { names, at: Date.now() });
}

function pickAudioFormat(info) {
  const all = info?.streaming_data?.adaptive_formats || [];
  const audio = all.filter((f) => f.has_audio && !f.has_video && (f.url || f.signature_cipher || f.cipher));
  if (audio.length === 0) return null;
  // Utamakan audio asli (bukan dubbing), lalu AAC/mp4a karena diputar semua browser, lalu bitrate tertinggi
  const original = audio.filter((f) => f.is_original !== false);
  const pool = original.length ? original : audio;
  const mp4a = pool.filter((f) => (f.mime_type || '').includes('mp4a'));
  return [...(mp4a.length ? mp4a : pool)].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
}

async function probe(url) {
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-1' }, redirect: 'follow' });
    try { await res.body?.cancel(); } catch {}
    return res.status === 200 || res.status === 206;
  } catch {
    return false;
  }
}

async function resolveYouTube(videoId) {
  const yt = await getYT();
  const failed = activeFailures(videoId);
  const order = [...new Set([lastGoodClient, ...STREAM_CLIENTS].filter(Boolean))];
  // Kalau semua klien sudah ditandai gagal, coba ulang semuanya
  const candidates = order.filter((c) => !failed.has(c));
  const errors = [];

  for (const client of candidates.length ? candidates : order) {
    try {
      const info = await yt.getBasicInfo(videoId, { client });
      const status = info?.playability_status?.status;
      if (status && status !== 'OK') {
        throw new Error(`${status}: ${info.playability_status.reason || ''}`.trim());
      }
      const format = pickAudioFormat(info);
      if (!format) throw new Error('tidak ada format audio langsung');
      const url = await format.decipher(yt.session.player);
      if (!url) throw new Error('URL kosong setelah decipher');
      if (!(await probe(url))) throw new Error('URL ditolak server (probe gagal)');

      const expire = Number(new URL(url).searchParams.get('expire')) * 1000;
      lastGoodClient = client;
      console.log(`[Stream] ${videoId} via ${client} (${format.mime_type})`);
      return {
        url,
        mimeType: (format.mime_type || 'audio/mp4').split(';')[0],
        client,
        // sisakan 1 menit sebelum benar-benar kedaluwarsa
        expiresAt: expire > Date.now() ? expire - 60 * 1000 : Date.now() + DEFAULT_STREAM_TTL_MS
      };
    } catch (err) {
      markClientFailed(videoId, client);
      errors.push(`${client}: ${err.message}`);
    }
  }
  throw new Error(`Semua klien gagal untuk ${videoId} -> ${errors.join(' | ')}`);
}

// Mengembalikan { url, mimeType, client }
export async function resolveStream(trackId) {
  const hit = streamCache.get(trackId);
  if (hit && hit.expiresAt > Date.now()) return hit;

  let entry;
  if (trackId.startsWith('au_')) {
    entry = {
      url: `https://discoveryprovider.audius.co/v1/tracks/${trackId.slice(3)}/stream?app_name=ZanSic`,
      mimeType: 'audio/mpeg',
      client: 'AUDIUS',
      expiresAt: Date.now() + 60 * 60 * 1000
    };
  } else {
    entry = await resolveYouTube(await toVideoId(trackId));
  }
  streamCache.set(trackId, entry);
  return entry;
}

// Dipanggil saat server stream menolak URL (403/410): buang cache, tandai kliennya gagal
export function invalidateStream(trackId) {
  const hit = streamCache.get(trackId);
  streamCache.delete(trackId);
  if (hit?.client && hit.client !== 'AUDIUS') {
    markClientFailed(legacyMap.get(trackId) || trackId, hit.client);
    if (lastGoodClient === hit.client) lastGoodClient = null;
  }
}

// Kompatibilitas dengan nama fungsi lama
export async function getDecipheredAudioUrl(trackId) {
  return (await resolveStream(trackId)).url;
}

// DEBUG (sementara): uji tiap klien dan tiap cara meminta potongan audio
export async function debugStream(videoId) {
  const yt = await getYT();
  const VR_UA = 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip';
  const ranges = [[0, 1023], [0, 1048575], [0, 2097151], [1048576, 1049599], [1048576, 2097151], [2000000, 2001023]];
  const status = async (url, headers) => {
    try {
      const r = await fetch(url, { headers, redirect: 'follow' });
      const len = r.headers.get('content-length');
      try { await r.body?.cancel(); } catch {}
      return `${r.status}/${len}`;
    } catch (e) {
      return 'ERR ' + e.message;
    }
  };
  const out = { player_id: yt.session.player?.player_id, clients: {} };
  for (const client of STREAM_CLIENTS) {
    const row = {};
    out.clients[client] = row;
    try {
      const info = await yt.getBasicInfo(videoId, { client });
      row.playability = info?.playability_status?.status + ' ' + (info?.playability_status?.reason || '');
      const sd = info?.streaming_data;
      row.formats = (sd?.adaptive_formats || []).filter((f) => f.has_audio && !f.has_video)
        .map((f) => `${f.itag}:${(f.mime_type || '').split(';')[0]}:${f.url ? 'url' : f.signature_cipher || f.cipher ? 'cipher' : 'none'}`);
      row.hls = Boolean(sd?.hls_manifest_url);
      row.sabr = Boolean(sd?.server_abr_streaming_url);
      const format = pickAudioFormat(info);
      if (!format) continue;
      const url = await format.decipher(yt.session.player);
      const u = new URL(url);
      row.itag = format.itag;
      row.params = [...u.searchParams.keys()].join(',');
      row.c = u.searchParams.get('c');
      row.tests = {};
      for (const [a, b] of ranges) {
        const key = `${a}-${b}`;
        row.tests[key] = {
          header: await status(url, { Range: `bytes=${a}-${b}` }),
          query: await status(`${url}&range=${a}-${b}`, {}),
          queryCpn: await status(`${url}&cpn=${info.cpn || 'abcdefghijklmnop'}&range=${a}-${b}`, {}),
          headerUA: await status(url, { Range: `bytes=${a}-${b}`, 'User-Agent': VR_UA })
        };
      }
    } catch (err) {
      row.error = err.message;
    }
  }
  return out;
}