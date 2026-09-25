import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const DISCORD_CLIENT_ID = 'TU_CLIENT_ID_AQUI';
const REDIRECT_URI = 'http://localhost:5173/';
const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [usersCount, setUsersCount] = useState(1);
  const [participants, setParticipants] = useState([]);
  const [showParticipantsDropdown, setShowParticipantsDropdown] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Control de Salas
  const [roomId, setRoomId] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Reproductor, Cola e Historial
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoQueue, setVideoQueue] = useState([]);
  const [hasPreviousVideo, setHasPreviousVideo] = useState(false);
  const [showPrevModal, setShowPrevModal] = useState(false);

  // Identidad de usuario y Rol
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isNameSet, setIsNameSet] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const playerRef = useRef(null);
  const isHostRef = useRef(isHost);
  const isSyncingRef = useRef(false);

  // Predicciones / Bingo
  const [predictions, setPredictions] = useState([
    { id: 1, text: 'Mixy tira un solo de DJ 🎧', votes: 0 },
    { id: 2, text: 'Alguien manda 100 emojis de 🔥', votes: 0 }
  ]);
  const [newPredictionText, setNewPredictionText] = useState('');

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // Obtener o crear ID de sala desde la URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    let currentRoom = queryParams.get('room');

    if (!currentRoom) {
      currentRoom = Math.random().toString(36).substring(2, 8); // Genera ID de 6 caracteres
      const newUrl = `${window.location.pathname}?room=${currentRoom}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    setRoomId(currentRoom);
  }, []);

  const generateTag = () => `#${Math.floor(1000 + Math.random() * 9000)}`;

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    const videoId = currentVideo ? extractYouTubeId(currentVideo.url) : null;
    if (!videoId) return;

    const initPlayer = () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('yt-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
        },
        events: {
          onStateChange: handlePlayerStateChange,
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [currentVideo]);

  const handlePlayerStateChange = (event) => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }

    if (event.data === window.YT.PlayerState.ENDED) {
      if (isHostRef.current) {
        socket.emit('play_next_video');
      }
      return;
    }

    if (!isHostRef.current) return;

    const currentTime = playerRef.current ? playerRef.current.getCurrentTime() : 0;

    if (event.data === window.YT.PlayerState.PLAYING) {
      socket.emit('host_play', currentTime);
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      socket.emit('host_pause', currentTime);
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');

      if (accessToken) {
        fetch('https://discord.com/api/users/@me', {
          headers: { authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.username) {
              const cleanDiscordName = data.global_name || data.username;
              const avatarUrl = data.avatar
                ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
                : null;
              const userTag = generateTag();
              const fullName = `${cleanDiscordName}${userTag}`;

              setUsername(fullName);
              setUserAvatar(avatarUrl);
              setIsNameSet(true);

              const currentRoom = new URLSearchParams(window.location.search).get('room') || roomId;
              socket.emit('join_room', { roomId: currentRoom, username: fullName, avatar: avatarUrl });
              window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            }
          })
          .catch((err) => console.error('Error con Discord:', err));
      }
    }

    socket.on('init_state', (data) => {
      setMessages(data.messages || []);
      setUsersCount(data.connectedUsers || 1);
      setIsHost(data.isHost || false);
      setCurrentVideo(data.currentVideo || null);
      setVideoQueue(data.videoQueue || []);
      setHasPreviousVideo(data.hasPreviousVideo || false);
    });

    socket.on('users_count', (count) => setUsersCount(count));
    socket.on('host_status', (status) => setIsHost(status));
    socket.on('update_participants', (list) => setParticipants(list));

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('receive_reaction', (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2000);
    });

    socket.on('sync_video', (data) => {
      setCurrentVideo(data.currentVideo);
      setVideoQueue(data.videoQueue);
      setHasPreviousVideo(data.hasPreviousVideo);
    });

    socket.on('update_queue', (queue) => {
      setVideoQueue(queue);
    });

    socket.on('sync_play', (time) => {
      if (playerRef.current && playerRef.current.seekTo) {
        isSyncingRef.current = true;
        playerRef.current.seekTo(time, true);
        playerRef.current.playVideo();
      }
    });

    socket.on('sync_pause', (time) => {
      if (playerRef.current && playerRef.current.seekTo) {
        isSyncingRef.current = true;
        playerRef.current.seekTo(time, true);
        playerRef.current.pauseVideo();
      }
    });

    return () => {
      socket.off('init_state');
      socket.off('users_count');
      socket.off('host_status');
      socket.off('update_participants');
      socket.off('receive_message');
      socket.off('receive_reaction');
      socket.off('sync_video');
      socket.off('update_queue');
      socket.off('sync_play');
      socket.off('sync_pause');
    };
  }, [roomId]);

  const handleSetUsername = (e) => {
    e.preventDefault();
    const sanitized = tempUsername.replace(/[^\w\s-]/gi, '').trim();

    if (sanitized.length < 3) {
      alert('El nombre debe tener al menos 3 caracteres válidos.');
      return;
    }

    const finalNameWithTag = `${sanitized}${generateTag()}`;
    setUsername(finalNameWithTag);
    setIsNameSet(true);

    socket.emit('join_room', { roomId, username: finalNameWithTag, avatar: null });
  };

  const handleConnectDiscord = () => {
    window.location.href = DISCORD_AUTH_URL;
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    socket.emit('send_message', {
      user: username,
      text: inputMessage,
    });
    setInputMessage('');
  };

  const handleSendReaction = (emoji) => {
    socket.emit('send_reaction', emoji);
  };

  const handleAddVideoToQueue = async (e) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) return;

    const videoId = extractYouTubeId(videoUrlInput);
    let videoTitle = 'Video de YouTube';

    if (videoId) {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.title) videoTitle = data.title;
        }
      } catch (err) {
        console.error('Error al obtener el título:', err);
      }
    }

    socket.emit('add_to_queue', {
      url: videoUrlInput,
      title: videoTitle,
      addedBy: username,
    });

    setVideoUrlInput('');
  };

  const handleNextVideo = () => {
    socket.emit('play_next_video');
  };

  const handleConfirmPreviousVideo = () => {
    setShowPrevModal(false);
    socket.emit('play_previous_video');
  };

  const handleAddPrediction = (e) => {
    e.preventDefault();
    if (!newPredictionText.trim()) return;
    setPredictions([
      ...predictions,
      { id: Date.now(), text: newPredictionText, votes: 0 },
    ]);
    setNewPredictionText('');
  };

  const handleVotePrediction = (id) => {
    setPredictions(
      predictions.map((p) => (p.id === id ? { ...p, votes: p.votes + 1 } : p))
    );
  };

  const visibleQueue = videoQueue.slice(0, 2);
  const extraCount = videoQueue.length > 2 ? videoQueue.length - 2 : 0;

  const visibleParticipants = participants.slice(0, 5);
  const extraParticipantsCount = participants.length > 5 ? participants.length - 5 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* MODAL DE CONFIRMACIÓN PARA VOLVER ATRÁS */}
      {showPrevModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-700/50 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-900/50 text-purple-300 rounded-2xl flex items-center justify-center text-2xl mb-3 border border-purple-700/40">
              ⏮
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              ¿Volver al video anterior?
            </h3>
            <p className="text-xs text-purple-300/70 mb-6">
              El video actual volverá al primer lugar de la cola para no perderse.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowPrevModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl transition text-xs border border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPreviousVideo}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-xl transition text-xs shadow-md shadow-purple-600/30"
              >
                Sí, regresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO */}
      {!isNameSet && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-800/50 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg shadow-purple-500/30 animate-bounce">
              🐙
            </div>
            <h2 className="text-xl font-bold text-white mb-1">¡Bienvenido a MixHost!</h2>
            <p className="text-xs text-purple-300/70 mb-2">
              Te estás uniendo a la sala: <span className="text-purple-400 font-bold">#{roomId}</span>
            </p>

            <button
              onClick={handleConnectDiscord}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md my-4"
            >
              Iniciar sesión con Discord
            </button>

            <div className="w-full flex items-center my-2">
              <div className="flex-1 border-t border-purple-900/40"></div>
              <span className="px-3 text-[10px] text-purple-400/60 uppercase tracking-widest font-semibold">
                o usa un nombre temporal
              </span>
              <div className="flex-1 border-t border-purple-900/40"></div>
            </div>

            <form onSubmit={handleSetUsername} className="w-full flex flex-col gap-2 mt-2">
              <input
                type="text"
                placeholder="Ej. Luis P. (3-20 chars)"
                maxLength={20}
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className="w-full bg-slate-950 border border-purple-800/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 text-center"
              />
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-purple-200 border border-purple-700/40 font-semibold py-2 rounded-xl transition text-xs"
              >
                Continuar como Invitado
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-purple-900/30 bg-slate-900/60 backdrop-blur-md p-4 flex items-center justify-between relative z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">
            🐙
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-purple-100">MixHost</h1>
              <span className="text-[10px] bg-purple-950 border border-purple-800/40 text-purple-300 px-2 py-0.5 rounded-md font-mono">
                #{roomId}
              </span>
            </div>
            <p className="text-xs text-purple-300/60">DJ Mixy's Watch Party</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÓN COPIAR ENLACE DE INVITACIÓN */}
          <button
            onClick={handleCopyInviteLink}
            className="bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/40 text-purple-200 text-xs px-3 py-1.5 rounded-full transition flex items-center gap-1.5 font-medium"
          >
            <span>{copiedLink ? '✓ ¡Copiado!' : '🔗 Invitar'}</span>
          </button>

          {/* BOTÓN + MENÚ DESPLEGABLE DE PARTICIPANTES */}
          <div
            className="relative"
            onMouseEnter={() => setShowParticipantsDropdown(true)}
            onMouseLeave={() => setShowParticipantsDropdown(false)}
          >
            <button
              onClick={() => setShowParticipantsDropdown(!showParticipantsDropdown)}
              className="flex items-center gap-2 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/30 px-3 py-1.5 rounded-full text-xs text-purple-200 transition cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>👥 {usersCount} Conectados</span>
            </button>

            {showParticipantsDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-purple-700/40 rounded-2xl shadow-2xl p-3 backdrop-blur-md z-50 flex flex-col gap-2 transition-all">
                <div className="flex items-center justify-between border-b border-purple-900/30 pb-2">
                  <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
                    En la sala ({participants.length})
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                  {visibleParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-slate-950/60 border border-purple-900/20 px-2.5 py-1.5 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {p.avatar ? (
                          <img src={p.avatar} alt="Avatar" className="w-5 h-5 rounded-full shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-purple-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {p.username ? p.username.charAt(0).toUpperCase() : '👤'}
                          </div>
                        )}
                        <span className="text-slate-200 truncate text-[11px]">
                          {p.username}
                        </span>
                      </div>

                      {p.isHost && (
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                          👑
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {extraParticipantsCount > 0 && (
                  <p className="text-[10px] text-purple-400/70 text-center font-semibold pt-1 border-t border-purple-900/20">
                    ...y {extraParticipantsCount} {extraParticipantsCount === 1 ? 'persona más' : 'personas más'}
                  </p>
                )}
              </div>
            )}
          </div>

          {isNameSet && (
            <div className="flex items-center gap-2 bg-slate-900 border border-purple-800/40 px-3 py-1 rounded-full text-xs">
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-purple-700 flex items-center justify-center text-[10px]">
                  👤
                </div>
              )}
              <span className="font-medium text-purple-200">
                {username} {isHost && '👑'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 p-4 gap-4 max-w-7xl mx-auto w-full">
        {/* COLUMNA IZQUIERDA (VIDEO, COLA Y BINGO) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* BARRA DE AGREGAR VIDEO */}
          <form onSubmit={handleAddVideoToQueue} className="flex gap-2">
            <input
              type="text"
              placeholder="Pega un enlace de YouTube para agregar a la cola..."
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-purple-800/40 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              ➕ Agregar a la Cola
            </button>
          </form>

          {/* REPRODUCTOR */}
          <div className="relative aspect-video bg-slate-900/80 rounded-2xl overflow-hidden border border-purple-900/30 shadow-2xl flex items-center justify-center">
            {currentVideo ? (
              <div id="yt-player" className="w-full h-full"></div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center animate-pulse">
                <div className="w-24 h-24 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center text-5xl mb-4 shadow-2xl shadow-purple-500/20 animate-bounce">
                  🐙
                </div>
                <h3 className="text-lg font-bold text-purple-100 mb-1">
                  ¡La sala #{roomId} está lista para reproducir!
                </h3>
                <p className="text-xs text-purple-300/70 max-w-sm">
                  Cualquier participante puede pegar un enlace de YouTube arriba para añadirlo a la cola y empezar.
                </p>
              </div>
            )}

            {/* REACCIONES FLOTANTES */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {reactions.map((r) => (
                <div
                  key={r.id}
                  style={{ left: `${r.left}%` }}
                  className="absolute bottom-4 text-3xl animate-bounce transition-all duration-1000"
                >
                  {r.symbol}
                </div>
              ))}
            </div>
          </div>

          {/* BARRA DE COLA Y BOTONES DE NAVEGACIÓN */}
          <div className="bg-slate-900/60 border border-purple-900/30 p-3 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 border-b border-purple-900/20 pb-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs bg-purple-600/30 border border-purple-500/40 text-purple-200 px-2 py-0.5 rounded-md font-bold shrink-0">
                  ▶ Reproduciendo
                </span>
                <span className="text-xs font-semibold text-white truncate">
                  {currentVideo ? currentVideo.title : 'Ningún video en reproducción'}
                </span>
                {currentVideo && (
                  <span className="text-[10px] text-purple-300/60 shrink-0">
                    (por {currentVideo.addedBy})
                  </span>
                )}
              </div>

              {/* Botones de Navegación del Anfitrión */}
              {isHost && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={!hasPreviousVideo}
                    onClick={() => setShowPrevModal(true)}
                    className="disabled:opacity-40 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 border border-purple-700/40 text-purple-200 text-[11px] px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                    title="Volver al video anterior"
                  >
                    ⏮ <span>Anterior</span>
                  </button>

                  <button
                    disabled={!currentVideo && videoQueue.length === 0}
                    onClick={handleNextVideo}
                    className="disabled:opacity-40 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 border border-purple-700/40 text-purple-200 text-[11px] px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                    title="Avanzar al siguiente video"
                  >
                    <span>Siguiente</span> ⏭
                  </button>
                </div>
              )}
            </div>

            {/* Lista compacta de la cola */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                A continuación en la cola ({videoQueue.length}):
              </span>

              {visibleQueue.length > 0 ? (
                visibleQueue.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/50 border border-purple-900/30 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-purple-400 font-bold text-[11px] shrink-0">
                        #{index + 1}
                      </span>
                      <span className="text-slate-200 truncate">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-purple-400/60 shrink-0 font-medium">
                      {item.addedBy}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-purple-300/40 italic">
                  La cola está vacía. ¡Pega un enlace para sugerir el próximo video!
                </p>
              )}

              {extraCount > 0 && (
                <div className="text-[10px] text-purple-400/70 font-semibold text-center mt-0.5">
                  . . . y {extraCount} {extraCount === 1 ? 'video más' : 'videos más'} en espera
                </div>
              )}
            </div>
          </div>

          {/* BINGO */}
          <div className="bg-slate-900/60 border border-purple-900/30 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider mb-3">
              🎯 Bingo de Predicciones
            </h3>
            <form onSubmit={handleAddPrediction} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Escribe una nueva predicción..."
                value={newPredictionText}
                onChange={(e) => setNewPredictionText(e.target.value)}
                className="flex-1 bg-slate-950 border border-purple-800/40 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="bg-purple-800 hover:bg-purple-700 px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                + Agregar
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {predictions.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleVotePrediction(p.id)}
                  className="cursor-pointer bg-slate-950/60 border border-purple-900/30 hover:border-purple-600/50 p-2.5 rounded-xl flex items-center justify-between transition"
                >
                  <span className="text-xs text-slate-200">{p.text}</span>
                  <span className="bg-purple-950 border border-purple-800/50 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {p.votes}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (CHAT Y REACCIONES) */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-purple-900/30 rounded-2xl flex flex-col h-[400px] lg:h-[480px] overflow-hidden">
            <div className="p-3 border-b border-purple-900/30 bg-slate-900/80 flex items-center justify-between">
              <h2 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                💬 Chat en Vivo
              </h2>
            </div>

            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
              {messages.map((msg) =>
                msg.isSystem ? (
                  <div
                    key={msg.id}
                    className="text-[11px] text-center my-1 font-semibold text-purple-300/70 italic bg-purple-950/20 py-1 px-2 rounded-lg border border-purple-800/20"
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className="text-xs bg-purple-950/30 p-2 rounded-lg border border-purple-900/20"
                  >
                    <span className="font-bold text-purple-400 block mb-0.5">{msg.user}</span>
                    <span className="text-slate-200">{msg.text}</span>
                  </div>
                )
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-purple-900/30 flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-slate-950 border border-purple-800/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-xl text-xs font-semibold"
              >
                Enviar
              </button>
            </form>
          </div>

          <div className="bg-slate-900/60 border border-purple-900/30 p-3 rounded-2xl flex flex-col gap-2">
            <span className="text-[11px] text-purple-300 font-medium uppercase tracking-wider text-center">
              Reacciona en vivo:
            </span>
            <div className="flex justify-between gap-1">
              {['🔥', '🎉', '🐙', '❤️', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="hover:scale-125 transition-transform text-lg bg-purple-950/40 p-2 rounded-xl border border-purple-800/30 flex-1 flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}