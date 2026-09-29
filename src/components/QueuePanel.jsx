import React from 'react';
import { Plus } from 'lucide-react';

export default function QueuePanel({
  newVideoUrl,
  setNewVideoUrl,
  handleAddVideo,
  videoQueue,
}) {
  return (
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
  );
}