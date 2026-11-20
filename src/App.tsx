import { useState, useCallback, useEffect } from 'react';
import Loader from './components/Loader';
import SlideStory from './components/SlideStory';
import ProjectSection from './components/ProjectSection';
import Navbar from './components/Navbar';
import ContactSection from './components/ContactSection';
import MobileStory from './components/MobileStory';
import ProjectDetail from './components/ProjectDetail';
import { initSmoothScroll } from './smoothScroll';
import { detailSlugFromPath, findProject } from './projectDetails';
import { hashTarget, scrollToHash } from './scrollToHash';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// halaman detail project (/project/<slug>) atau halaman utama
const DETAIL = detailSlugFromPath();
// di halaman detail tidak ada loader → elemen yang menunggu "loader:exit" langsung tampil
if (DETAIL) document.documentElement.dataset.loader = 'done';
// datang dengan #hash ke halaman utama: hash disimpan lalu dilepas dari URL supaya browser tidak
// melompat sendiri (posisinya salah karena section yang di-pin); lompatan dilakukan scrollToHash
const START_HASH = !DETAIL && window.location.hash ? window.location.hash : '';
if (START_HASH) {
  history.scrollRestoration = 'manual';
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
// ScrollTrigger masih bisa menghitung ulang posisi pin setelah halaman termuat (gambar, font)
// → lompat, lalu periksa sekali lagi dan ulangi kalau posisinya bergeser
const jumpToStartHash = () => {
  const jump = () => scrollToHash(START_HASH, false);
  setTimeout(() => {
    ScrollTrigger.refresh();
    if (!jump()) return;
    history.replaceState(null, '', window.location.pathname + window.location.search + START_HASH);
    setTimeout(() => {
      const y = hashTarget(START_HASH);
      if (y != null && Math.abs(window.scrollY - y) > 20) jump();
    }, 900);
  }, 400);
};

const LOADER_VISITED_KEY = 'portfolio_loader_visited';

function shouldShowLoader(): boolean {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.has('eyeTest') || params.get('debug') === '1' || params.has('noLoader')) return false;
  }
  if (DETAIL) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (sessionStorage.getItem(LOADER_VISITED_KEY)) return false;
  return true;
}

export default function App() {
  const [loaderVisible, setLoaderVisible] = useState(() => shouldShowLoader());

  // smooth scroll (Lenis) untuk seluruh halaman
  useEffect(() => {
    initSmoothScroll();
  }, []);

  useEffect(() => {
    if (loaderVisible) {
      window.scrollTo(0, 0);
      const lenis = initSmoothScroll();
      lenis?.stop(); // jangan scroll selama loader tampil
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleExit = () => {
        document.body.style.overflow = prevOverflow;
        window.scrollTo(0, 0);
        lenis?.scrollTo(0, { immediate: true });
        lenis?.start();
        // dibuka dengan #hash (mis. /#project) → setelah loader, langsung ke section itu
        if (START_HASH) jumpToStartHash();
      };
      window.addEventListener('loader:exit', handleExit, { once: true });
      return () => {
        document.body.style.overflow = prevOverflow;
        lenis?.start();
        window.removeEventListener('loader:exit', handleExit);
      };
    }
  }, [loaderVisible]);

  // datang dengan #hash (mis. kembali dari halaman detail ke /#project): tunggu semua section
  // ter-pin & terukur, lalu lompat ke posisinya
  useEffect(() => {
    if (!START_HASH || loaderVisible) return;
    const go = jumpToStartHash;
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
    return () => window.removeEventListener('load', go);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoaderDone = useCallback(() => {
    sessionStorage.setItem(LOADER_VISITED_KEY, '1');
    // Remove loader overlay from DOM once fade-out completes
    setTimeout(() => {
      setLoaderVisible(false);
    }, 100);
  }, []);

  if (DETAIL) {
    return (
      <>
        <Navbar />
        <ProjectDetail project={findProject(DETAIL)!} />
      </>
    );
  }

  return (
    <>
      <Navbar />
      {/* penanda "About" di desktop: titik scroll saat teks perkenalan tampil penuh (± 70% story) */}
      <div style={{ position: 'relative' }}>
        <SlideStory />
        <span id="about-desktop" aria-hidden style={{ position: 'absolute', left: 0, top: 'calc(13.35 * 100vh * 0.7)', height: 1, width: 1 }} />
      </div>
      <MobileStory />
      <ProjectSection />
      <ContactSection />

      {/* Full-screen Loader sits on top until complete */}
      {loaderVisible && <Loader onDone={handleLoaderDone} />}
    </>
  );
}
