import React, { useState, useEffect } from 'react';
import { X, Palette, Smile, Glasses, Shuffle, Check, Sparkles, Headphones, HardHat } from 'lucide-react';
import MixiAvatar from './MixiAvatar';

// Opciones predefinidas locales
const PALETTES_OPTIONS = [
  { id: 'classic', name: 'Clásico', bodyColor: '#8B5CF6' },
  { id: 'pink', name: 'Rosa', bodyColor: '#EC4899' },
  { id: 'cyan', name: 'Cian', bodyColor: '#06B6D4' },
  { id: 'green', name: 'Verde', bodyColor: '#10B981' },
  { id: 'orange', name: 'Naranja', bodyColor: '#F97316' },
  { id: 'dark', name: 'Oscuro', bodyColor: '#475569' },
];

const EYES_OPTIONS = [
  { id: 'normal', name: 'Normales' },
  { id: 'anime', name: 'Brillantes' },
  { id: 'cute', name: 'Tiernos' },
  { id: 'cool', name: 'Estilo Cool' },
];

export default function MixiBuilderModal({ isOpen, onClose, initialConfig, onSave }) {
  const [config, setConfig] = useState(initialConfig);
  const [activeTab, setActiveTab] = useState('colors');
  const [testExpression, setTestExpression] = useState('normal');

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleColorSelect = (paletteId) => {
    setConfig((prev) => ({ ...prev, colorPalette: paletteId }));
  };

  const handleEyeSelect = (eyeStyle) => {
    setConfig((prev) => ({ ...prev, eyesStyle: eyeStyle }));
  };

  const handleExtraToggle = (extraKey) => {
    setConfig((prev) => ({
      ...prev,
      extras: {
        ...prev?.extras,
        [extraKey]: !prev?.extras?.[extraKey],
      },
    }));
  };

  const handleRandomize = () => {
    const randomPalette = PALETTES_OPTIONS[Math.floor(Math.random() * PALETTES_OPTIONS.length)].id;
    const randomEyes = EYES_OPTIONS[Math.floor(Math.random() * EYES_OPTIONS.length)].id;
    const randomHeadphones = Math.random() > 0.5;
    const randomGlasses = Math.random() > 0.5;
    const randomCap = Math.random() > 0.5;

    setConfig({
      colorPalette: randomPalette,
      eyesStyle: randomEyes,
      extras: {
        headphones: randomHeadphones,
        glasses: randomGlasses,
        cap: randomCap,
      },
    });
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900/90 border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-950/50 overflow-hidden flex flex-col">
        
        {/* Resplandor Neón */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Diseña tu Mixi</h2>
              <p className="text-xs text-slate-400">Personaliza tu avatar para la sala y las reacciones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative z-10">
          
          {/* Previsualización del Avatar */}
          <div className="flex flex-col items-center bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5 shadow-inner relative">
            <div className="relative w-44 h-44 flex items-center justify-center my-2">
              <div className="absolute inset-0 bg-purple-600/10 rounded-full blur-xl animate-pulse" />
              <MixiAvatar
                config={config}
                expression={testExpression}
                className="w-40 h-40 object-contain relative z-10 drop-shadow-[0_10px_15px_rgba(147,51,234,0.3)]"
              />
            </div>

            <div className="w-full mt-3 pt-3 border-t border-slate-800/60">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-2">
                Probar Emojis / Expresión:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {[
                  { id: 'normal', label: '😊 Normal' },
                  { id: 'happy', label: '🤪 Risa' },
                  { id: 'wow', label: '😲 Wow' },
                  { id: 'angry', label: '😡 Enojo' },
                  { id: 'wink', label: '😉 Guiño' },
                ].map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => setTestExpression(exp.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-xl transition ${
                      testExpression === exp.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de Opciones */}
          <div className="flex flex-col h-full justify-between gap-4">
            
            {/* Pestañas de Selección */}
            <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 gap-1">
              {[
                { id: 'colors', label: 'Colores', icon: Palette },
                { id: 'eyes', label: 'Ojos', icon: Smile },
                { id: 'extras', label: 'Extras', icon: Glasses },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Opciones activas */}
            <div className="flex-1 min-h-[160px] flex items-center">
              
              {/* Opción Colores */}
              {activeTab === 'colors' && (
                <div className="grid grid-cols-3 gap-2.5 w-full">
                  {PALETTES_OPTIONS.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => handleColorSelect(palette.id)}
                      className={`p-2.5 rounded-2xl border transition flex flex-col items-center gap-1.5 ${
                        config?.colorPalette === palette.id
                          ? 'border-purple-500 bg-purple-950/30 shadow-md shadow-purple-600/20'
                          : 'border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full border border-white/20 shadow-inner"
                        style={{ backgroundColor: palette.bodyColor }}
                      />
                      <span className="text-[11px] font-medium text-slate-300">{palette.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Opción Ojos */}
              {activeTab === 'eyes' && (
                <div className="grid grid-cols-2 gap-2.5 w-full">
                  {EYES_OPTIONS.map((eye) => (
                    <button
                      key={eye.id}
                      onClick={() => handleEyeSelect(eye.id)}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                        config?.eyesStyle === eye.id
                          ? 'border-purple-500 bg-purple-950/30 shadow-md shadow-purple-600/20 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-medium">{eye.name}</span>
                      {config?.eyesStyle === eye.id && <Check className="w-4 h-4 text-purple-400" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Opción Extras */}
              {activeTab === 'extras' && (
                <div className="flex flex-col gap-2.5 w-full">
                  {[
                    { key: 'headphones', label: 'Audífonos Gamer', icon: Headphones },
                    { key: 'glasses', label: 'Lentes oscuros', icon: Glasses },
                    { key: 'cap', label: 'Gorra Snapback', icon: HardHat },
                  ].map((extra) => {
                    const Icon = extra.icon;
                    const isActive = !!config?.extras?.[extra.key];
                    return (
                      <button
                        key={extra.key}
                        onClick={() => handleExtraToggle(extra.key)}
                        className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                          isActive
                            ? 'border-purple-500 bg-purple-950/30 shadow-md shadow-purple-600/20 text-white'
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                          <span className="text-xs font-medium">{extra.label}</span>
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                            isActive ? 'bg-purple-600' : 'bg-slate-800'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                              isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botón Aleatorio */}
            <button
              onClick={handleRandomize}
              className="w-full py-2.5 bg-slate-950/80 hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-2xl transition flex items-center justify-center gap-2 text-xs font-semibold shadow-sm"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Generar Aleatorio
            </button>
          </div>
        </div>

        {/* Acciones de Guardar/Cancelar */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-end gap-3 relative z-10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-800 rounded-2xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl shadow-lg shadow-purple-600/30 transition flex items-center gap-2 active:scale-95"
          >
            <Check className="w-4 h-4" />
            Guardar Avatar
          </button>
        </div>
      </div>
    </div>
  );
}