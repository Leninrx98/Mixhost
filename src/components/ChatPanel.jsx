import React, { useRef, useEffect, useState } from 'react';
import { Info, Smile, Send, Trash2, ArrowDown } from 'lucide-react';

export default function ChatPanel({
  messages,
  chatBottomRef,
  showEmojiPicker,
  setShowEmojiPicker,
  inputMsg,
  setInputMsg,
  handleSendMessage,
  isHost,
  onClearChat,
}) {
  const chatContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Detectar el scroll interno dentro del chat
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(isBottom);

    if (isBottom) {
      setHasNewMessages(false);
    }
  };

  // Autoscroll inteligente
  useEffect(() => {
    if (isAtBottom) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length > 0) {
      setHasNewMessages(true);
    }
  }, [messages]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
    setHasNewMessages(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden relative h-full">
      {/* Cabecera del chat */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Mensajes en vivo
        </span>
        {isHost && (
          <button
            onClick={onClearChat}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-xl hover:bg-slate-800 transition flex items-center gap-1 text-[11px]"
            title="Limpiar historial de chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      {/* Contenedor de mensajes aislado con scroll */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-3 relative min-h-0"
      >
        {messages.length === 0 ? (
          <p className="text-center text-xs text-slate-600 my-8">
            No hay mensajes aún. ¡Sé el primero en saludar!
          </p>
        ) : (
          messages.map((m, idx) =>
            m.isSystem ? (
              <div
                key={m.id || idx}
                className="flex items-center justify-center gap-1.5 text-[11px] text-purple-400/80 my-1 bg-purple-950/20 py-1 px-3 rounded-full border border-purple-800/20"
              >
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>{m.text}</span>
              </div>
            ) : (
              <div key={m.id || idx} className="flex flex-col text-xs">
                <span className="text-[10px] text-purple-400 font-semibold mb-0.5">
                  {m.user}
                </span>
                <div className="bg-slate-800/70 border border-slate-700/40 rounded-2xl rounded-tl-none px-3.5 py-2 text-slate-200 max-w-[85%] self-start break-words shadow-sm">
                  {m.text}
                </div>
              </div>
            )
          )
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Botón flotante para bajar rápido */}
      {hasNewMessages && !isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-lg border border-purple-400/30 flex items-center gap-1.5 transition animate-bounce z-40 cursor-pointer"
        >
          <ArrowDown className="w-3 h-3" />
          <span>Ver nuevos mensajes</span>
        </button>
      )}

      {/* Selector de Emojis */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 right-3 bg-slate-900 border border-slate-800 rounded-3xl p-2.5 shadow-2xl grid grid-cols-6 gap-2 z-50">
          {['😊', '🚀', '⭐', '🎶', '😎', '🍿', '🔥', '❤️', '👍', '🥳', '💯', '🙌'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputMsg((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="p-2 hover:bg-slate-800 rounded-2xl text-center text-lg transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input de envío */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-800 bg-slate-900/80 flex gap-2 items-center flex-shrink-0"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-purple-400 rounded-2xl transition"
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-2xl transition shadow-md shadow-purple-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}