import React from 'react';
import YouTube from 'react-youtube';
import { TwitchEmbed } from 'react-twitch-embed';
import { SkipBack, Pause, Play, SkipForward, Lock } from 'lucide-react';
import { OctopusIcon } from './Header';
import Toast from './Toast';

// Función para obtener el ID limpio de YouTube
const getYouTubeId = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url;
};

// Función para extraer únicamente el nombre de canal de Twitch
const getTwitchChannel = (url) => {
  if (!url) return '';
  const cleaned = url.trim().replace(/(https?:\/\/)?(www\.)?twitch\.tv\//, '');
  return cleaned.split('/')[0].split('?')[0];
};

export default function VideoPlayer({
  currentVideo,
  playerRef,
  volume = 100,
  isHost,
  isPlaying,
  hasPrevious,
  videoQueue = [],
  togglePlayPause,
  handlePreviousVideo,
  handleNextVideo,
  handleSendReaction,
  socket,
  toast,
}) {
  const isTwitch = currentVideo?.type === 'twitch';
  const youtubeId = !isTwitch && currentVideo ? getYouTubeId(currentVideo.url) : null;
  const twitchChannel = isTwitch && currentVideo ? getTwitchChannel(currentVideo.url) : null;

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto space-y-4">
      {/* Marco del Reproductor */}
      <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
        <Toast toast={toast} />

        {currentVideo ? (
          isTwitch && twitchChannel ? (
            <div className="w-full h-full">
              <TwitchEmbed
                channel={twitchChannel}
                width="100%"
                height="100%"
                autoplay={true}
                muted={false}
                theme="dark"
                parent={['localhost', '127.0.0.1']}
              />
            </div>
          ) : youtubeId ? (
            <YouTube
              key={youtubeId}
              videoId={youtubeId}
              className="w-full h-full"
              iframeClassName="w-full h-full border-0"
              opts={{
                playerVars: {
                  autoplay: 1,
                  controls: 1,
                  modestbranding: 1,
                  rel: 0,
                  fs: 1,
                  iv_load_policy: 3,
                  enablejsapi: 1,
                },
              }}
              onReady={(e) => {
                if (playerRef) playerRef.current = e.target;
                if (typeof e.target.setVolume === 'function') {
                  e.target.setVolume(volume);
                }
                e.target.playVideo().catch(() => {
                  console.log('Autoplay requiere interacción del usuario.');
                });
              }}
              onStateChange={(e) => {
                if (isHost && socket) {
                  const currentTime = e.target.getCurrentTime ? e.target.getCurrentTime() : 0;
                  if (e.data === 1) {
                    socket.emit('host_play', currentTime);
                  } else if (e.data === 2) {
                    socket.emit('host_pause', currentTime);
                  }
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-rose-400 font-semibold">
              Enlace de video no válido
            </div>
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center bg-slate-950/80">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-xl animate-pulse"></div>
              <div className="w-24 h-24 bg-slate-900 border border-purple-500/30 rounded-3xl flex items-center justify-center relative shadow-2xl">
                <OctopusIcon className="w-16 h-16 animate-bounce" />
              </div>
            </div>
            <p className="text-base font-semibold text-slate-300">No hay contenido reproduciéndose</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Agrega un enlace de <span className="text-purple-400 font-medium">YouTube</span> o <span className="text-purple-400 font-medium">Twitch</span> en la pestaña de Cola.
            </p>
          </div>
        )}
      </div>

      {/* Barra de Controles e Info */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h2 className="text-sm font-semibold truncate text-white">
            {currentVideo ? currentVideo.title || currentVideo.url : 'Esperando contenido...'}
          </h2>
          {currentVideo && (
            <p className="text-xs text-slate-400 mt-0.5">
              Agregado por: <span className="text-purple-400 font-medium">{currentVideo.addedBy || 'Usuario'}</span>
            </p>
          )}
        </div>

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
                disabled={!currentVideo}
                className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-md shadow-purple-600/30 transition transform active:scale-95 disabled:opacity-40"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={handleNextVideo}
                disabled={!videoQueue || videoQueue.length === 0}
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
    </div>
  );
}