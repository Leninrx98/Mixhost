import React, { useState, useEffect } from 'react';

export default function MixiHeroAnimation({ className = "w-48 h-48" }) {
  const [currentFrame, setCurrentFrame] = useState(1);
  const totalFrames = 8;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev % totalFrames) + 1);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-48 h-48 md:w-52 md:h-52 flex items-center justify-center shrink-0 overflow-hidden">
      <img
        src={`/mixi_hero/frame_${currentFrame}.png`}
        alt="Mixi Hero Animation"
        onError={() => setCurrentFrame(1)}
        className="w-full h-full object-contain select-none filter drop-shadow-[0_4px_16px_rgba(168,85,247,0.4)] pointer-events-none"
      />
    </div>
  );
}