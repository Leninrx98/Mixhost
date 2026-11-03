import React, { useState, useEffect } from 'react';

export default function AnimatedEmote({ character, emoteId, totalFrames = 4, className = "w-8 h-8" }) {
  const [currentFrame, setCurrentFrame] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev % totalFrames) + 1);
    }, 180);

    return () => clearInterval(interval);
  }, [totalFrames]);

  const imageSrc = `/emotes/${character}/${emoteId}/frame_${currentFrame}.png`;

  return (
    <img
      src={imageSrc}
      alt={`${character} ${emoteId}`}
      onError={() => setCurrentFrame(1)}
      className={`${className} object-contain select-none inline-block`}
    />
  );
}