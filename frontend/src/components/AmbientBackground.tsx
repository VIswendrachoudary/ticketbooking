import React, { useEffect, useState } from 'react';

export const AmbientBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 40 - 20,
        y: (e.clientY / window.innerHeight) * 40 - 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#030712]">
      {/* Animated Floating Light Orbs */}
      <div
        className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-600/25 via-purple-600/20 to-transparent blur-3xl transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px)`,
        }}
      />

      <div
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-purple-600/25 via-indigo-600/15 to-transparent blur-3xl transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${-mousePos.x * 1.2}px, ${-mousePos.y * 1.2}px)`,
        }}
      />

      <div
        className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-t from-amber-500/15 via-purple-600/10 to-transparent blur-3xl transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
        }}
      />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};
