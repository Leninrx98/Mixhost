import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Grid3X3, 
  Plus, 
  Check, 
  X, 
  Trophy, 
  Maximize2, 
  Minimize2, 
  Shuffle, 
  Eye,
  RotateCcw,
  AlertTriangle,
  Clock,
  Trash2
} from 'lucide-react';

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
};

const INITIAL_IDEAS_POOL = [
  'Aparece un invitado especial',
  'Discurso de más de 3 minutos',
  'Fallo técnico de sonido',
  'Mencionan al público',
  'Chiste sobre Inteligencia Artificial',
  'Alguien llora en el escenario',
  'Ropa de color rojo brillante',
  'Mencionan una película clásica',
  'Se cae un micrófono u objeto',
  'Problemas de iluminación',
  'Risa fuerte de la audiencia',
  'Agradecen a la familia',
  'Alguien olvida lo que iba a decir',
  'Mencionan las redes sociales',
  'Abrazo emotivo entre presentadores',
  'Premio inesperado o sorpresa',
  'Broma sobre la organización',
  'Referencia a un meme viral',
  'Alguien lee sus notas en el celular',
  'Cantan un fragmento de canción',
  'Comentario sobre la comida del evento',
  'Interrupción por aplausos largos',
  'Alguien tropieza al subir al escenario',
  'Mencionan el clima o la lluvia',
  'Grito entusiasta entre el público',
  'Presentador confunde un nombre',
  'Gesto de corazón con las manos',
  'Selfie en vivo desde el escenario',
  'Referencia al café o energía',
  'Agradecimiento especial al equipo técnico'
];

export default function BingoPanel({
  user,
  isHost,
  participants = [],
  bingoState = null,
  isExpanded = false,
  onToggleExpand,
  socket,
  roomId
}) {
  const status = bingoState?.status || 'idle';
  const size = bingoState?.size || 16;
  
  const ideasPool = bingoState?.ideasPool || INITIAL_IDEAS_POOL;
  const pendingValidations = bingoState?.pendingValidations || [];
  const approvedClaims = bingoState?.approvedClaims || {};
  const scores = bingoState?.scores || {};
  const userCards = bingoState?.userCards || {};

  const [hoveredSize, setHoveredSize] = useState(null);
  const [newIdea, setNewIdea] = useState('');
  
  const [myCells, setMyCells] = useState(Array(size).fill(''));
  const [selectedCellIndex, setSelectedCellIndex] = useState(0);
  const [activeTabRight, setActiveTabRight] = useState('ideas'); // 'ideas' | 'cards'
  const [viewingUser, setViewingUser] = useState(null);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  useEffect(() => {
    setMyCells((prev) => {
      if (prev.length === size) return prev;
      return Array(size).fill('');
    });
    setSelectedCellIndex(0);
  }, [size]);

  useEffect(() => {
    if (userCards[user?.username]) {
      setMyCells(userCards[user?.username]);
    }
  }, [userCards, user]);

  useEffect(() => {
    if (status === 'playing') {
      setActiveTabRight('cards');
    }
  }, [status]);

  const sizeLabels = {
    9: { name: '3x3 Rápido', desc: 'Recomendado: < 1.5 hrs' },
    16: { name: '4x4 Estándar', desc: 'Recomendado: ~ 2.5 hrs' },
    25: { name: '5x5 Maratón', desc: 'Recomendado: > 3.5 hrs' }
  };

  // ACCIONES DEL HOST
  const handleStartDraft = (s) => {
    if (!isHost) return;
    socket?.emit('bingo_start_draft', { roomId, size: s });
  };

  const handleCloseDraft = () => {
    if (!isHost) return;

    const hasAnyFilledCell = myCells.some((cell) => cell.trim() !== '');
    if (!hasAnyFilledCell) {
      alert('⚠️ Para iniciar la partida debes tener al menos una casilla rellenada en tu cartón.');
      return;
    }

    socket?.emit('bingo_start_game', { roomId });
  };

  const handleValidatePoint = (validationId, approved) => {
    if (!isHost) return;
    socket?.emit('bingo_validate_point', { roomId, validationId, approved });
  };

  const handleFinishBingo = () => {
    if (!isHost) return;
    setShowConfirmFinish(false);
    socket?.emit('bingo_finish_game', { roomId });
  };

  const handleResetBingo = () => {
    if (!isHost) return;
    socket?.emit('bingo_reset_game', { roomId });
  };

  // ACCIONES DEL JUGADOR
  const handleAddIdea = (e) => {
    e.preventDefault();
    const ideaText = newIdea.trim();
    if (!ideaText) return;
    if (status !== 'draft') return;

    socket?.emit('bingo_add_idea', { roomId, text: ideaText, author: user?.username });
    handleSelectIdeaForCell(ideaText);

    setNewIdea('');
  };

  const handleSelectIdeaForCell = (ideaText) => {
    if (status !== 'draft') return;

    const targetNorm = normalizeText(ideaText);
    const isAlreadyInMyCard = myCells.some(
      (cell, idx) => idx !== selectedCellIndex && normalizeText(cell) === targetNorm
    );

    if (isAlreadyInMyCard) {
      return;
    }

    const updated = [...myCells];
    updated[selectedCellIndex] = ideaText;
    setMyCells(updated);
    
    socket?.emit('bingo_update_card', { roomId, username: user?.username, card: updated });

    const nextEmpty = updated.findIndex((val, idx) => idx > selectedCellIndex && !val);
    if (nextEmpty !== -1) {
      setSelectedCellIndex(nextEmpty);
    } else {
      const firstEmpty = updated.findIndex((val) => !val);
      if (firstEmpty !== -1) setSelectedCellIndex(firstEmpty);
    }
  };

  const handleClearCell = (index) => {
    if (status !== 'draft') return;
    const updated = [...myCells];
    updated[index] = '';
    setMyCells(updated);
    setSelectedCellIndex(index);
    socket?.emit('bingo_update_card', { roomId, username: user?.username, card: updated });
  };

  // AUTOFILL INTELIGENTE: Conserva las opciones escritas previamente y rellena solo las vacías
  const handleAutoFill = () => {
    if (status !== 'draft') return;
    if (ideasPool.length === 0) return;
    
    const currentCard = [...myCells];
    
    const usedNorms = new Set(
      currentCard.filter((c) => c.trim() !== '').map((c) => normalizeText(c))
    );

    const availablePool = [];
    const seen = new Set();

    for (const idea of ideasPool) {
      const norm = normalizeText(idea);
      if (!usedNorms.has(norm) && !seen.has(norm)) {
        seen.add(norm);
        availablePool.push(idea);
      }
    }

    const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
    let poolIndex = 0;

    const filled = currentCard.map((cell) => {
      if (cell.trim() !== '') return cell;
      const nextIdea = shuffled[poolIndex] || '';
      if (nextIdea) poolIndex++;
      return nextIdea;
    });
    
    setMyCells(filled);
    socket?.emit('bingo_update_card', { roomId, username: user?.username, card: filled });
  };

  const handleClaimPoint = (cellText, index) => {
    if (status !== 'playing' || !cellText) return;
    
    const isAlreadyApproved = (approvedClaims[user?.username] || []).includes(index);
    const isAlreadyPending = pendingValidations.some(
      (v) => v.username === user?.username && v.cellIndex === index
    );

    if (isAlreadyApproved || isAlreadyPending) return;

    socket?.emit('bingo_claim_point', {
      roomId,
      username: user?.username,
      cellText,
      cellIndex: index
    });
  };

  const gridColsClass = size === 9 ? 'grid-cols-3' : size === 25 ? 'grid-cols-5' : 'grid-cols-4';

  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950 text-slate-100 overflow-hidden relative font-sans">
      
      {/* CABECERA */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-2">
              BINGO EN VIVO
              {status === 'playing' && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                  En Juego
                </span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400">
              {status === 'idle' && 'Esperando activación del Host'}
              {status === 'draft' && 'Fase de armado: Toca casillas para rellenar'}
              {status === 'playing' && 'Toca los eventos al ocurrir en vivo'}
              {status === 'finished' && 'Partida concluida'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleExpand}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
          title={isExpanded ? "Vista Compacta" : "Vista Expandida en L Invertida"}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ESTADO 1: IDLE */}
      {status === 'idle' && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto">
          <div className="w-16 h-16 bg-slate-900 border border-purple-500/30 rounded-3xl flex items-center justify-center text-purple-400 shadow-xl shadow-purple-600/10">
            <Grid3X3 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">No hay ningún Bingo en curso</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              {isHost 
                ? 'Selecciona la dimensión de la cuadrícula para abrir la fase de armado para toda la sala.'
                : 'El Host aún no ha iniciado la sesión de Bingo.'}
            </p>
          </div>

          {isHost && (
            <div className="w-full max-w-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block text-left">
                Elige el tamaño del tablero:
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[9, 16, 25].map((s) => (
                  <div
                    key={s}
                    className="relative"
                    onMouseEnter={() => setHoveredSize(s)}
                    onMouseLeave={() => setHoveredSize(null)}
                  >
                    <button
                      onClick={() => handleStartDraft(s)}
                      className="w-full bg-slate-900 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500 text-slate-200 py-3 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-1"
                    >
                      <span>{s}</span>
                      <span className="text-[9px] text-slate-500">{s === 9 ? '3x3' : s === 16 ? '4x4' : '5x5'}</span>
                    </button>

                    {hoveredSize === s && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-slate-900 border border-purple-500/40 p-2.5 rounded-2xl shadow-2xl z-50 text-left pointer-events-none">
                        <p className="text-xs font-bold text-white">{sizeLabels[s].name}</p>
                        <p className="text-[10px] text-purple-300 font-mono mt-0.5">{sizeLabels[s].desc}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ESTADO 2 Y 3: DRAFT / PLAYING */}
      {(status === 'draft' || status === 'playing') && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* CUADRÍCULA VISIBLE DE MI CARTÓN */}
          <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Mi Cartón ({size === 9 ? '3x3' : size === 25 ? '5x5' : '4x4'})
              </span>
              <span className="text-[10px] text-slate-400">
                Puntos: <strong className="text-emerald-400">{scores[user?.username] || 0} pts</strong>
              </span>
            </div>

            <div className={`grid ${gridColsClass} gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-slate-950 rounded-2xl border border-slate-800`}>
              {myCells.map((cellText, idx) => {
                const isSelected = selectedCellIndex === idx;
                const isApproved = (approvedClaims[user?.username] || []).includes(idx);
                const isPending = pendingValidations.some(
                  (v) => v.username === user?.username && v.cellIndex === idx
                );

                let cellStyle = 'border-slate-800/80 bg-slate-950 text-slate-600 hover:border-slate-700';
                
                if (isApproved) {
                  cellStyle = 'border-emerald-500/80 bg-emerald-950/60 text-emerald-200 font-bold ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10';
                } else if (isPending) {
                  cellStyle = 'border-amber-500/80 bg-amber-950/50 text-amber-200 font-semibold animate-pulse';
                } else if (isSelected && status === 'draft') {
                  cellStyle = 'border-purple-500 bg-purple-900/40 text-white font-bold ring-2 ring-purple-500/40';
                } else if (cellText) {
                  cellStyle = 'border-slate-700 bg-slate-900/90 text-slate-200';
                }

                return (
                  <div key={idx} className="relative group">
                    <button
                      onClick={() => {
                        if (status === 'draft') setSelectedCellIndex(idx);
                        else handleClaimPoint(cellText, idx);
                      }}
                      className={`w-full p-2 text-[10px] rounded-xl border text-left flex flex-col justify-between transition min-h-[46px] ${cellStyle}`}
                    >
                      <span className="line-clamp-2 leading-tight flex items-start justify-between gap-1">
                        <span>{cellText || `#${idx + 1} (Vacía)`}</span>
                        {isApproved && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                        {isPending && <Clock className="w-3 h-3 text-amber-400 flex-shrink-0 animate-spin" />}
                      </span>
                    </button>

                    {/* BOTÓN PAPELERA PARA VACIAR CASILLA */}
                    {status === 'draft' && cellText && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearCell(idx);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-slate-900 hover:bg-rose-600 text-rose-400 hover:text-white p-1 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition z-10 shadow-md"
                        title="Vaciar esta casilla"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PESTAÑAS DERECHAS */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1 flex-shrink-0">
            {status === 'draft' && (
              <button
                onClick={() => setActiveTabRight('ideas')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTabRight === 'ideas'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                💡 Banco ({ideasPool.length})
              </button>
            )}
            <button
              onClick={() => setActiveTabRight('cards')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTabRight === 'cards' || status === 'playing'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              👥 Cartones Sala ({participants.length})
            </button>
          </div>

          {/* ÁREA INTERACTIVA */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {activeTabRight === 'ideas' && status === 'draft' && (
              <div className="space-y-3">
                <form onSubmit={handleAddIdea} className="flex gap-1.5">
                  <input
                    type="text"
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    placeholder="Añadir casilla u opción..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>

                <button
                  onClick={handleAutoFill}
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-purple-300 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Llenar Cartón con Ideas (Sin borrar tus opciones)
                </button>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Toca una idea para asignarla a la Casilla #{selectedCellIndex + 1}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ideasPool.map((idea, idx) => {
                      const isAlreadyInCard = myCells.some(
                        (c) => normalizeText(c) === normalizeText(idea)
                      );
                      return (
                        <button
                          key={idx}
                          disabled={isAlreadyInCard}
                          onClick={() => handleSelectIdeaForCell(idea)}
                          className={`text-xs px-2.5 py-1 rounded-full text-left transition ${
                            isAlreadyInCard
                              ? 'bg-slate-950/50 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
                              : 'bg-slate-900 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/50 text-slate-200'
                          }`}
                          title={isAlreadyInCard ? 'Ya agregaste esta casilla a tu cartón' : ''}
                        >
                          {isAlreadyInCard ? '✓ ' : '+ '}{idea}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {(activeTabRight === 'cards' || status === 'playing') && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Participantes en la sala:
                </span>
                <div className="space-y-1.5">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <img src={p.avatar} alt={p.username} className="w-5 h-5 rounded-full bg-slate-950" />
                        <span className="text-xs font-semibold text-white">{p.username}</span>
                      </div>
                      <button
                        onClick={() => setViewingUser(p)}
                        className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-purple-500/30 transition"
                      >
                        <Eye className="w-3 h-3" /> Ver Cartón
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VALIDACIONES PENDIENTES */}
          {isHost && pendingValidations.length > 0 && (
            <div className="p-2.5 border-t border-slate-800 bg-slate-950/90 space-y-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                👑 Solicitudes pendientes de aprobación:
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {pendingValidations.map((v) => (
                  <div key={v.id} className="bg-slate-900 border border-amber-500/30 p-1.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <strong className="text-white">{v.username}:</strong> <span className="text-slate-300 truncate">{v.cellText}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleValidatePoint(v.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-lg"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleValidatePoint(v.id, false)}
                        className="bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCIÓN PRINCIPAL HOST */}
          {isHost && (
            <div className="p-2.5 border-t border-slate-800 bg-slate-900 flex-shrink-0">
              {status === 'draft' ? (
                <button
                  onClick={handleCloseDraft}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500 transition"
                >
                  🚀 Iniciar Bingo
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmFinish(true)}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-xl text-xs font-bold transition"
                >
                  🏆 Finalizar Bingo y Ver Podio
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ESTADO FINISHED */}
      {status === 'finished' && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 overflow-y-auto">
          <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
          <h3 className="text-base font-bold text-white">¡Bingo Finalizado!</h3>
          <p className="text-xs text-slate-400">Resultados finales de la partida:</p>
          
          <div className="w-full max-w-xs space-y-1.5">
            {sortedScores.length > 0 ? (
              sortedScores.map(([uname, pts], idx) => (
                <div key={uname} className="bg-slate-900 p-2.5 rounded-xl flex justify-between items-center text-xs font-semibold border border-slate-800">
                  <span className="flex items-center gap-2 text-white">
                    <span className="text-purple-400 font-bold">#{idx + 1}</span> {uname}
                  </span>
                  <span className="text-emerald-400 font-bold">{pts} pts</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No se registraron aciertos validados en esta partida.</p>
            )}
          </div>

          {isHost && (
            <button
              onClick={handleResetBingo}
              className="mt-4 w-full max-w-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition"
            >
              <RotateCcw className="w-4 h-4" /> Iniciar Nueva Partida de Bingo
            </button>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN AL FINALIZAR */}
      {showConfirmFinish && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 p-4 flex flex-col items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-xs space-y-3 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
            <h4 className="text-xs font-bold text-white">¿Finalizar el Bingo?</h4>
            <p className="text-[11px] text-slate-400">
              Se dará por concluida la partida actual y se mostrará la ceremonia de puntajes a todos los participantes.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinishBingo}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-1.5 rounded-xl text-xs font-bold"
              >
                Sí, Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER CARTÓN DE OTRO USUARIO */}
      {viewingUser && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 p-4 flex flex-col items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">Cartón de {viewingUser.username}</span>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className={`grid ${gridColsClass} gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 max-h-40 overflow-y-auto`}>
              {(userCards[viewingUser.username] || Array(size).fill('')).map((txt, i) => {
                const isApproved = (approvedClaims[viewingUser.username] || []).includes(i);
                return (
                  <div
                    key={i}
                    className={`p-1 text-[9px] rounded border truncate ${
                      isApproved 
                        ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {isApproved ? `✓ ${txt}` : txt || `#${i+1}`}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setViewingUser(null)}
              className="w-full bg-slate-800 text-slate-200 py-1.5 rounded-xl text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}