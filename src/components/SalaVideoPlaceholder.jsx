import React, { useState, useEffect } from 'react';

// Secuencia de imágenes para el placeholder del reproductor de video de la sala
const salaFrames = [
  "/Fotos Mixy/Sala 1.png",
  "/Fotos Mixy/Sala 2.png",
  "/Fotos Mixy/Sala 3.png",
  "/Fotos Mixy/Sala 4.png"
];

export default function SalaVideoPlaceholder({ streamActive }) {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    // Si hay un stream o video activo, podemos pausar la animación del placeholder
    if (streamActive) return;

    // Velocidad de cambio para simular el efecto de estática o parpadeo en la sala
    const interval = setInterval(() => {
      setCurrentFrame((prevFrame) => (prevFrame + 1) % salaFrames.length);
    }, 250);

    return () => clearInterval(interval);
  }, [streamActive]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-purple-500/30 shadow-xl flex items-center justify-center">
      {/* Si no hay stream, mostramos la secuencia animada de la sala */}
      {!streamActive ? (
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={salaFrames[currentFrame]} 
            alt="Sala de Video en Espera" 
            className="w-full h-full object-cover transition-opacity duration-100"
          />
          {/* Insignia de estado */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
            Esperando transmisión en la sala...
          </div>
        </div>
      ) : (
        /* Aquí iría tu reproductor de video real cuando empiece la función */
        <div className="text-white text-center">
          <p>Reproduciendo contenido...</p>
        </div>
      )}
    </div>
  );
}