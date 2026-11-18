import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { Frame } from './frames';
import { drawIris, drawLid, drawSparkle, startBlinking } from './eyeFx';

/* Karakter diam yang "hidup": gambar frame di canvas + kilau mata + kedip otomatis,
   dibungkus animasi CSS napas & goyang halus (kelas .lc-sway / .lc-breathe di index.css).
   Ukuran diatur lewat `height` (CSS); lebar mengikuti rasio frame. */
export default function LiveChar({
  frame, height, label, style, className,
}: { frame: Frame; height: string; label?: string; style?: CSSProperties; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = frame.src;
    let lid = 0;
    const render = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(w * dpr), chh = Math.round(h * dpr);
      if (canvas.width !== cw || canvas.height !== chh) { canvas.width = cw; canvas.height = chh; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cw, chh);
      if (!img.complete || !img.naturalWidth) return;
      const k = chh / frame.h;
      ctx.setTransform(k, 0, 0, k, (cw - frame.w * k) / 2, 0);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, frame.w, frame.h);
      for (const e of frame.eyes) {
        drawIris(ctx, e);
        drawSparkle(ctx, e, frame.eyes.length < 2);
        drawLid(ctx, e, lid);
      }
    };
    img.onload = render;
    const stop = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? () => {}
      : startBlinking((v) => { lid = v; render(); });
    const ro = new ResizeObserver(render);
    ro.observe(canvas);
    render();
    return () => { stop(); ro.disconnect(); };
  }, [frame]);

  return (
    <div className={className} style={{ height, aspectRatio: `${frame.w} / ${frame.h}`, ...style }}>
      <div className="lc-sway" style={{ width: '100%', height: '100%' }}>
        <div className="lc-breathe" style={{ width: '100%', height: '100%' }}>
          <canvas
            ref={canvasRef}
            role={label ? 'img' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
