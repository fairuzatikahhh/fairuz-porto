import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { EYE_CONFIG, EyeParams } from '../config';

interface EyesProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function Eyes({ containerRef }: EyesProps) {
  const [debugMode, setDebugMode] = useState(false);
  const [config, setConfig] = useState<{ leftEye: EyeParams; rightEye: EyeParams }>({
    leftEye: { ...EYE_CONFIG.leftEye },
    rightEye: { ...EYE_CONFIG.rightEye },
  });

  const leftIrisRef = useRef<HTMLImageElement>(null);
  const rightIrisRef = useRef<HTMLImageElement>(null);

  // quickTo setters
  const quickLeftX = useRef<((v: number) => void) | null>(null);
  const quickLeftY = useRef<((v: number) => void) | null>(null);
  const quickRightX = useRef<((v: number) => void) | null>(null);
  const quickRightY = useRef<((v: number) => void) | null>(null);

  // Check URL for ?debug=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1') {
        setDebugMode(true);
      }
    }
  }, []);

  // Set up gsap quickTo for both irises
  useEffect(() => {
    if (!leftIrisRef.current || !rightIrisRef.current) return;

    quickLeftX.current = gsap.quickTo(leftIrisRef.current, 'x', {
      duration: 0.35,
      ease: 'power2.out',
    });
    quickLeftY.current = gsap.quickTo(leftIrisRef.current, 'y', {
      duration: 0.35,
      ease: 'power2.out',
    });
    quickRightX.current = gsap.quickTo(rightIrisRef.current, 'x', {
      duration: 0.35,
      ease: 'power2.out',
    });
    quickRightY.current = gsap.quickTo(rightIrisRef.current, 'y', {
      duration: 0.35,
      ease: 'power2.out',
    });

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize pointer to -1..1 over the window
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;

      const targetX = normX * EYE_CONFIG.movement.maxX;
      const targetY = normY * EYE_CONFIG.movement.maxY;

      // Both irises move together
      quickLeftX.current?.(targetX);
      quickLeftY.current?.(targetY);
      quickRightX.current?.(targetX);
      quickRightY.current?.(targetY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Debug drag handler
  const activeDrag = useRef<{
    eyeKey: 'leftEye' | 'rightEye';
    action: 'move' | 'resize';
    startX: number;
    startY: number;
    initialEye: EyeParams;
  } | null>(null);

  const startDrag = useCallback(
    (
      eyeKey: 'leftEye' | 'rightEye',
      action: 'move' | 'resize',
      e: React.MouseEvent
    ) => {
      e.preventDefault();
      e.stopPropagation();
      activeDrag.current = {
        eyeKey,
        action,
        startX: e.clientX,
        startY: e.clientY,
        initialEye: { ...config[eyeKey] },
      };
    },
    [config]
  );

  useEffect(() => {
    if (!debugMode) return;

    const handlePointerMove = (e: MouseEvent) => {
      if (!activeDrag.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const { eyeKey, action, startX, startY, initialEye } = activeDrag.current;

      const deltaXPct = ((e.clientX - startX) / rect.width) * 100;
      const deltaYPct = ((e.clientY - startY) / rect.height) * 100;

      setConfig((prev) => {
        const eye = { ...prev[eyeKey] };
        if (action === 'move') {
          eye.cx = parseFloat((initialEye.cx + deltaXPct).toFixed(2));
          eye.cy = parseFloat((initialEye.cy + deltaYPct).toFixed(2));
        } else if (action === 'resize') {
          eye.maskWidth = Math.max(1, parseFloat((initialEye.maskWidth + deltaXPct).toFixed(2)));
          eye.maskHeight = Math.max(0.5, parseFloat((initialEye.maskHeight + deltaYPct).toFixed(2)));
          eye.irisWidth = eye.maskWidth * 0.95;
          eye.irisHeight = eye.maskWidth * 0.95;
        }

        const nextConfig = { ...prev, [eyeKey]: eye };
        console.log(
          `DEBUG MODE - ${eyeKey} updated:\n` +
            JSON.stringify(nextConfig, null, 2)
        );
        return nextConfig;
      });
    };

    const handlePointerUp = () => {
      activeDrag.current = null;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [debugMode, containerRef]);

  const renderEye = (
    eyeKey: 'leftEye' | 'rightEye',
    eye: EyeParams,
    irisRef: React.RefObject<HTMLImageElement | null>
  ) => {
    return (
      <div
        key={eyeKey}
        style={{
          position: 'absolute',
          left: `${eye.cx}%`,
          top: `${eye.cy}%`,
          transform: `translate(-50%, -50%) rotate(${eye.rotate || 0}deg)`,
          width: `${eye.maskWidth}%`,
          height: `${eye.maskHeight}%`,
          pointerEvents: debugMode ? 'auto' : 'none',
          zIndex: 5,
        }}
      >
        {/* Elliptical Mask matching the eye opening */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: debugMode ? '1.5px dashed #FF7A59' : 'none',
            background: debugMode ? 'rgba(255, 122, 89, 0.15)' : 'transparent',
          }}
        >
          {/* Iris element using eyes.png */}
          <img
            ref={irisRef}
            src="/assets/eyes.png"
            alt={`${eyeKey} iris`}
            style={{
              position: 'relative',
              width: '120%',
              height: '120%',
              objectFit: 'contain',
              pointerEvents: 'none',
              userSelect: 'none',
              willChange: 'transform',
            }}
          />
        </div>

        {/* Debug handles */}
        {debugMode && (
          <>
            {/* Center move handle */}
            <div
              onMouseDown={(e) => startDrag(eyeKey, 'move', e)}
              title={`Drag to move ${eyeKey} center`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 14,
                height: 14,
                transform: 'translate(-50%, -50%)',
                background: '#FF7A59',
                borderRadius: '50%',
                border: '2px solid #FFFFFF',
                cursor: 'grab',
                zIndex: 10,
              }}
            />
            {/* Resize handle */}
            <div
              onMouseDown={(e) => startDrag(eyeKey, 'resize', e)}
              title={`Drag to resize ${eyeKey} mask`}
              style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 10,
                height: 10,
                background: '#4ADE80',
                borderRadius: 2,
                border: '1.5px solid #FFFFFF',
                cursor: 'se-resize',
                zIndex: 10,
              }}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {renderEye('leftEye', config.leftEye, leftIrisRef)}
      {renderEye('rightEye', config.rightEye, rightIrisRef)}

      {/* Debug Mode HUD Panel */}
      {debugMode && (
        <div
          style={{
            position: 'fixed',
            top: '5rem',
            right: '2rem',
            background: 'rgba(22, 21, 28, 0.95)',
            border: '1px solid #FF7A59',
            borderRadius: '12px',
            padding: '1.25rem',
            zIndex: 99999,
            color: '#F5F0EE',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            maxWidth: '340px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              color: '#FF7A59',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>EYE DEBUG MODE (?debug=1)</span>
          </div>
          <p style={{ margin: '0.25rem 0', opacity: 0.8, fontSize: '0.75rem' }}>
            Orange handle = Move center
            <br />
            Green handle = Resize mask
          </p>
          <pre
            style={{
              background: '#0D0C10',
              padding: '0.5rem',
              borderRadius: '6px',
              overflow: 'auto',
              maxHeight: '180px',
              marginTop: '0.5rem',
            }}
          >
            {JSON.stringify(config, null, 2)}
          </pre>
          <button
            onClick={() => {
              console.log('FINAL EYE_CONFIG:\n', JSON.stringify(config, null, 2));
              navigator.clipboard?.writeText(JSON.stringify(config, null, 2));
              alert('Config logged to console and copied to clipboard!');
            }}
            style={{
              marginTop: '0.75rem',
              width: '100%',
              padding: '0.5rem',
              background: '#FF7A59',
              color: '#16151C',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Log to Console & Copy
          </button>
        </div>
      )}
    </>
  );
}
