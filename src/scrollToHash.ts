import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DESKTOP_MQ } from './config';
import { getLenis } from './smoothScroll';

/* Lompat ke section di halaman utama. Lompatan bawaan browser (#hash) tidak tahu soal section
   yang di-pin GSAP, jadi posisinya dihitung di sini:
   - #about di desktop: titik saat teks perkenalan tampil penuh di dalam animasi scroll
   - #project di desktop: setelah kartu galeri 3D selesai menyebar
   - lainnya: awal section (awal area pin kalau section-nya dipin) */
export function hashTarget(hash: string): number | null {
  const desktop = window.matchMedia(DESKTOP_MQ).matches;
  const id = hash.replace(/^#/, '');
  if (!id) return 0;
  const el = document.getElementById(desktop && id === 'about' ? 'about-desktop' : id);
  if (!el) return null;
  const st = ScrollTrigger.getAll().find((t) => t.trigger === el && t.pin);
  if (st) return desktop && id === 'project' ? st.start + (st.end - st.start) * 0.85 : st.start;
  return el.getBoundingClientRect().top + window.scrollY;
}

export function scrollToHash(hash: string, smooth = true): boolean {
  const y = hashTarget(hash);
  if (y == null) return false;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, smooth ? { duration: 1.4 } : { immediate: true });
  else window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
  return true;
}
