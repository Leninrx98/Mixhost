import React from 'react';
import { Info } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed top-20 right-6 z-[9999] transition-all duration-300">
      <div className="bg-purple-950/90 border border-purple-500/60 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs text-purple-100 animate-in fade-in slide-in-from-top-2 duration-300">
        <Info className="w-4 h-4 text-purple-400 flex-shrink-0 animate-pulse" />
        <span className="font-semibold">{toast}</span>
      </div>
    </div>
  );
}