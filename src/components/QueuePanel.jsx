import React from 'react';
import { Plus, Play, Vote } from 'lucide-react';

// Función para obtener la ID limpia de YouTube
const getYouTubeId = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url;
};

// Función para obtener la miniatura del video
const getThumbnailUrl = (video) => {
  if (video.type === 'twitch') {
    return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${video.url.toLowerCase()}-160x90.jpg`;
  }
  const ytId = getYouTubeId(video.url);
  return ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
};

export default function QueuePanel({
  newVideoUrl,
  setNewVideoUrl,
  handleAddVideo,
  videoQueue,
  isHost,
  activePoll,
  hasVotedActivePoll,
  handleStartPoll,
  handleVoteItem,
  handleFinishPoll,
}) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Formulario de agregar enlace */}
      <form onSubmit={handleAddVideo} className="p-4 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <label className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
            Agregar a la cola
          </label>
          <div className="flex items-center gap-2 opacity-80">
            <svg className="w-4 h-4 fill-red-500" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <svg className="w-4 h-4 fill-purple-400" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143h-1.715zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            placeholder="Pega aquí el enlace..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl shadow-md shadow-purple-600/20 transition active:scale-95 flex items-center justify-center"
            title="Añadir video"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Votación Activa / Iniciar Votación */}
      {activePoll ? (
        <div className="p-3 bg-purple-950/40 border-b border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Vote className="w-3.5 h-3.5 text-purple-400" /> Votación en Curso
            </span>
            {isHost && (
              <button
                onClick={handleFinishPoll}
                className="text-[10px] bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded-lg text-white font-semibold transition"
              >
                Finalizar y Reordenar
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {activePoll.items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleVoteItem(item.id)}
                disabled={hasVotedActivePoll}
                className={`w-full text-left p-2 rounded-xl border text-xs flex items-center justify-between transition ${
                  hasVotedActivePoll
                    ? 'bg-slate-900/60 border-slate-800 opacity-80 cursor-default'
                    : 'bg-slate-900 border-purple-500/30 hover:border-purple-500'
                }`}
              >
                <span className="truncate text-slate-200 font-medium pr-2">
                  {item.title}
                </span>
                <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                  {item.votes || 0} votos
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        videoQueue.length >= 3 &&
        isHost && (
          <div className="p-2.5 bg-slate-900/60 border-b border-slate-800 flex justify-end">
            <button
              onClick={handleStartPoll}
              className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1.5 rounded-xl text-white font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Vote className="w-3.5 h-3.5" /> Iniciar Votación de Cola
            </button>
          </div>
        )
      )}

      {/* Lista de reproducción con Miniaturas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {videoQueue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-6">
            <Play className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-medium">No hay videos en espera</p>
            <p className="text-[10px] text-slate-600 mt-1 max-w-[180px]">
              Los enlaces que agregues aparecerán aquí.
            </p>
          </div>
        ) : (
          videoQueue.map((video, idx) => {
            const thumb = getThumbnailUrl(video);
            return (
              <div
                key={video.id || idx}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 p-2.5 rounded-xl flex items-center justify-between gap-3 transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-5 h-5 rounded-md bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-300 flex-shrink-0">
                    {idx + 1}
                  </div>

                  {/* Previsualización / Miniatura */}
                  {thumb && (
                    <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                      <img
                        src={thumb}
                        alt="Miniatura"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 truncate group-hover:text-purple-300 transition-colors">
                      {video.title}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      Por: <span className="text-slate-400">{video.addedBy}</span>
                    </p>
                  </div>
                </div>

                {video.type === 'twitch' ? (
                  <svg className="w-4 h-4 fill-purple-400 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M11.571 4.714h1.715v5.143h-1.715zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 fill-red-500 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}