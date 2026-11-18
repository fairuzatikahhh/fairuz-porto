import { useState, useCallback, useEffect } from 'react';
import Loader from './components/Loader';
import SlideStory from './components/SlideStory';
import ProjectSection from './components/ProjectSection';
import Navbar from './components/Navbar';
import ContactSection from './components/ContactSection';
import MobileStory from './components/MobileStory';
import { initSmoothScroll } from './smoothScroll';

const LOADER_VISITED_KEY = 'portfolio_loader_visited';

function shouldShowLoader(): boolean {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.has('eyeTest') || params.get('debug') === '1' || params.has('noLoader')) return false;
  }
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
      };
      window.addEventListener('loader:exit', handleExit, { once: true });
      return () => {
        document.body.style.overflow = prevOverflow;
        lenis?.start();
        window.removeEventListener('loader:exit', handleExit);
      };
    }
  }, [loaderVisible]);

  const handleLoaderDone = useCallback(() => {
    sessionStorage.setItem(LOADER_VISITED_KEY, '1');
    // Remove loader overlay from DOM once fade-out completes
    setTimeout(() => {
      setLoaderVisible(false);
    }, 100);
  }, []);

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
