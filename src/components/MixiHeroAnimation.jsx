import React, { useState, useEffect } from 'react';

const mixiFrames = [
  "/Fotos Mixy/Mixi place holder .png",
  "/Fotos Mixy/Mixi place holder 2.png",
  "/Fotos Mixy/Mixi place holder 3.png",
  "/Fotos Mixy/Mixi place holder 4.png"
];

export default function MixiHeroAnimation({ className = "w-full h-full" }) {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % mixiFrames.length);
    }, 650); // <--- Un número más alto hace que la animación vaya más lenta y pausada

    return () => clearInterval(interval);
  }, []);

  return (
    <img 
      src={mixiFrames[currentFrame]} 
      alt="Mixi Animación" 
      className={`${className} w-full h-full object-cover`}
    />
  );
}