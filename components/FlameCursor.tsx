import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
  duration: number;
}

let sparkId = 0;

const SPARK_COLORS = [
  '#ff6600', '#ff8800', '#ffaa00', '#ffcc33',
  '#ffdd55', '#ff4400', '#ffe0a0', '#fff5e1',
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const FlameCursor: React.FC = () => {
  const flameRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const smoothPos = useRef({ x: -100, y: -100 });
  const rafRef = useRef(0);
  const inZone = useRef(false);
  const flameOpacity = useRef(0);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [hasPointer, setHasPointer] = useState(false);
  const visible = useRef(false);

  // Only activate on devices with a fine pointer (no touch-only)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setHasPointer(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setHasPointer(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Mouse tracking + animation loop
  useEffect(() => {
    if (!hasPointer) return;

    const handleMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };

      // Check if cursor is inside a flame-zone
      const target = e.target as Element;
      const isInZone = !!target.closest('.flame-zone');
      inZone.current = isInZone;

      if (!visible.current) {
        visible.current = true;
        smoothPos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleLeave = () => {
      visible.current = false;
      inZone.current = false;
    };

    const handleEnter = () => {
      visible.current = true;
    };

    const animate = () => {
      const t = targetPos.current;
      const s = smoothPos.current;

      // Smooth follow with lerp
      s.x = lerp(s.x, t.x, 0.18);
      s.y = lerp(s.y, t.y, 0.18);

      // Smoothly fade flame in/out based on zone
      const targetOpacity = inZone.current && visible.current ? 1 : 0;
      flameOpacity.current = lerp(flameOpacity.current, targetOpacity, 0.12);

      if (flameRef.current) {
        flameRef.current.style.transform = `translate(${s.x}px, ${s.y}px)`;
        flameRef.current.style.opacity = String(flameOpacity.current);
      }

      if (glowRef.current) {
        const glowAlpha = 0.09 * flameOpacity.current;
        const darkAlpha = 0.015 * flameOpacity.current;
        glowRef.current.style.background =
          `radial-gradient(circle 280px at ${s.x}px ${s.y}px, rgba(255, 155, 50, ${glowAlpha}), rgba(0, 0, 0, ${darkAlpha}) 100%)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    document.documentElement.classList.add('flame-cursor-active');
    window.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    document.addEventListener('mouseenter', handleEnter);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove('flame-cursor-active');
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      document.removeEventListener('mouseenter', handleEnter);
      cancelAnimationFrame(rafRef.current);
    };
  }, [hasPointer]);

  // Click explosion — only in flame zones
  const handleClick = useCallback((e: MouseEvent) => {
    if (!inZone.current) return;

    const count = 10 + Math.floor(Math.random() * 6);
    const newSparks: Spark[] = Array.from({ length: count }, () => ({
      id: sparkId++,
      x: e.clientX,
      y: e.clientY,
      angle: Math.random() * Math.PI * 2,
      distance: 25 + Math.random() * 70,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      size: 2 + Math.random() * 5,
      duration: 0.35 + Math.random() * 0.3,
    }));

    setSparks(prev => [...prev, ...newSparks]);

    setTimeout(() => {
      setSparks(prev => prev.filter(s => !newSparks.includes(s)));
    }, 700);
  }, []);

  useEffect(() => {
    if (!hasPointer) return;
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [hasPointer, handleClick]);

  if (!hasPointer) return null;

  return (
    <>
      {/* Warm glow that follows cursor — simulates light cast */}
      <div
        ref={glowRef}
        className="fixed inset-0 pointer-events-none z-[9997]"
        style={{ willChange: 'background' }}
      />

      {/* Flame at cursor */}
      <div
        ref={flameRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ transform: 'translate(-100px, -100px)', opacity: 0, willChange: 'transform, opacity' }}
      >
        {/* Flame container — tip of the flame sits at the cursor point */}
        <div className="flame-container">
          {/* Ambient halo */}
          <div className="flame-halo" />
          {/* Outer flame body */}
          <div className="flame-outer" />
          {/* Mid flame */}
          <div className="flame-mid" />
          {/* Inner bright core */}
          <div className="flame-inner" />
        </div>
      </div>

      {/* Click spark particles */}
      <div className="fixed inset-0 pointer-events-none z-[9998]">
        <AnimatePresence>
          {sparks.map(s => {
            const dx = Math.cos(s.angle) * s.distance;
            const dy = Math.sin(s.angle) * s.distance;

            return (
              <motion.div
                key={s.id}
                initial={{
                  x: s.x,
                  y: s.y,
                  scale: 1.2,
                  opacity: 1,
                }}
                animate={{
                  x: s.x + dx,
                  y: s.y + dy - 15,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: s.duration,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  width: s.size,
                  height: s.size,
                  borderRadius: '50%',
                  backgroundColor: s.color,
                  boxShadow: `0 0 ${s.size + 3}px ${s.color}, 0 0 ${s.size + 8}px ${s.color}40`,
                }}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
};

export default FlameCursor;
