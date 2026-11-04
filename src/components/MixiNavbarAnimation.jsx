import React, { useState, useEffect } from "react";

export default function MixiNavbarAnimation() {
  const [currentFrame, setCurrentFrame] = useState(1);
  const totalFrames = 8;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev % totalFrames) + 1);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-full bg-purple-950/40 border border-purple-500/30 flex items-center justify-center overflow-hidden shrink-0 select-none shadow-sm shadow-purple-500/20">
      <img
        src={`/mixi_hero/frame_${currentFrame}.png`}
        alt="MixHost Nav Logo"
        onError={() => setCurrentFrame(1)}
        className="w-full h-full object-contain scale-125 pointer-events-none"
      />
    </div>
  );
}
