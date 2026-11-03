import React, { useState, useEffect } from 'react';

const roomFrames = [
  "/Fotos Mixy/Sala 1.png",
  "/Fotos Mixy/Sala 2.png",
  "/Fotos Mixy/Sala 3.png",
  "/Fotos Mixy/Sala 4.png"
];

export default function VideoPlaceholderAnimation() {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % roomFrames.length);
    }, 650);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
      <img 
        src={roomFrames[currentFrame]} 
        alt="Animación Sala Mixi" 
        className="w-full h-full object-fill select-none"
      />
    </div>
  );
}