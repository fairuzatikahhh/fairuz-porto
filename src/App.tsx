import { useState, useCallback, useEffect } from 'react';
import Loader from './components/Loader';
import SlideStory from './components/SlideStory';

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

  useEffect(() => {
    if (loaderVisible) {
      window.scrollTo(0, 0);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleExit = () => {
        document.body.style.overflow = prevOverflow;
        window.scrollTo(0, 0);
      };
      window.addEventListener('loader:exit', handleExit, { once: true });
      return () => {
        document.body.style.overflow = prevOverflow;
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
      <SlideStory />

      {/* Full-screen Loader sits on top until complete */}
      {loaderVisible && <Loader onDone={handleLoaderDone} />}
    </>
  );
}
