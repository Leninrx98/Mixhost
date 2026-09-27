import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import io from 'socket.io-client';
import {
  MessageSquare,
  Users,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Smile,
  Send,
  Plus,
  Tv,
  Crown,
  Volume2,
  VolumeX,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Lock,
  Share2,
  Check,
  Copy,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

const socket = io('http://localhost:3001');

// Componente del Icono de Pulpito (Mascota MixHost)
const OctopusIcon = ({ className = "w-8 h-8" }) => (
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

export default function App() {
  // Login & Room Setup State
  const [user, setUser] = useState(null);
  const [tempName, setTempName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [isCreatingNewRoom, setIsCreatingNewRoom] = useState(false);
  const [roomError, setRoomError] = useState(null);

  // Sync & Room State
  const [isHost, setIsHost] = useState(false);
  const [connectedCount, setConnectedCount] = useState(1);
  const [participants, setParticipants] = useState([]);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Menús con Hover / Auto-Cierre
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [showSwitchRoomInput, setShowSwitchRoomInput] = useState(false);
  const [switchRoomCode, setSwitchRoomCode] = useState('');
  const [showParticipantsTooltip, setShowParticipantsTooltip] = useState(false);

  // Player State
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoQueue, setVideoQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const playerRef = useRef(null);

  // Chat & Reactions State
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [activeReactions, setActiveReactions] = useState([]);
  const chatBottomRef = useRef(null);

  // UI Tabs
  const [activeTab, setActiveTab] = useState('chat');

  // Prediction State
  const [prediction, setPrediction] = useState({
    question: '¿Qué canción vendrá a continuación?',
    optionA: 'Pop / Reggaeton Hits',
    optionB: 'Rock / Anime Openings',
    votesA: 3,
    votesB: 5,
    userVoted: null,
  });

  // Session ID único por pestaña
  const tabSessionIdRef = useRef('');
  if (!tabSessionIdRef.current) {
    let sId = sessionStorage.getItem('mixhost_session_id');
    if (!sId) {
      sId = 'usr_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('mixhost_session_id', sId);
    }
    tabSessionIdRef.current = sId;
  }

  // Leer la sala desde la URL si existe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }
  }, []);

  // Escuchadores de Socket.io
  useEffect(() => {
    if (!user || !roomId) return;

    socket.emit('join_room', {
      roomId,
      username: user.username,
      avatar: user.avatar,
      sessionId: tabSessionIdRef.current,
      isCreatingNew: isCreatingNewRoom,
    });

    socket.on('init_state', (data) => {
      setMessages(data.messages || []);
      setConnectedCount(data.connectedUsers || 1);
      setIsHost(data.isHost);
      setCurrentVideo(data.currentVideo);
      setVideoQueue(data.videoQueue || []);
      setHasPrevious(data.hasPreviousVideo);
      setRoomError(null);
    });

    socket.on('room_error', (data) => {
      setRoomError(data.message);
      setUser(null); // Redirigir al inicio si la sala no existe
    });

    socket.on('users_count', (count) => setConnectedCount(count));
    socket.on('update_participants', (list) => setParticipants(list || []));
    socket.on('host_status', (status) => setIsHost(status));

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('receive_reaction', (reaction) => {
      setActiveReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3000);
    });

    socket.on('sync_video', (data) => {
      setCurrentVideo(data.currentVideo);
      setVideoQueue(data.videoQueue || []);
      setHasPrevious(data.hasPreviousVideo);
      setIsPlaying(true);
    });

    socket.on('update_queue', (queue) => {
      setVideoQueue(queue);
    });

    socket.on('sync_play', (time) => {
      if (playerRef.current) {
        if (time !== undefined) playerRef.current.seekTo(time);
        playerRef.current.playVideo();
      }
      setIsPlaying(true);
    });

    socket.on('sync_pause', (time) => {
      if (playerRef.current) {
        if (time !== undefined) playerRef.current.seekTo(time);
        playerRef.current.pauseVideo();
      }
      setIsPlaying(false);
    });

    return () => {
      socket.off('init_state');
      socket.off('room_error');
      socket.off('users_count');
      socket.off('update_participants');
      socket.off('host_status');
      socket.off('receive_message');
      socket.off('receive_reaction');
      socket.off('sync_video');
      socket.off('update_queue');
      socket.off('sync_play');
      socket.off('sync_pause');
    };
  }, [user, roomId, isCreatingNewRoom]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : url;
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSwitchRoom = (e) => {
    e.preventDefault();
    if (!switchRoomCode.trim()) return;
    const newCode = switchRoomCode.trim().toLowerCase();

    setIsCreatingNewRoom(false);
    socket.emit('leave_room', { roomId });
    window.history.pushState({}, '', `/?room=${newCode}`);
    setRoomId(newCode);
    setSwitchRoomCode('');
    setShowSwitchRoomInput(false);
  };

  const handleCreateNewRoom = (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    const newRandomRoom = Math.random().toString(36).substring(2, 8);
    setIsCreatingNewRoom(true);
    window.history.pushState({}, '', `/?room=${newRandomRoom}`);
    setRoomId(newRandomRoom);
    setUser({
      username: tempName.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(tempName.trim() + tabSessionIdRef.current)}`,
    });
  };

  const handleJoinExistingRoom = (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    const targetRoom = inputRoomId.trim() || roomId;
    if (!targetRoom) return;

    setIsCreatingNewRoom(false);
    window.history.pushState({}, '', `/?room=${targetRoom}`);
    setRoomId(targetRoom);
    setUser({
      username: tempName.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(tempName.trim() + tabSessionIdRef.current)}`,
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !user) return;
    socket.emit('send_message', { user: user.username, text: inputMsg });
    setInputMsg('');
  };

  const handleSendReaction = (emoji) => {
    socket.emit('send_reaction', emoji);
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!newVideoUrl.trim() || !user) return;

    const videoId = extractVideoId(newVideoUrl);
    if (!videoId) {
      alert('Enlace de YouTube no válido');
      return;
    }

    let title = `Video (${videoId})`;
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await res.json();
      if (data.title) title = data.title;
    } catch (err) {
      console.log('Error fetching title', err);
    }

    socket.emit('add_to_queue', {
      url: videoId,
      title,
      addedBy: user.username,
    });

    setNewVideoUrl('');
  };

  const togglePlayPause = () => {
    if (!isHost || !playerRef.current) return;
    const currentTime = playerRef.current.getCurrentTime();
    if (isPlaying) {
      socket.emit('host_pause', currentTime);
      setIsPlaying(false);
    } else {
      socket.emit('host_play', currentTime);
      setIsPlaying(true);
    }
  };

  const handleNextVideo = () => {
    if (!isHost) return;
    socket.emit('play_next_video');
  };

  const handlePreviousVideo = () => {
    if (!isHost) return;
    socket.emit('play_previous_video');
  };

  const handleVote = (option) => {
    if (prediction.userVoted) return;
    setPrediction((prev) => ({
      ...prev,
      votesA: option === 'A' ? prev.votesA + 1 : prev.votesA,
      votesB: option === 'B' ? prev.votesB + 1 : prev.votesB,
      userVoted: option,
    }));
  };

  // VISTA 1: LOGIN
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-950 to-slate-950">
        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
          
          <div className="w-20 h-20 bg-slate-950 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-600/20">
            <OctopusIcon className="w-14 h-14 animate-bounce" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
            MixHost
          </h1>
          <p className="text-slate-400 text-xs mb-6">
            Salas de reproducción sincronizada en vivo
          </p>

          {roomError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs text-left">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{roomError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 text-left">
                Tu Apodo / Nombre
              </label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Ej. Luis P."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all text-sm"
                maxLength={20}
                required
              />
            </div>

            {roomId ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-xl py-2 px-3">
                  Te estás uniendo a la sala: <span className="font-mono font-bold text-white">#{roomId}</span>
                </p>
                <button
                  onClick={handleJoinExistingRoom}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-600/25 transition-all active:scale-95 text-sm"
                >
                  Entrar a la Sala
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <button
                  onClick={handleCreateNewRoom}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-600/25 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Crear una Sala Nueva (Serás el Host)
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-800 w-full"></div>
                  <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-wider absolute">O ÚNETE A UNA EXISTENTE</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputRoomId}
                    onChange={(e) => setInputRoomId(e.target.value)}
                    placeholder="Código de sala (Ej. g8s9dx)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleJoinExistingRoom}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition"
                  >
                    Unirme
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: INTERFAZ PRINCIPAL DE LA SALA
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-purple-500 selection:text-white">
      {/* Reacciones Flotantes */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {activeReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-20 text-4xl animate-float-up"
            style={{ left: `${r.left}%` }}
          >
            {r.symbol}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-950 border border-purple-500/30 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
            <OctopusIcon className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base tracking-wide text-white">MixHost</h1>
            
            {/* BADGE DE SALA Y MENÚ INVITAR CON AUTO-CIERRE EN HOVER */}
            <div
              className="relative"
              onMouseEnter={() => setShowInviteMenu(true)}
              onMouseLeave={() => setShowInviteMenu(false)}
            >
              <div className="flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 px-3 py-1 rounded-xl cursor-pointer">
                <span className="text-purple-400 font-mono font-bold text-xs">#{roomId}</span>
                <button className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-lg transition-all ml-1 shadow-sm active:scale-95">
                  <Share2 className="w-3 h-3" />
                  <span>Invitar</span>
                </button>
              </div>

              {/* Menú desplegable claro y directo */}
              {showInviteMenu && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1.5">
                    Opciones de Invitación
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/50 hover:bg-purple-600/20 border border-slate-700/50 hover:border-purple-500/40 text-slate-200 transition text-left"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-purple-300">Copiar Enlace Directo</span>
                        <span className="text-[10px] text-slate-400">Para abrir directamente en navegador</span>
                      </div>
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>

                    <button
                      onClick={handleCopyCode}
                      className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/50 hover:bg-purple-600/20 border border-slate-700/50 hover:border-purple-500/40 text-slate-200 transition text-left"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-purple-300">Copiar Código de Sala</span>
                        <span className="text-[10px] text-slate-400">Para pegar dentro de la app ({roomId})</span>
                      </div>
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN INGRESAR CÓDIGO CON AUTO-CIERRE EN HOVER */}
            <div
              className="relative ml-2"
              onMouseEnter={() => setShowSwitchRoomInput(true)}
              onMouseLeave={() => setShowSwitchRoomInput(false)}
            >
              <button
                className="text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-2.5 py-1 rounded-xl text-slate-300 transition"
              >
                Ingresar Código
              </button>

              {showSwitchRoomInput && (
                <form
                  onSubmit={handleSwitchRoom}
                  className="absolute left-0 top-full mt-2 w-60 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-2xl z-50 flex gap-2 animate-in fade-in zoom-in-95 duration-150"
                >
                  <input
                    type="text"
                    value={switchRoomCode}
                    onChange={(e) => setSwitchRoomCode(e.target.value)}
                    placeholder="Pegar código aquí..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded-xl transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* BADGE DE CONECTADOS CON HOVER DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setShowParticipantsTooltip(true)}
            onMouseLeave={() => setShowParticipantsTooltip(false)}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 cursor-pointer transition">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-medium">{connectedCount} conectados</span>
            </div>

            {showParticipantsTooltip && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1.5">
                  Integrantes en la sala ({participants.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {participants.length === 0 ? (
                    <p className="text-xs text-slate-500">Cargando lista...</p>
                  ) : (
                    participants.map((p, idx) => (
                      <div key={p.id || idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-800/50">
                        <div className="flex items-center gap-2 truncate">
                          <img src={p.avatar} alt="avatar" className="w-5 h-5 rounded-full bg-slate-800 border border-purple-500/30" />
                          <span className="text-slate-200 font-medium truncate">{p.username}</span>
                        </div>
                        {p.isHost && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" title="Host / Creador" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-800 border border-purple-500/30" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-tight flex items-center gap-1 text-slate-100">
                {user.username}
                {isHost && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
              </p>
              <p className="text-[10px] text-slate-400">{isHost ? 'Anfitrión (Host)' : 'Espectador'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1920px] w-full mx-auto">
        
        {/* COLUMNA IZQUIERDA: REPRODUCTOR DE VIDEO Y CONTROLES */}
        <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto space-y-4">
          
          {/* Pantalla del Reproductor */}
          <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
            {currentVideo ? (
              <YouTube
                videoId={currentVideo.url}
                className="w-full h-full"
                iframeClassName="w-full h-full"
                opts={{
                  playerVars: {
                    autoplay: 1,
                    controls: isHost ? 1 : 0,
                    modestbranding: 1,
                  },
                }}
                onReady={(e) => {
                  playerRef.current = e.target;
                  e.target.setVolume(volume);
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center bg-slate-950/80">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="w-24 h-24 bg-slate-900 border border-purple-500/30 rounded-3xl flex items-center justify-center relative shadow-2xl">
                    <OctopusIcon className="w-16 h-16 animate-bounce" />
                  </div>
                </div>
                <p className="text-base font-semibold text-slate-300">No hay ningún video reproduciéndose</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Agrega un enlace de YouTube en la pestaña de <span className="text-purple-400 font-medium">Cola</span> para comenzar la transmisión en vivo.
                </p>
              </div>
            )}
          </div>

          {/* Barra de Información del Video & Controles */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h2 className="text-sm font-semibold truncate text-white">
                {currentVideo ? currentVideo.title : 'Esperando contenido...'}
              </h2>
              {currentVideo && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Agregado por: <span className="text-purple-400 font-medium">{currentVideo.addedBy}</span>
                </p>
              )}
            </div>

            {/* Controles de Reproducción */}
            <div className="flex items-center gap-3">
              {isHost ? (
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl">
                  <button
                    onClick={handlePreviousVideo}
                    disabled={!hasPrevious}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Video Anterior"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-md shadow-purple-600/30 transition transform active:scale-95"
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    onClick={handleNextVideo}
                    disabled={videoQueue.length === 0}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Siguiente Video"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sincronizado con el Host</span>
                </div>
              )}
            </div>
          </div>

          {/* Barra de Reacciones Rápidas */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-3 flex items-center justify-between gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 pl-2 whitespace-nowrap">Reaccionar:</span>
            <div className="flex items-center gap-2">
              {['🔥', '❤️', '😂', '🎉', '😮', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="w-10 h-10 bg-slate-800/50 hover:bg-purple-600/20 hover:border-purple-500/50 border border-slate-700/40 rounded-xl flex items-center justify-center text-lg transition transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PANELS (CHAT / COLA / PREDICCIONES) */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-slate-900/30 flex flex-col h-[500px] lg:h-auto">
          
          {/* Pestañas Lateral */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition relative ${
                activeTab === 'queue'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Cola ({videoQueue.length})
            </button>

            <button
              onClick={() => setActiveTab('prediction')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'prediction'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Bingo
            </button>
          </div>

          {/* PESTAÑA 1: CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-600 my-8">
                    No hay mensajes aún. ¡Sé el primero en saludar!
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="flex flex-col text-xs">
                      <span className="text-[10px] text-purple-400 font-semibold mb-0.5">{m.user}</span>
                      <div className="bg-slate-800/70 border border-slate-700/40 rounded-2xl rounded-tl-none px-3.5 py-2 text-slate-200 max-w-[85%] self-start break-words shadow-sm">
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/80 flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl transition shadow-md shadow-purple-600/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* PESTAÑA 2: COLA DE VIDEOS */}
          {activeTab === 'queue' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
              <form onSubmit={handleAddVideo} className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Agregar video a la cola</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="URL de YouTube..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-md shadow-purple-600/20"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Próximos Videos</h3>
                {videoQueue.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-6">La cola está vacía.</p>
                ) : (
                  videoQueue.map((v, i) => (
                    <div key={v.id || i} className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{v.title}</p>
                        <p className="text-[10px] text-slate-500">Por: {v.addedBy}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-purple-400">
                        #{i + 1}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 3: BINGO / PREDICCIONES */}
          {activeTab === 'prediction' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  Predicción Activa
                </div>
                <h3 className="text-sm font-semibold text-white mb-4">{prediction.question}</h3>

                <div className="space-y-3">
                  <button
                    onClick={() => handleVote('A')}
                    disabled={prediction.userVoted !== null}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                      prediction.userVoted === 'A'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{prediction.optionA}</span>
                    <span className="font-bold text-purple-400">{prediction.votesA} votos</span>
                  </button>

                  <button
                    onClick={() => handleVote('B')}
                    disabled={prediction.userVoted !== null}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                      prediction.userVoted === 'B'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{prediction.optionB}</span>
                    <span className="font-bold text-purple-400">{prediction.votesB} votos</span>
                  </button>
                </div>

                {prediction.userVoted && (
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-3 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> ¡Voto registrado con éxito!
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}