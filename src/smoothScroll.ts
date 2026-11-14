/*
 * Smooth scroll dengan inersia (Lenis), disambungkan ke GSAP ScrollTrigger.
 *
 * Hentakan mouse wheel / trackpad diubah jadi gerakan meluncur yang melambat perlahan,
 * jadi semua animasi yang mengikuti scroll ikut halus (tidak tersendat per "klik").
 * Dimatikan untuk pengguna yang memilih "reduce motion". Di layar sentuh, scroll asli
 * perangkat tetap dipakai (sudah punya inersia sendiri).
 */
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const SMOOTH = {
  lerp: 0.085,         // kehalusan: makin kecil makin "meluncur" (0.05–0.12 wajar)
  wheelMultiplier: 0.9 // jarak per putaran wheel
};

let lenis: Lenis | null = null;

export function initSmoothScroll(): Lenis | null {
  if (lenis || typeof window === 'undefined') return lenis;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  lenis = new Lenis({ lerp: SMOOTH.lerp, wheelMultiplier: SMOOTH.wheelMultiplier, syncTouch: false });
  // ScrollTrigger membaca posisi scroll setiap Lenis bergerak, dan Lenis digerakkan oleh ticker GSAP
  // (satu loop animasi untuk semuanya → tidak ada frame yang telat/dobel)
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const getLenis = () => lenis;
