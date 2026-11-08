// ─── Theme & Layout Configuration ─────────────────────────────────────────────
export const THEME = {
  pageBg: '#DAD8D6',         // Flat light grey-beige page background (matches Framer)
  text: '#212121',           // Primary dark text (Montserrat)
  descriptionText: '#000000', // Bottom-right description text (Inter)
  logoCoral: '#DC6341',      // Faiz logo coral
  buttonBg: '#EE8162',       // Lets Contact pill button coral
  buttonText: '#FFFFFF',     // White button text
};

// ─── Loader configuration ───────────────────────────────────────────────────
export const VIDEO_DURATION = 5.8;
export const HOLD_DURATION = 0.6;
export const SKIP_DELAY = 1.0;

export const LOADER_COUNTER_STYLES = {
  fontSize: 'clamp(7rem, 16vw, 18rem)',
  fontWeight: 300,
  lineHeight: 0.8,
  letterSpacing: '-0.04em',
  fontVariantNumeric: 'tabular-nums',
  padding: 'clamp(1rem, 3vw, 3rem)',
  zIndex: 20,
};

// ─── Eye Tracking & Real Mask Configuration ────────────────────────────────────
// Real eyelid-opening bounds extracted programmatically from base.png (1790x2400)
export interface EyeBox {
  left: number;    // % from left of base.png
  top: number;     // % from top of base.png
  width: number;   // % of base.png width
  height: number;  // % of base.png height
  maskUrl: string; // real eye-opening mask PNG
}

export const EYE_CONFIG = {
  leftEye: {
    left: 34.972,
    top: 29.917,
    width: 9.050,
    height: 4.583,
    maskUrl: '/assets/left-eye-mask.png',
  } as EyeBox,

  rightEye: {
    left: 56.425,
    top: 29.583,
    width: 9.553,
    height: 5.000,
    maskUrl: '/assets/right-eye-mask.png',
  } as EyeBox,

  // Shared iris tuning (matches reference: diameter ~55% of eye-opening width)
  iris: {
    sizePercent: 55,       // % of eye-opening width
    noseOffsetPercent: 10, // % of eye width shifted toward nose from center
    verticalOffsetPercent: 5, // % shifted down so bottom touches lower lid & top is tucked under upper lid
  },

  movement: {
    maxX: 4.5, // max horizontal iris travel (px)
    maxY: 2.8, // max vertical iris travel (px)
  },

  parallax: {
    maxTranslate: 4, // max head parallax translate (px)
    maxRotate: 1.2,  // max head parallax rotation (deg)
  },
};

// ─── Asset Preload List ──────────────────────────────────────────────────────
export const PRELOAD_IMAGES: string[] = [
  '/assets/base.png',
  '/assets/eyes.png',
  '/assets/left-eye-mask.png',
  '/assets/right-eye-mask.png',
  '/assets/slide-track-clean.png',
];

export const PRELOAD_VIDEOS: string[] = [];
