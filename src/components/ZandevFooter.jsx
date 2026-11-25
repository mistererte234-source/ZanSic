import React from 'react';
import { ExternalLink, Sparkles, Heart } from 'lucide-react';

export default function ZandevFooter() {
  return (
    <footer className="w-full mt-16 mb-28 md:mb-24 px-6 text-center">
      <div className="max-w-4xl mx-auto py-6 px-8 rounded-2xl glass-card border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 hover:border-white/20">
        <div className="flex items-center gap-3">
          <img src="/logo-mark.png" alt="ZanSic" className="w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(47,107,255,0.45)]" />
          <div className="text-left">
            <h4 className="text-sm font-bold text-white tracking-wide">ZanSic Music</h4>
            <p className="text-xs text-zinc-400">Next-gen iOS 18 Web Experience</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-[#FA2D48] fill-[#FA2D48] inline animate-bounce" />
          <span>for music lovers</span>
        </div>

        {/* CLICKABLE ZANDEV WATERMARK FOOTER */}
        <a
          href="https://zandev.id"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FA2D48]/50 transition-all duration-200 text-xs font-semibold text-zinc-300 hover:text-white"
        >
          <span>Powered by</span>
          <span className="font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#FA2D48] group-hover:from-white group-hover:to-pink-400">
            ZanDev
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </footer>
  );
}
