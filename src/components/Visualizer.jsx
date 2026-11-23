import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function Visualizer() {
  const { isPlaying } = usePlayer();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const bars = 32;
    const barWidth = 4;
    const gap = 3;
    let heights = new Array(bars).fill(6);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bars; i++) {
        // Target height depending on playing state
        const target = isPlaying
          ? Math.random() * (canvas.height - 10) + 8
          : 6;

        // Smooth interpolate
        heights[i] += (target - heights[i]) * 0.2;

        const x = i * (barWidth + gap);
        const y = canvas.height - heights[i];

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#FA2D48');
        grad.addColorStop(0.5, '#A855F7');
        grad.addColorStop(1, '#00F0FF');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, heights[i], [2, 2, 0, 0]);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  return (
    <div className="flex items-center justify-center p-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5">
      <canvas
        ref={canvasRef}
        width={224}
        height={48}
        className="w-full max-w-[224px] h-12"
      />
    </div>
  );
}
