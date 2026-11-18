import type { Eye } from './frames';

/* Efek mata "hidup" untuk karakter yang digambar di canvas (koordinat frame):
   cincin iris, kilau, dan kelopak untuk kedip. Sama dengan yang dipakai di SlideStory. */

export const EYE_FX = {
  blinkEvery: [2.2, 4.8] as const, // jeda acak antar kedip (detik)
  blinkClose: 0.07,
  blinkHold: 0.05,
  blinkOpen: 0.11,
  doubleChance: 0.2,
  sparkle: 0.9,
  irisGlow: 0.6,
};

export function drawIris(ctx: CanvasRenderingContext2D, e: Eye) {
  if (EYE_FX.irisGlow <= 0) return;
  const r = e.pr;
  const ring = (a: number) => {
    const g = ctx.createRadialGradient(e.px, e.py, 0, e.px, e.py, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.44, 'rgba(0,0,0,0)');
    g.addColorStop(0.6, `rgba(196,128,70,${a})`);
    g.addColorStop(0.86, `rgba(176,108,56,${a * 0.6})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(e.px, e.py, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(e.cx, e.cy, e.rx, e.ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalCompositeOperation = 'screen';
  ring(0.3 * EYE_FX.irisGlow);
  ctx.beginPath();
  ctx.rect(e.px - r, e.py, r * 2, r);
  ctx.clip();
  ring(0.28 * EYE_FX.irisGlow);
  ctx.restore();
}

export function drawSparkle(ctx: CanvasRenderingContext2D, e: Eye, side: boolean) {
  if (EYE_FX.sparkle <= 0) return;
  const r = e.pr * (side ? 0.8 : 1.12);
  const ox = side ? 0.12 : 0.32, oy = side ? 0.2 : 0.34;
  const sx = e.px + r * ox, sy = e.py - r * oy;
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.3);
  glow.addColorStop(0, `rgba(255,255,255,${0.95 * EYE_FX.sparkle})`);
  glow.addColorStop(0.55, `rgba(255,255,255,${0.75 * EYE_FX.sparkle})`);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sx, sy, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  if (side) return;
  ctx.fillStyle = `rgba(255,255,255,${0.55 * EYE_FX.sparkle})`;
  ctx.beginPath();
  ctx.arc(e.px - r * 0.28, e.py + r * 0.3, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

// c: 0 = terbuka, 1 = tertutup penuh
export function drawLid(ctx: CanvasRenderingContext2D, e: Eye, c: number) {
  if (c <= 0.01) return;
  const rx = e.rx * 1.18, ry = e.ry * 1.14;
  const top = e.cy - ry, lidY = top + c * ry * 2;
  const [r, g, b] = e.skin;
  ctx.save();
  ctx.beginPath();
  ctx.rect(e.cx - rx, top, rx * 2, lidY - top);
  ctx.clip();
  ctx.translate(e.cx, e.cy);
  ctx.scale(1, ry / rx);
  const grad = ctx.createRadialGradient(0, -rx * 0.2, 0, 0, 0, rx);
  grad.addColorStop(0, `rgba(${Math.min(255, Math.round(r * 1.02))},${Math.min(255, Math.round(g * 1.02))},${Math.min(255, Math.round(b * 1.02))},1)`);
  grad.addColorStop(0.7, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.86, `rgba(${Math.round(r * 0.96)},${Math.round(g * 0.93)},${Math.round(b * 0.93)},0.85)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const ryO = e.ry * 1.06;
  const lidO = e.cy - ryO + c * ryO * 2;
  if (c > 0.2) {
    ctx.strokeStyle = `rgba(52,32,28,${Math.min(1, (c - 0.2) * 1.6)})`;
    ctx.lineWidth = Math.max(1, e.ry * 0.2);
    ctx.lineCap = 'round';
    ctx.beginPath();
    const ly = lidO - ryO * 0.18;
    ctx.moveTo(e.cx - e.rx * 1.02, ly - ryO * 0.18);
    ctx.quadraticCurveTo(e.cx, ly + ryO * 0.2 * c, e.cx + e.rx * 1.02, ly - ryO * 0.18);
    ctx.stroke();
  }
}

/* Kedip otomatis berbasis waktu. onFrame dipanggil tiap frame selama kedip berlangsung. */
export function startBlinking(onFrame: (lid: number) => void) {
  const len = EYE_FX.blinkClose + EYE_FX.blinkHold + EYE_FX.blinkOpen;
  let start = -1, timer = 0, raf = 0;
  const amount = () => {
    if (start < 0) return 0;
    const e = (performance.now() - start) / 1000;
    if (e < EYE_FX.blinkClose) return e / EYE_FX.blinkClose;
    if (e < EYE_FX.blinkClose + EYE_FX.blinkHold) return 1;
    if (e < len) return 1 - (e - EYE_FX.blinkClose - EYE_FX.blinkHold) / EYE_FX.blinkOpen;
    return 0;
  };
  const tick = () => {
    onFrame(amount());
    if ((performance.now() - start) / 1000 < len) raf = requestAnimationFrame(tick);
    else { start = -1; onFrame(0); }
  };
  const schedule = (soon = false) => {
    const [a, b] = EYE_FX.blinkEvery;
    const wait = soon ? 0.18 : a + Math.random() * (b - a);
    timer = window.setTimeout(() => {
      start = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
      schedule(!soon && Math.random() < EYE_FX.doubleChance);
    }, (wait + (soon ? len : 0)) * 1000);
  };
  schedule();
  return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
}
