import React, { useState } from "react";
import { X, Sparkles, Check } from "lucide-react";
import { MIXI_PRESETS } from "./MixiPresets";

export default function MixiBuilderModal({ isOpen, onClose, initialConfig, onSave }) {
  if (!isOpen) return null;

  const currentId = typeof initialConfig === "string" 
    ? initialConfig 
    : (initialConfig?.avatarId || "mixi_classic");

  const [selectedId, setSelectedId] = useState(currentId);
  const [activeTab, setActiveTab] = useState("mixi");

  const filteredPresets = MIXI_PRESETS.filter((p) => p.character === activeTab);
  const selectedPreset = MIXI_PRESETS.find((p) => p.id === selectedId) || MIXI_PRESETS[0];

  const handleSave = () => {
    if (onSave) {
      onSave({ avatarId: selectedId, image: selectedPreset.image });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-purple-500/30 w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">Selecciona tu Skin</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vista previa compacta y responsiva */}
        <div className="p-3 sm:p-4 bg-slate-950/60 flex flex-col items-center justify-center border-b border-slate-800/80 shrink-0">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-2 border-purple-500/40 p-1.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
            <img
              src={selectedPreset.image}
              alt={selectedPreset.name}
              className="w-full h-full object-contain"
            />
          </div>
          <h4 className="mt-2 font-bold text-sm sm:text-base text-white">{selectedPreset.name}</h4>
          <span className="text-[10px] sm:text-xs text-purple-400 font-medium px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 mt-0.5">
            {selectedPreset.skin}
          </span>
        </div>

        {/* Pestañas de Personajes */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-1.5 gap-1.5 shrink-0">
          {["mixi", "glo", "roxy"].map((char) => (
            <button
              key={char}
              onClick={() => setActiveTab(char)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                activeTab === char
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {char}
            </button>
          ))}
        </div>

        {/* Grilla de 4 Variantes (Scrollable interno solo si es necesario en pantallas minúsculas) */}
        <div className="p-3 grid grid-cols-2 gap-2.5 overflow-y-auto min-h-0 flex-1">
          {filteredPresets.map((preset) => {
            const isSelected = selectedId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setSelectedId(preset.id)}
                className={`relative cursor-pointer p-2 sm:p-2.5 rounded-2xl border transition flex flex-col items-center gap-1 ${
                  isSelected
                    ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20"
                    : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-purple-600 rounded-full p-0.5 text-white shadow-sm">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
                <img
                  src={preset.image}
                  alt={preset.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                />
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200 text-center">
                  {preset.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer del Modal fijo */}
        <div className="p-3 border-t border-slate-800 flex justify-end gap-2 bg-slate-900 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition active:scale-95"
          >
            Guardar Skin
          </button>
        </div>
      </div>
    </div>
  );
}