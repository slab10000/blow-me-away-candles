import React from 'react';

/** Pixel layout from Hero (computed from background image so position/size stay fixed on resize). */
type FlameProps = {
  layout: { left: number; top: number; width: number; height: number };
};

const Flame: React.FC<FlameProps> = ({ layout }) => {
  return (
    <div
      className="absolute pointer-events-none z-[1]"
      style={{
        left: layout.left,
        top: layout.top,
        width: layout.width,
        height: layout.height,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="hero-flame-sway relative w-full h-full"
        style={{
          transformOrigin: '50% 100%',
          filter: 'blur(2px)',
        }}
      >
        {/* Outer glow (blurred) */}
        <div
          className="hero-flame-glow absolute inset-0 rounded-[50%_50%_30%_30%]"
          style={{
            background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(200,150,255,0.5) 0%, rgba(140,80,255,0.25) 40%, transparent 70%)',
            filter: 'blur(6px)',
            transformOrigin: '50% 100%',
          }}
        />
        {/* Middle flame */}
        <div
          className="hero-flame-middle absolute inset-0 rounded-[50%_50%_25%_25%]"
          style={{
            background: 'linear-gradient(to top, rgba(40,20,80,0.4) 0%, rgba(140,80,255,0.9) 35%, rgba(200,180,255,0.95) 70%, rgba(245,240,255,0.9) 100%)',
            transformOrigin: '50% 100%',
            boxShadow: '0 0 20px rgba(160,100,255,0.4)',
          }}
        />
        {/* Inner core (bright) */}
        <div
          className="hero-flame-core absolute left-1/2 bottom-0 w-1/3 rounded-[50%_50%_20%_20%]"
          style={{
            height: '75%',
            background: 'linear-gradient(to top, rgba(50,20,80,0.3) 0%, rgba(220,200,255,0.95) 40%, rgba(255,250,255,0.98) 100%)',
            transformOrigin: '50% 100%',
            boxShadow: '0 0 15px rgba(230,210,255,0.6)',
          }}
        />
      </div>
    </div>
  );
};

export default Flame;
