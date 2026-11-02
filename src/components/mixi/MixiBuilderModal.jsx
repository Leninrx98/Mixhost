import React, { useState } from 'react';
import { X, Sparkles, Shuffle, Check, Palette, Smile, Glasses } from 'lucide-react';
import MixiAvatar from './MixiAvatar';

// Opciones de paletas rápidas de color
const BODY_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#64748B'];
const SPOTS_COLORS = ['#F472B6', '#38BDF8', '#FBBF24', '#34D399', '#A78BFA', '#F87171', '#FFFFFF', '#1E293B'];
const EYE_COLORS = ['#38BDF8', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#0F172A'];

export default function MixiBuilderModal({
  isOpen = false,
  onClose,
  initialConfig = {},
  onSave
}) {
  const [config, setConfig] = useState({
    bodyColor: initialConfig.bodyColor || '#8B5CF6',
    spotsColor: initialConfig.spotsColor || '#F472B6',
    eyeColor: initialConfig.eyeColor || '#38BDF8',
    hat: initialConfig.hat || 'none',
    headphones: initialConfig.headphones || false,
    glasses: initialConfig.glasses || false
  });

  const [testExpression, setTestExpression] = useState('idle');
  const [activeTab, setActiveTab] = useState('colors'); // 'colors' | 'face' | 'extras'

  if (!isOpen) return null;

  const handleRandomize = () => {
    const randomBody = BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)];
    const randomSpots = SPOTS_COLORS[Math.floor(Math.random() * SPOTS_COLORS.length)];
    const randomEyes = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)];
    
    setConfig({
      bodyColor: randomBody,
      spotsColor: randomSpots,
      eyeColor: randomEyes,
      hat: Math.random() > 0.6 ? 'snapback' : 'none',
      headphones: Math.random() > 0.5,
      glasses: Math.random() > 0.5
    });
  };

  const handleSave = () => {
    if (onSave) onSave(config);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* CABECERA */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Diseña tu Mixi</h3>
              <p className="text-[10px] text-slate-400">Personaliza tu avatar para la sala y las reacciones</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CUERPO PRINCIPAL (2 COLUMNAS) */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          
          {/* VISTA PREVIA Y EXPRESIONES */}
          <div className="flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-center space-y-3">
            <div className="relative group p-2">
              <MixiAvatar config={config} expression={testExpression} size={140} />
            </div>

            <div className="w-full space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Probar Emojis / Expresión:
              </span>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {[
                  { id: 'idle', label: '😊 Normal' },
                  { id: 'laugh', label: '🤣 Risa' },
                  { id: 'surprised', label: '😮 Wow' },
                  { id: 'angry', label: '😡 Enjo' },
                  { id: 'wink', label: '😉 Guiño' }
                ].map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => setTestExpression(exp.id)}
                    className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition ${
                      testExpression === exp.id
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PANEL DE OPCIONES DE EDICIÓN */}
          <div className="space-y-3 flex flex-col justify-between h-full">
            
            {/* PESTAÑAS */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
              <button
                onClick={() => setActiveTab('colors')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition ${
                  activeTab === 'colors' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" /> Colores
              </button>
              <button
                onClick={() => setActiveTab('face')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition ${
                  activeTab === 'face' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Smile className="w-3.5 h-3.5" /> Ojos
              </button>
              <button
                onClick={() => setActiveTab('extras')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition ${
                  activeTab === 'extras' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Glasses className="w-3.5 h-3.5" /> Extras
              </button>
            </div>

            {/* CONTENIDO PESTAÑA 1: COLORES */}
            {activeTab === 'colors' && (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Color del Creador / Piel:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {BODY_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setConfig({ ...config, bodyColor: color })}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          config.bodyColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Color de Lunares:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SPOTS_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setConfig({ ...config, spotsColor: color })}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          config.spotsColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA 2: OJOS */}
            {activeTab === 'face' && (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Color del Iris / Ojos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {EYE_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setConfig({ ...config, eyeColor: color })}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          config.eyeColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA 3: EXTRAS */}
            {activeTab === 'extras' && (
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                  <span className="text-xs font-semibold text-slate-200">🎧 Audífonos Gamer</span>
                  <input
                    type="checkbox"
                    checked={config.headphones}
                    onChange={(e) => setConfig({ ...config, headphones: e.target.checked })}
                    className="accent-purple-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                  <span className="text-xs font-semibold text-slate-200">🕶️ Lentes oscuros</span>
                  <input
                    type="checkbox"
                    checked={config.glasses}
                    onChange={(e) => setConfig({ ...config, glasses: e.target.checked })}
                    className="accent-purple-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                  <span className="text-xs font-semibold text-slate-200">🧢 Gorra Snapback</span>
                  <input
                    type="checkbox"
                    checked={config.hat === 'snapback'}
                    onChange={(e) => setConfig({ ...config, hat: e.target.checked ? 'snapback' : 'none' })}
                    className="accent-purple-600 rounded"
                  />
                </label>
              </div>
            )}

            {/* BOTÓN ALEATORIO */}
            <button
              onClick={handleRandomize}
              className="w-full mt-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-purple-300 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Shuffle className="w-3.5 h-3.5" /> Generar Aleatorio
            </button>
          </div>
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20 transition"
          >
            <Check className="w-4 h-4" /> Guardar Avatar
          </button>
        </div>

      </div>
    </div>
  );
}