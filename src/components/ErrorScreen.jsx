import React from "react";
import { RefreshCw, Home } from "lucide-react";

export default function ErrorScreen({ 
  title = "¡Opps! Algo se rompió en MixHost", 
  message = "Nuestros ingenieros de construcción están ajustando los cables para volver en vivo.",
  onRetry 
}) {
  const handleReload = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-3xl w-full bg-slate-900 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10 flex flex-col">
        
        {/* Imagen de Error de los 3 Obreros */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
          <img
            src="/error_construction.png"
            alt="MixHost en mantenimiento"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/Fotos Mixy/Mensaje de error.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
        </div>

        {/* Mensaje y Botones de Acción */}
        <div className="p-6 sm:p-8 text-center space-y-4 relative z-10 -mt-8 bg-slate-900">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {message}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleReload}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm rounded-2xl transition shadow-lg shadow-purple-600/30 active:scale-95"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Reintentar Conexión
            </button>

            <a
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm rounded-2xl transition border border-slate-700/60 active:scale-95"
            >
              <Home className="w-4 h-4" />
              Volver al Inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
