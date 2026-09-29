import React from 'react';
import { Info, Smile, Send } from 'lucide-react';

export default function ChatPanel({
  messages,
  chatBottomRef,
  showEmojiPicker,
  setShowEmojiPicker,
  inputMsg,
  setInputMsg,
  handleSendMessage,
}) {
  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-slate-600 my-8">
            No hay mensajes aún. ¡Sé el primero en saludar!
          </p>
        ) : (
          messages.map((m, idx) => (
            m.isSystem ? (
              <div key={m.id || idx} className="flex items-center justify-center gap-1.5 text-[11px] text-purple-400/80 my-1 bg-purple-950/20 py-1 px-3 rounded-full border border-purple-800/20">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>{m.text}</span>
              </div>
            ) : (
              <div key={m.id || idx} className="flex flex-col text-xs">
                <span className="text-[10px] text-purple-400 font-semibold mb-0.5">{m.user}</span>
                <div className="bg-slate-800/70 border border-slate-700/40 rounded-2xl rounded-tl-none px-3.5 py-2 text-slate-200 max-w-[85%] self-start break-words shadow-sm">
                  {m.text}
                </div>
              </div>
            )
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 right-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-2xl grid grid-cols-6 gap-2 z-50">
          {['😊', '🚀', '⭐', '🎶', '😎', '🍿', '🔥', '❤️', '👍', '🥳', '💯', '🙌'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputMsg((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="p-2 hover:bg-slate-800 rounded-xl text-center text-lg transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/80 flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-purple-400 rounded-xl transition"
        >
          <Smile className="w-5 h-5" />
        </button>
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
  );
}