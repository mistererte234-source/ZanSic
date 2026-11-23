# 🎵 ZanSic (zansic.zandef.id)
> **Ultra Premium iOS-styled Music Streaming Web App**  
> Powered by InnerTube (YouTube Music Engine) with Ad-Free Lossless Audio, Synchronized Lyrics, Real-Time Waveform Visualizer, and Dynamic iOS 18 Glassmorphism.

---

## ✨ Features

- **iOS 18 Liquid Glassmorphism**: Ultra-frosted glass dock & panels, ambient dynamic glowing mesh matching the playing album artwork, and fluid micro-animations.
- **Cross-Device Responsive Design**:
  - 📱 **Mobile (Ponsel)**: Floating glass island player, iOS safe-area insets, mobile bottom navigation bar, lockscreen playback via MediaSession API.
  - 📱 **Tablet (iPad / Foldable)**: Dynamic multi-column responsive grid with adaptive sidebar and expansive fullscreen player.
  - 💻 **Laptop / Desktop**: Full-featured left glass sidebar, quick search with `⌘K`, high-precision scrubber, and queue manager.
- **Ad-Free InnerTube Engine**: Direct audio stream proxy with byte-range buffering (`206 Partial Content`) for instant playback without ads.
- **Synchronized Karaoke Lyrics**: Real-time lyrics fetched directly from InnerTube with auto-scroll.
- **Dynamic Waveform Visualizer**: Smooth animated canvas audio frequency visualizer.
- **Personal Library**: Favorites, recently played history, and custom playlists persisted locally.
- **ZanDev Signature**: Clickable watermark linked to [zandev.id](https://zandev.id).
- **Waktu Shalat (Kemenag RI)**: Dihitung lokal tanpa API (Subuh 20°, Isya 18°, Ashar Syafi'i, ihtiyat 2 menit), countdown real-time, pilih kota / GPS, notifikasi + opsi jeda musik saat adzan.
- **Kalender Lengkap**: Masehi, weton (hari + pasaran) & neptu, Hijriah (Umm al-Qura + koreksi ±2 hari), tanggal Jawa (bulan, tahun Jawa, windu), teks Arab. Hari Hijriah/Jawa berganti saat Maghrib.
- **Image Proxy**: Artwork dilewatkan `/api/img` (whitelist host Google) dengan cache 7 hari.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Development mode (Vite + Express API Proxy)
npm run dev

# 3. Build & Run Production Server
npm run build
npm start
# App is live on http://localhost:3001
```

---

## 🌐 Deployment for `zansic.zandef.id`

### 1. Using PM2 on VPS
```bash
npm run build
pm2 start server/server.js --name zansic
```

### 2. Nginx Reverse Proxy Config
```nginx
server {
    server_name zansic.zandef.id;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

Crafted by **[ZanDev](https://zandev.id)**
