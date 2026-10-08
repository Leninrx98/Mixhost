import React, { useRef } from 'react';
import { Share2, Check, Copy, ArrowRight, Users, Crown, LogOut } from 'lucide-react';

export const OctopusIcon = ({ className = "w-8 h-8" }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M32 6C18.7452 6 8 16.7452 8 30C8 37.5 11.5 44 17 48V52C17 54.2091 18.7909 56 21 56C23.2091 56 25 54.2091 25 52V50C27.2 50.6 29.5 51 32 51C34.5 51 36.8 50.6 39 50V52C39 54.2091 40.7909 56 43 56C45.2091 56 47 54.2091 47 52V48C52.5 44 56 37.5 56 30C56 16.7452 45.2548 6 32 6Z"
      fill="url(#octo_grad)"
    />
    <circle cx="23" cy="28" r="4.5" fill="#FFFFFF" />
    <circle cx="23" cy="28" r="2" fill="#0F172A" />
    <circle cx="41" cy="28" r="4.5" fill="#FFFFFF" />
    <circle cx="41" cy="28" r="2" fill="#0F172A" />
    <path
      d="M27 36C27 36 29.5 39 32 39C34.5 39 37 36 37 36"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M13 46C11 49 10 53 12 56C14 59 18 57 19 53"
      stroke="#9333EA"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M51 46C53 49 54 53 52 56C50 59 46 57 45 53"
      stroke="#9333EA"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="octo_grad" x1="8" y1="6" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C084FC" />
        <stop offset="1" stopColor="#7E22CE" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Header({
  roomId,
  user,
  isHost,
  connectedCount,
  participants,
  showInviteMenu,
  handleMouseEnterInvite,
  handleMouseLeaveInvite,
  handleCopyLink,
  handleCopyCode,
  copiedLink,
  copiedCode,
  showSwitchRoomInput,
  handleMouseEnterSwitch,
  handleMouseLeaveSwitch,
  handleSwitchRoom,
  switchRoomCode,
  setSwitchRoomCode,
  showParticipantsTooltip,
  setShowParticipantsTooltip,
  onPromoteToHost,
  onLogout,
}) {
  const participantsTimerRef = useRef(null);

  const handleMouseEnterParticipants = () => {
    if (participantsTimerRef.current) clearTimeout(participantsTimerRef.current);
    setShowParticipantsTooltip(true);
  };

  const handleMouseLeaveParticipants = () => {
    participantsTimerRef.current = setTimeout(() => {
      setShowParticipantsTooltip(false);
    }, 300);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-950 border border-purple-500/30 rounded-2xl flex items-center justify-center shadow-md shadow-purple-500/20">
          <OctopusIcon className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-base tracking-wide text-white hidden sm:block">MixHost</h1>
          
          <div
            className="relative py-2"
            onMouseEnter={handleMouseEnterInvite}
            onMouseLeave={handleMouseLeaveInvite}
          >
            <div className="flex items-center gap-1.5 bg-purple-600/20 border border-purple-500/30 px-3 py-1 rounded-2xl cursor-pointer">
              <span className="text-purple-400 font-mono font-bold text-xs">#{roomId}</span>
              <button className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-xl transition-all ml-1 shadow-sm active:scale-95">
                <Share2 className="w-3 h-3" />
                <span>Invitar</span>
              </button>
            </div>

            {showInviteMenu && (
              <div
                className="absolute left-0 top-full pt-1 w-72 z-50"
                onMouseEnter={handleMouseEnterInvite}
                onMouseLeave={handleMouseLeaveInvite}
              >
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1.5">
                    Opciones de Invitación
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-800/50 hover:bg-purple-600/20 border border-slate-700/50 hover:border-purple-500/40 text-slate-200 transition text-left"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-purple-300">Copiar Enlace Directo</span>
                        <span className="text-[10px] text-slate-400">Para abrir directamente en navegador</span>
                      </div>
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>

                    <button
                      onClick={handleCopyCode}
                      className="w-full flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-800/50 hover:bg-purple-600/20 border border-slate-700/50 hover:border-purple-500/40 text-slate-200 transition text-left"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-purple-300">Copiar Código de Sala</span>
                        <span className="text-[10px] text-slate-400">Para pegar dentro de la app ({roomId})</span>
                      </div>
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative ml-1 py-2"
            onMouseEnter={handleMouseEnterSwitch}
            onMouseLeave={handleMouseLeaveSwitch}
          >
            <button className="text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-2.5 py-1 rounded-2xl text-slate-300 transition">
              Ingresar Código
            </button>

            {showSwitchRoomInput && (
              <div
                className="absolute left-0 top-full pt-1 w-60 z-50"
                onMouseEnter={handleMouseEnterSwitch}
                onMouseLeave={handleMouseLeaveSwitch}
              >
                <form
                  onSubmit={handleSwitchRoom}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-2.5 shadow-2xl flex gap-2 animate-in fade-in zoom-in-95 duration-150"
                >
                  <input
                    type="text"
                    value={switchRoomCode}
                    onChange={(e) => setSwitchRoomCode(e.target.value)}
                    placeholder="Pegar código aquí..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-2xl transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Integrantes en la sala */}
        <div
          className="relative py-2"
          onMouseEnter={handleMouseEnterParticipants}
          onMouseLeave={handleMouseLeaveParticipants}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 cursor-pointer transition">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium">{connectedCount} conectados</span>
          </div>

          {showParticipantsTooltip && (
            <div
              className="absolute right-0 top-full pt-1 w-64 z-50"
              onMouseEnter={handleMouseEnterParticipants}
              onMouseLeave={handleMouseLeaveParticipants}
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1.5">
                  Integrantes en la sala ({participants.length})
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {participants.length === 0 ? (
                    <p className="text-xs text-slate-500">Cargando lista...</p>
                  ) : (
                    participants.map((p, idx) => (
                      <div key={p.id || idx} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-slate-800/50">
                        <div className="flex items-center gap-2 truncate">
                          <img src={p.avatar} alt="avatar" className="w-5 h-5 rounded-full bg-slate-800 border border-purple-500/30" />
                          <span className="text-slate-200 font-medium truncate">{p.username}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {p.isHost ? (
                            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" title="Host / Creador" />
                          ) : (
                            isHost && (
                              <button
                                onClick={() => onPromoteToHost && onPromoteToHost(p.id, p.sessionId)}
                                className="text-[10px] bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-xl flex items-center gap-1 transition active:scale-95"
                                title="Ascender a Host"
                              >
                                <Crown className="w-2.5 h-2.5" /> Ascender
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Perfil del Usuario y Cierre de Sesión */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex items-center gap-2">
            <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-800 border border-purple-500/30" />
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-tight flex items-center gap-1 text-slate-100">
                {user.username}
                {isHost && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
              </p>
              <p className="text-[10px] text-slate-400">{isHost ? 'Anfitrión (Host)' : 'Espectador'}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 bg-slate-800/60 hover:bg-red-500/20 hover:border-red-500/40 border border-slate-700/50 rounded-2xl text-slate-400 hover:text-red-400 transition"
            title="Cerrar Sesión / Salir"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}