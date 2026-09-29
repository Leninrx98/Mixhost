import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  MessageSquare,
  Plus,
  Tv,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

import Header, { OctopusIcon } from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import ChatPanel from './components/ChatPanel';
import QueuePanel from './components/QueuePanel';
import Toast from './components/Toast';

const socket = io('http://localhost:3001');

export default function App() {
  const [user, setUser] = useState(null);
  const [tempName, setTempName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [isCreatingNewRoom, setIsCreatingNewRoom] = useState(false);
  const [roomError, setRoomError] = useState(null);

  const [isHost, setIsHost] = useState(false);
  const [connectedCount, setConnectedCount] = useState(1);
  const [participants, setParticipants] = useState([]);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [showSwitchRoomInput, setShowSwitchRoomInput] = useState(false);
  const [switchRoomCode, setSwitchRoomCode] = useState('');
  const [showParticipantsTooltip, setShowParticipantsTooltip] = useState(false);

  const inviteTimerRef = useRef(null);
  const switchTimerRef = useRef(null);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoQueue, setVideoQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const playerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactions, setActiveReactions] = useState([]);
  const chatBottomRef = useRef(null);

  // Estado para notificaciones efímeras (Toasts)
  const [systemToast, setSystemToast] = useState(null);
  const toastTimerRef = useRef(null);

  const triggerToast = (text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setSystemToast(text);
    toastTimerRef.current = setTimeout(() => {
      setSystemToast(null);
    }, 3500);
  };

  const [activeTab, setActiveTab] = useState('chat');

  const [prediction, setPrediction] = useState({
    question: '¿Qué canción vendrá a continuación?',
    optionA: 'Pop / Reggaeton Hits',
    optionB: 'Rock / Anime Openings',
    votesA: 3,
    votesB: 5,
    userVoted: null,
  });

  const tabSessionIdRef = useRef('');
  if (!tabSessionIdRef.current) {
    let sId = sessionStorage.getItem('mixhost_session_id');
    if (!sId) {
      sId = 'usr_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('mixhost_session_id', sId);
    }
    tabSessionIdRef.current = sId;
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }
  }, []);

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
      setUser(null);
    });

    socket.on('users_count', (count) => setConnectedCount(count));
    socket.on('update_participants', (list) => setParticipants(list || []));
    socket.on('host_status', (status) => setIsHost(status));

    // Escuchadores de notificaciones flotantes (Toasts)
    socket.on('user_joined', (data) => {
      triggerToast(`📢 ${data.username} se ha unido a la sala`);
    });

    socket.on('user_left', (data) => {
      triggerToast(`📢 ${data.username} ha salido de la sala`);
    });

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
      if (data.currentVideo?.title) {
        triggerToast(`▶️ Reproduciendo: ${data.currentVideo.title}`);
      }
    });

    socket.on('update_queue', (queue) => {
      setVideoQueue(queue);
    });

    socket.on('sync_play', (time) => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        if (time !== undefined && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          if (Math.abs(currentTime - time) > 1.0) {
            playerRef.current.seekTo(time, true);
          }
        }
        playerRef.current.playVideo();
      }
      setIsPlaying(true);
      triggerToast("▶️ El Host reanudó la reproducción");
    });

    socket.on('sync_pause', (time) => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
        if (time !== undefined && typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(time, true);
        }
      }
      setIsPlaying(false);
      triggerToast("⏸️ El Host pausó la reproducción");
    });

    return () => {
      socket.off('init_state');
      socket.off('room_error');
      socket.off('users_count');
      socket.off('update_participants');
      socket.off('host_status');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('receive_message');
      socket.off('receive_reaction');
      socket.off('sync_video');
      socket.off('update_queue');
      socket.off('sync_play');
      socket.off('sync_pause');
    };
  }, [user, roomId, isCreatingNewRoom]);

  useEffect(() => {
    if (currentVideo && playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(currentVideo.url);
    }
  }, [currentVideo]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMouseEnterInvite = () => {
    if (inviteTimerRef.current) clearTimeout(inviteTimerRef.current);
    setShowInviteMenu(true);
  };

  const handleMouseLeaveInvite = () => {
    inviteTimerRef.current = setTimeout(() => {
      setShowInviteMenu(false);
    }, 250);
  };

  const handleMouseEnterSwitch = () => {
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    setShowSwitchRoomInput(true);
  };

  const handleMouseLeaveSwitch = () => {
    switchTimerRef.current = setTimeout(() => {
      setShowSwitchRoomInput(false);
    }, 250);
  };

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
    socket.emit('send_message', { user: user.username, text: inputMsg, isSystem: false });
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
    const currentTime = typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() : 0;
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-purple-500 selection:text-white relative">
      <Toast toast={systemToast} />

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

      <Header
        roomId={roomId}
        user={user}
        isHost={isHost}
        connectedCount={connectedCount}
        participants={participants}
        showInviteMenu={showInviteMenu}
        handleMouseEnterInvite={handleMouseEnterInvite}
        handleMouseLeaveInvite={handleMouseLeaveInvite}
        handleCopyLink={handleCopyLink}
        handleCopyCode={handleCopyCode}
        copiedLink={copiedLink}
        copiedCode={copiedCode}
        showSwitchRoomInput={showSwitchRoomInput}
        handleMouseEnterSwitch={handleMouseEnterSwitch}
        handleMouseLeaveSwitch={handleMouseLeaveSwitch}
        handleSwitchRoom={handleSwitchRoom}
        switchRoomCode={switchRoomCode}
        setSwitchRoomCode={setSwitchRoomCode}
        showParticipantsTooltip={showParticipantsTooltip}
        setShowParticipantsTooltip={setShowParticipantsTooltip}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1920px] w-full mx-auto">
        <VideoPlayer
          currentVideo={currentVideo}
          playerRef={playerRef}
          volume={volume}
          isHost={isHost}
          isPlaying={isPlaying}
          hasPrevious={hasPrevious}
          videoQueue={videoQueue}
          togglePlayPause={togglePlayPause}
          handlePreviousVideo={handlePreviousVideo}
          handleNextVideo={handleNextVideo}
          handleSendReaction={handleSendReaction}
          socket={socket}
        />

        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-slate-900/30 flex flex-col h-[500px] lg:h-auto">
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

          {activeTab === 'chat' && (
            <ChatPanel
              messages={messages}
              chatBottomRef={chatBottomRef}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              inputMsg={inputMsg}
              setInputMsg={setInputMsg}
              handleSendMessage={handleSendMessage}
            />
          )}

          {activeTab === 'queue' && (
            <QueuePanel
              newVideoUrl={newVideoUrl}
              setNewVideoUrl={setNewVideoUrl}
              handleAddVideo={handleAddVideo}
              videoQueue={videoQueue}
            />
          )}

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