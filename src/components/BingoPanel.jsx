import React, { useState, useEffect } from 'react';

const PRESET_PHRASES = [
  "Risa exagerada", "Fallo técnico", "Aparece un gato",
  "Se equivoca de palabra", "Dato curioso impactante",
  "Pide suscripciones", "Silencio incómodo",
  "Estornudo en vivo", "Toma agua"
];

export default function BingoPanel({ socket, roomId, isHost, user }) {
  const [isActive, setIsActive] = useState(false);
  const [grid, setGrid] = useState(Array(9).fill(''));
  const [marked, setMarked] = useState(Array(9).fill(false));

  useEffect(() => {
    if (!socket) return;

    const handleBingoUpdate = ({ active }) => setIsActive(active);
    const handleWinner = ({ username }) => {
      alert(`🎉 ¡${username} HA CANTADO BINGO EN LA SALA! 🎉`);
    };

    socket.on('bingo:session_updated', handleBingoUpdate);
    socket.on('bingo:alerta_ganador', handleWinner);

    return () => {
      socket.off('bingo:session_updated', handleBingoUpdate);
      socket.off('bingo:alerta_ganador', handleWinner);
    };
  }, [socket]);

  const toggleBingoSession = (activeState) => {
    socket.emit('bingo:toggle_session', { roomId, active: activeState });
  };

  const generateRandomBoard = () => {
    const shuffled = [...PRESET_PHRASES].sort(() => 0.5 - Math.random());
    setGrid(shuffled.slice(0, 9));
    setMarked(Array(9).fill(false));
  };

  const handleCellChange = (index, value) => {
    const newGrid = [...grid];
    newGrid[index] = value;
    setGrid(newGrid);
  };

  const toggleMark = (index) => {
    if (!isActive) return;
    const newMarked = [...marked];
    newMarked[index] = !newMarked[index];
    setMarked(newMarked);
  };

  const checkBingo = () => {
    socket.emit('bingo:cantar_bingo', { roomId, username: user?.username || 'Anon' });
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-950 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-bold text-purple-400 flex items-center gap-2">
          <span>🎯 Bingo de la Sala</span>
          {isActive && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              Activo
            </span>
          )}
        </h2>

        {isHost && (
          <button
            onClick={() => toggleBingoSession(!isActive)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition text-white ${
              isActive ? 'bg-rose-600 hover:bg-rose-500' : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {isActive ? 'Desactivar' : 'Habilitar'}
          </button>
        )}
      </div>

      <button
        onClick={generateRandomBoard}
        className="text-xs bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 py-2 rounded-xl font-medium transition mb-3"
      >
        🎲 Modo Aleatorio
      </button>

      {/* Cartón de Bingo 3x3 */}
      <div className="grid grid-cols-3 gap-2 flex-1 mb-3 min-h-[220px]">
        {grid.map((cellText, idx) => (
          <div
            key={idx}
            onClick={() => toggleMark(idx)}
            className={`relative p-2 rounded-xl border flex items-center justify-center text-center text-[11px] leading-tight font-medium transition cursor-pointer select-none min-h-[65px] ${
              marked[idx]
                ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/50 scale-[0.98]'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-purple-500/50'
            }`}
          >
            {isActive ? (
              <span className="break-words w-full line-clamp-3">{cellText || `Casilla ${idx + 1}`}</span>
            ) : (
              <textarea
                value={cellText}
                placeholder={`Casilla ${idx + 1}`}
                onChange={(e) => handleCellChange(idx, e.target.value)}
                className="w-full h-full bg-transparent text-center text-[11px] focus:outline-none text-purple-200 placeholder-slate-600 resize-none overflow-hidden"
                rows={2}
              />
            )}
          </div>
        ))}
      </div>

      {isActive && (
        <button
          onClick={checkBingo}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95"
        >
          📣 ¡CANTAR BINGO!
        </button>
      )}
    </div>
  );
}