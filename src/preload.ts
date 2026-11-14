import { PRELOAD_IMAGES, PRELOAD_VIDEOS } from './config';

// Aset hero: bust + frame karakter (lihat config.ts)
export { PRELOAD_IMAGES, PRELOAD_VIDEOS };

/**
 * Preloads all assets defined in config in parallel.
 * Returns a promise that resolves when every asset is ready.
 * Also accepts an `onProgress` callback (0–1).
 */
export function preloadAssets(
  onProgress?: (progress: number) => void
): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  // Images — use img.decode() for full decode guarantee
  for (const src of PRELOAD_IMAGES) {
    const img = new Image();
    img.src = src;
    tasks.push(
      img.decode().catch(() => {
        // Non-fatal: image failed to load, still count it as done
      })
    );
  }

  // Videos — just load metadata so the browser has the resource
  for (const src of PRELOAD_VIDEOS) {
    tasks.push(
      new Promise<void>((resolve) => {
        const v = document.createElement('video');
        v.preload = 'auto';
        v.src = src;
        v.addEventListener('canplaythrough', () => resolve(), { once: true });
        v.addEventListener('error', () => resolve(), { once: true });
        v.load();
      })
    );
  }

  if (tasks.length === 0) {
    onProgress?.(1);
    return Promise.resolve();
  }

  let done = 0;
  const total = tasks.length;

  return Promise.all(
    tasks.map((t) =>
      t.finally(() => {
        done++;
        onProgress?.(done / total);
      })
    )
  ).then(() => undefined);
}
