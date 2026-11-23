// ZanSic Hybrid Audio Engine:
// - Apple Music / iTunes Public API (Mainstream Indonesian & Global Catalog, HD Artwork, Direct AAC Stream)
// - Audius Open Music API (Full-Length 320kbps MP3 Streams)
// - LRCLIB Public API (Time-Synchronized Karaoke Lyrics)

const streamUrlCache = new Map();
const trackMetaCache = new Map();

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0:30';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function cacheTrack(track) {
  if (!track || !track.id) return track;
  if (track.streamUrl) {
    streamUrlCache.set(track.id, track.streamUrl);
  }
  trackMetaCache.set(track.id, track);
  return track;
}

// Search Apple Music / iTunes Indonesia catalog
async function searchItunes(query, limit = 16) {
  try {
    const url = `https://itunes.apple.com/search?country=ID&media=music&entity=song&limit=${limit}&term=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items = [];
    for (const r of data.results || []) {
      if (!r.trackId || !r.previewUrl) continue;
      const id = `it_${r.trackId}`;
      const thumb = (r.artworkUrl100 || '').replace('100x100bb', '600x600bb');
      const sec = Math.round((r.trackTimeMillis || 30000) / 1000);
      items.push(
        cacheTrack({
          id,
          title: r.trackName || 'Unknown Title',
          artist: r.artistName || 'Unknown Artist',
          album: r.collectionName || '',
          duration: formatDuration(sec),
          thumbnail: thumb,
          streamUrl: r.previewUrl,
          badge: 'AAC HQ'
        })
      );
    }
    return items;
  } catch (err) {
    console.error('[iTunes] Search error:', err.message);
    return [];
  }
}

// Search Audius Open Music API (Full-Length MP3 tracks)
async function searchAudius(query, limit = 10) {
  try {
    const url = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=ZanSic`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items = [];
    for (const t of data.data || []) {
      if (!t.id || t.is_stream_gated) continue;
      const id = `au_${t.id}`;
      const thumb = t.artwork?.['480x480'] || t.artwork?.['1000x1000'] || t.artwork?.['150x150'] || '';
      const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=ZanSic`;
      items.push(
        cacheTrack({
          id,
          title: t.title || 'Unknown Title',
          artist: t.user?.name || t.user?.handle || 'Independent Artist',
          album: t.genre || 'Audius Full Stream',
          duration: formatDuration(t.duration || 180),
          thumbnail: thumb,
          streamUrl,
          badge: 'Full Track'
        })
      );
    }
    return items;
  } catch (err) {
    console.error('[Audius] Search error:', err.message);
    return [];
  }
}

// Fetch Audius Trending Full-Length Tracks
async function getAudiusTrending(limit = 8) {
  try {
    const url = `https://discoveryprovider.audius.co/v1/tracks/trending?limit=${limit}&app_name=ZanSic`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items = [];
    for (const t of data.data || []) {
      if (!t.id || t.is_stream_gated) continue;
      const id = `au_${t.id}`;
      const thumb = t.artwork?.['480x480'] || t.artwork?.['1000x1000'] || t.artwork?.['150x150'] || '';
      const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=ZanSic`;
      items.push(
        cacheTrack({
          id,
          title: t.title || 'Unknown Title',
          artist: t.user?.name || t.user?.handle || 'Artist',
          album: t.genre || 'Trending Full Stream',
          duration: formatDuration(t.duration || 180),
          thumbnail: thumb,
          streamUrl,
          badge: 'Full Track'
        })
      );
    }
    return items;
  } catch (err) {
    console.error('[Audius] Trending error:', err.message);
    return [];
  }
}

// 1. Unified Search Music (iTunes + Audius Full Tracks)
export async function searchMusic(query) {
  const [itunesResults, audiusResults] = await Promise.all([
    searchItunes(query, 16),
    searchAudius(query, 8)
  ]);

  // Interleave so user gets exact mainstream songs + full-length streams
  const combined = [];
  const maxLen = Math.max(itunesResults.length, audiusResults.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < itunesResults.length) combined.push(itunesResults[i]);
    if (i < audiusResults.length) combined.push(audiusResults[i]);
  }
  return combined;
}

// 2. Search Suggestions
export async function getSearchSuggestions(query) {
  if (!query || query.length < 2) return [];
  try {
    const items = await searchItunes(query, 6);
    const set = new Set();
    for (const item of items) {
      set.add(`${item.title} - ${item.artist}`);
    }
    return Array.from(set).slice(0, 6);
  } catch {
    return [];
  }
}

// 3. Home / Explore Feed (Cached 30 mins)
let exploreCache = { timestamp: 0, sections: [] };

export async function getHomeExplore() {
  const now = Date.now();
  if (exploreCache.sections.length > 0 && now - exploreCache.timestamp < 1000 * 60 * 30) {
    return exploreCache.sections;
  }

  const [
    tulus, sal, bernadya, mahalini,
    lofiFull,
    bruno, billie, weeknd,
    trendingFull
  ] = await Promise.all([
    searchItunes('Tulus', 3),
    searchItunes('Sal Priadi', 3),
    searchItunes('Bernadya', 2),
    searchItunes('Mahalini', 2),
    searchAudius('Lofi Chill Beats', 8),
    searchItunes('Bruno Mars', 3),
    searchItunes('Billie Eilish', 3),
    searchItunes('The Weeknd', 2),
    getAudiusTrending(8)
  ]);

  const indoHits = [...tulus, ...sal, ...bernadya, ...mahalini];
  const globalHits = [...bruno, ...billie, ...weeknd];

  const sections = [];
  if (indoHits.length > 0) {
    sections.push({ title: 'Top Hits Indonesia', items: indoHits.slice(0, 8) });
  }
  if (lofiFull.length > 0) {
    sections.push({ title: 'Lofi & Chill (Full Stream)', items: lofiFull.slice(0, 8) });
  }
  if (globalHits.length > 0) {
    sections.push({ title: 'Global Top Hits', items: globalHits.slice(0, 8) });
  }
  if (trendingFull.length > 0) {
    sections.push({ title: 'Trending Full Tracks (Audius)', items: trendingFull.slice(0, 8) });
  }

  if (sections.length > 0) {
    exploreCache = { timestamp: now, sections };
  }
  return sections;
}

// 4. Song Info & Up Next Autoplay Queue
export async function getSongInfo(trackId) {
  const cached = trackMetaCache.get(trackId);
  const artistQuery = cached?.artist || 'Top Hits Indonesia';
  const related = await searchMusic(artistQuery);
  const upNext = related.filter(t => t.id !== trackId).slice(0, 12);

  return {
    id: trackId,
    title: cached?.title || 'ZanSic Track',
    artist: cached?.artist || 'ZanSic Artist',
    thumbnail: cached?.thumbnail || '',
    durationText: cached?.duration || '3:30',
    upNext
  };
}

// Parse LRC format "[mm:ss.xx] lyric line" into [{ time: seconds, text }]
function parseLrc(lrcText) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const parsed = [];
  const timeExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;
  for (const line of lines) {
    const match = timeExp.exec(line);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
      const text = line.replace(timeExp, '').trim();
      if (text) {
        parsed.push({ time: min * 60 + sec + ms / 1000, text });
      }
    }
  }
  return parsed;
}

// 5. Lyrics via LRCLIB Public API
export async function getLyrics(trackId, title = '', artist = '') {
  const cached = trackMetaCache.get(trackId);
  const rawTitle = title || cached?.title || '';
  const rawArtist = artist || cached?.artist || '';

  const cleanTitle = rawTitle.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanArtist = rawArtist.replace(/Unknown Artist/i, '').split(',')[0].trim();

  if (cleanTitle) {
    try {
      const q = `${cleanArtist} ${cleanTitle}`.trim();
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const bestSynced = list.find(item => item.syncedLyrics);
          const bestPlain = list.find(item => item.plainLyrics);
          const picked = bestSynced || bestPlain;
          if (picked) {
            const synced = bestSynced ? parseLrc(bestSynced.syncedLyrics) : [];
            return {
              hasLyrics: true,
              text: picked.plainLyrics || synced.map(s => s.text).join('\n'),
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

// 6. Resolve Direct Audio Stream URL for HTML5 <audio>
export async function getDecipheredAudioUrl(trackId) {
  if (streamUrlCache.has(trackId)) {
    return streamUrlCache.get(trackId);
  }

  if (trackId.startsWith('au_')) {
    const rawId = trackId.slice(3);
    const url = `https://discoveryprovider.audius.co/v1/tracks/${rawId}/stream?app_name=ZanSic`;
    streamUrlCache.set(trackId, url);
    return url;
  }

  if (trackId.startsWith('it_')) {
    const rawId = trackId.slice(3);
    const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(rawId)}&country=ID`);
    const data = await res.json();
    const previewUrl = data.results?.[0]?.previewUrl;
    if (previewUrl) {
      streamUrlCache.set(trackId, previewUrl);
      return previewUrl;
    }
  }

  throw new Error('Stream URL not found for ' + trackId);
}

export async function resolveEmbedCandidates() {
  return [];
}
