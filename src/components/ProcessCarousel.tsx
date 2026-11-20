import { useEffect, useRef, useState } from 'react';
import { THEME } from '../config';
import { FRAMES, type Frame } from './frames';
import { POSE_FRAMES } from './poseFrames';
import walk12 from './walk/walk12';
import walk23 from './walk/walk23';
import walk31 from './walk/walk31';
import walk32 from './walk/walk32';
import walk13 from './walk/walk13';
import walk21 from './walk/walk21';
import type { WalkVideo } from './walk/types';
import { drawIris, drawLid, drawSparkle, startBlinking } from './eyeFx';

/* Carousel "Design Process" di halaman detail — mirip section riwayat pekerjaan:
   judul langkah di kiri, karakter di tengah, deskripsi di kanan, titik di bawah.
   Pindah langkah (geser / titik / panah): karakter menoleh, berjalan keluar ke kanan, masuk dari
   kiri, lalu berbalik menghadap depan dengan pose langkah berikutnya. */

const FULL = [...FRAMES.full] as Frame[];
const cut = (a: number, b: number) => FULL.slice(a, b + 1);
const WALK = { turn: cut(12, 33), intro: cut(34, 47), loop: cut(48, 76), outro: cut(77, 90), back: cut(91, 107) };
const POSES = [POSE_FRAMES.papers, POSE_FRAMES.point, POSE_FRAMES.open];
const SWITCH = { sec: 3.4, dist: 0.55, walkCycle: 0.7 }; // dist × lebar panggung; walkCycle × tinggi badan
const CHAR_H = 0.95; // tinggi badan × tinggi panggung
// transisi dari video (pose pegang kertas → pose menunjuk): diputar persis sekecepatan video
const VIDEO = { fadeIn: 0.12, endFade: 0.18 }; // pose diam → frame pertama, frame terakhir → pose diam (detik)
// video per perpindahan langkah (asal>tujuan, mulai 0); yang belum ada memakai jalan lama
const VIDEOS: Record<string, WalkVideo> = { '0>1': walk12, '1>2': walk23, '0>2': walk13, '2>1': walk32, '2>0': walk31, '1>0': walk21 };
const videoLen = (v: WalkVideo) => v.frames.length / v.fps;
const videoDur = (v: WalkVideo) => videoLen(v) + VIDEO.endFade;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const smooth = (k: number) => k * k * (3 - 2 * k);
const pick = (seq: Frame[], k: number) => seq[Math.min(seq.length - 1, Math.max(0, Math.round(clamp01(k) * (seq.length - 1))))];

type Step = { title: string; desc: string };

export default function ProcessCarousel({ label, steps }: { label: string; steps: Step[] }) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0); // teks yang tampil (berganti saat karakter di luar layar)
  const [switching, setSwitching] = useState(false); // selama karakter berjalan, teks disembunyikan
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const anim = useRef<{ from: number; to: number; t0: number; lid: number; raf: number; dur: number; video: WalkVideo | null }>(
    { from: 0, to: 0, t0: -1, lid: 0, raf: 0, dur: SWITCH.sec, video: null });
  const images = useRef(new Map<string, HTMLImageElement>());

  const img = (f: Frame) => {
    let im = images.current.get(f.src);
    if (!im) {
      im = new Image();
      im.decoding = 'async';
      im.src = f.src;
      im.onload = () => draw();
      images.current.set(f.src, im);
    }
    return im;
  };

  // gambar frame f: kepala di x, sol sepatu di y, tinggi badan h (px layar)
  const drawFrame = (ctx: CanvasRenderingContext2D, f: Frame, x: number, y: number, h: number, alpha: number, eyes: boolean, dpr: number) => {
    const im = img(f);
    if (!im.complete || !im.naturalWidth || alpha <= 0.01) return;
    const k = h / f.ch;
    ctx.globalAlpha = alpha;
    ctx.setTransform(k * dpr, 0, 0, k * dpr, (x - f.anchor[0] * k) * dpr, (y - f.anchor[1] * k) * dpr);
    ctx.drawImage(im, 0, 0, f.w, f.h);
    if (eyes) for (const e of f.eyes) { drawIris(ctx, e); drawSparkle(ctx, e, f.eyes.length < 2); drawLid(ctx, e, anim.current.lid); }
    ctx.globalAlpha = 1;
  };

  function draw() {
    const canvas = canvasRef.current, stage = stageRef.current, root = rootRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !stage || !root || !ctx) return;
    // kanvas selebar seluruh carousel (karakter bisa berjalan melewati kolom teks tanpa terpotong);
    // karakter berdiri di tengah kolom panggung
    const W = root.clientWidth, H = root.clientHeight;
    const sr = stage.getBoundingClientRect(), rr = root.getBoundingClientRect();
    const sx = sr.left - rr.left, sy = sr.top - rr.top, SW = sr.width, SH = sr.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const a = anim.current;
    const h = SH * CHAR_H, cx = sx + SW / 2, feet = sy + SH * 0.97;
    const el = a.t0 < 0 ? Infinity : (performance.now() - a.t0) / 1000;
    const jp = a.t0 < 0 ? 1 : clamp01(el / a.dur);
    if (jp >= 1) { drawFrame(ctx, POSES[a.to % POSES.length], cx, feet, h, 1, true, dpr); return; }
    if (a.video) {
      // video: frame sesuai waktu (24 fps), posisi jalan persis seperti di video
      const v = a.video, fr = v.frames, len = videoLen(v);
      const at = (i: number) => fr[Math.min(fr.length - 1, Math.max(0, i))];
      if (el < len) {
        const f = at(Math.floor(el * v.fps));
        const fin = smooth(clamp01(el / VIDEO.fadeIn));
        if (fin < 1) drawFrame(ctx, POSES[a.from % POSES.length], cx, feet, h, 1 - fin, true, dpr);
        if (f) drawFrame(ctx, f, cx, feet, h, fin, false, dpr);
      } else {
        const fb = smooth(seg(el, len, a.dur));
        const f = at(fr.length - 1);
        if (f) drawFrame(ctx, f, cx, feet, h, 1 - fb, false, dpr);
        drawFrame(ctx, POSES[a.to % POSES.length], cx, feet, h, fb, true, dpr);
      }
      return;
    }
    const D = SWITCH.dist * Math.max(SW, W * 0.5);
    const perFrame = (SWITCH.walkCycle * h) / WALK.loop.length;
    if (jp < 0.5) {
      // keluar: menoleh ke kanan → berjalan ke kanan
      const q = jp / 0.5;
      if (q < 0.25) {
        const k = q / 0.25, fb = smooth(seg(k, 0, 0.3));
        drawFrame(ctx, POSES[a.from % POSES.length], cx, feet, h, 1 - fb, true, dpr);
        drawFrame(ctx, pick(WALK.turn, k), cx, feet, h, fb, false, dpr);
      } else {
        const dx = ((q - 0.25) / 0.75) * D, j = Math.floor(dx / perFrame);
        const f = j < WALK.intro.length ? WALK.intro[j] : WALK.loop[(j - WALK.intro.length) % WALK.loop.length];
        drawFrame(ctx, f, cx + dx, feet, h, 1 - smooth(seg(q, 0.8, 1)), false, dpr);
      }
    } else {
      // masuk dari kiri → berbalik ke depan → pose langkah berikutnya
      const q = (jp - 0.5) / 0.5;
      if (q < 0.7) {
        const kk = q / 0.7, dx = -(1 - kk) * D;
        const m = Math.max(0, Math.round((D / perFrame - WALK.outro.length) / WALK.loop.length));
        const total = WALK.loop.length * m + WALK.outro.length;
        const j = Math.min(total - 1, Math.floor(kk * total));
        const f = j < WALK.loop.length * m ? WALK.loop[j % WALK.loop.length] : WALK.outro[j - WALK.loop.length * m];
        drawFrame(ctx, f, cx + dx, feet, h, smooth(seg(q, 0, 0.12)), false, dpr);
      } else if (q < 0.9) {
        drawFrame(ctx, pick(WALK.back, (q - 0.7) / 0.2), cx, feet, h, 1, false, dpr);
      } else {
        const fb = smooth(seg(q, 0.9, 1));
        drawFrame(ctx, WALK.back[WALK.back.length - 1], cx, feet, h, 1 - fb, false, dpr);
        drawFrame(ctx, POSES[a.to % POSES.length], cx, feet, h, fb, true, dpr);
      }
    }
  }

  const loop = () => {
    const a = anim.current;
    draw();
    const el = (performance.now() - a.t0) / 1000;
    const done = a.t0 < 0 || el >= a.dur;
    const swapT = a.video ? Math.max(0, a.video.swapAt) / a.video.fps || videoLen(a.video) * 0.5 : a.dur * 0.5;
    if (a.t0 >= 0 && el >= swapT) setShown(a.to);
    if (a.t0 >= 0 && el >= (a.video ? videoLen(a.video) * 0.8 : a.dur * 0.86)) setSwitching(false);
    if (done) {
      a.t0 = -1; a.raf = 0; setSwitching(false); draw();
      preloadFrom(a.to);
      if (pending.current != null && pending.current !== a.to) { const p = pending.current; pending.current = null; go(p); }
      return;
    }
    a.raf = requestAnimationFrame(loop);
  };

  const pending = useRef<number | null>(null);
  // video transisi dimuat sesuai kebutuhan: hanya yang bisa diputar dari langkah sekarang
  // (semua video ± 18 MB; per langkah ± 5,5 MB)
  const loadedFrom = useRef(new Set<number>());
  const preloadFrom = (step: number) => {
    if (loadedFrom.current.has(step)) return;
    loadedFrom.current.add(step);
    Object.entries(VIDEOS).filter(([k]) => k.startsWith(`${step}>`))
      .forEach(([, v]) => v.frames.forEach((f) => { if (f) img(f); }));
  };
  const go = (i: number) => {
    const a = anim.current;
    const n = Math.min(steps.length - 1, Math.max(0, i));
    if (a.t0 >= 0) { pending.current = n; return; } // tunggu animasi selesai
    if (n === a.to) return;
    a.from = a.to; a.to = n;
    a.video = VIDEOS[`${a.from}>${a.to}`] ?? null;
    a.dur = a.video ? videoDur(a.video) : SWITCH.sec;
    setActive(n);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(n); draw(); return; }
    a.t0 = performance.now();
    setSwitching(true);
    if (!a.raf) a.raf = requestAnimationFrame(loop);
  };

  useEffect(() => {
    // pose diam dimuat dulu; frame jalan dimuat di belakang (dipakai saat pindah langkah)
    POSES.forEach(img);
    // frame jalan & video baru dimuat saat section ini mendekati layar (hemat data di awal halaman)
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      Object.values(WALK).flat().forEach(img);
      preloadFrom(anim.current.to);
    }, { rootMargin: '150% 0px' });
    if (rootRef.current) io.observe(rootRef.current);
    const stopBlink = startBlinking((v) => { anim.current.lid = v; if (anim.current.t0 < 0) draw(); });
    const ro = new ResizeObserver(() => draw());
    if (rootRef.current) ro.observe(rootRef.current);
    draw();
    return () => { io.disconnect(); stopBlink(); ro.disconnect(); cancelAnimationFrame(anim.current.raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // geser (jari / mouse), roda horizontal trackpad, tombol panah
  const drag = useRef<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  // pindah langkah hanya lewat geser kanan-kiri, titik, atau tombol panah (bukan scroll)
  const goTo = (i: number) => go(i);
  // tombol panah kiri/kanan selama carousel ada di tengah layar (tanpa fokus → halaman tidak melompat)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r || r.top > window.innerHeight * 0.5 || r.bottom < window.innerHeight * 0.5) return;
      if (e.key === 'ArrowRight') goTo(activeRef.current + 1);
      else if (e.key === 'ArrowLeft') goTo(activeRef.current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const wheel = useRef({ x: 0, t: 0 });
  const step = steps[shown];

  return (
    <div
      ref={rootRef}
      className={`pc${switching ? ' is-switching' : ''}`}
      aria-roledescription="carousel"
      aria-label={label}
      onPointerDown={(e) => { if (!(e.target as HTMLElement).closest('button')) drag.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={(e) => {
        const d = drag.current; drag.current = null;
        if (!d) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) goTo(active + (dx < 0 ? 1 : -1));
      }}
      onWheel={(e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        const now = performance.now();
        if (now - wheel.current.t > 400) wheel.current.x = 0;
        wheel.current.t = now;
        wheel.current.x += e.deltaX;
        if (Math.abs(wheel.current.x) > 60) { goTo(active + Math.sign(wheel.current.x)); wheel.current.x = -1e6 * Math.sign(wheel.current.x); }
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <canvas ref={canvasRef} className="pc-canvas" role="img" aria-label="Faiz, karakter 3D" />
      <p className="pc-label">{label}</p>
      <div className="pc-row">
        <div className="pc-left">
          <div key={`t-${shown}`} className="pc-swap">
            <span className="pc-num">{String(shown + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
            <h3 className="pc-title">{step.title}</h3>
          </div>
        </div>
        <div className="pc-stage" ref={stageRef}>
        </div>
        <div className="pc-right">
          <p key={`d-${shown}`} className="pc-desc pc-swap">{step.desc}</p>
        </div>
      </div>
      <div className="pc-dots" role="tablist">
        {steps.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={s.title}
            onClick={() => goTo(i)}
            style={{ width: i === active ? 28 : 10, background: i === active ? THEME.logoCoral : 'rgba(33,33,33,0.22)' }}
          />
        ))}
      </div>
    </div>
  );
}
