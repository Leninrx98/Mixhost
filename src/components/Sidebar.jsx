import React, { useState } from 'react';
import { MessageSquare, ListVideo, Users, Send, Vote } from 'lucide-react';
import PollPanel from './PollPanel';

export default function Sidebar({
  messages,
  sendMessage,
  videoQueue,
  activePoll,
  socket,
  isHost,
  participants,
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const [inputText, setInputText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="w-full lg:w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col h-full select-none">
      <div className="flex border-b border-slate-800 p-1 bg-slate-950/60">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'chat'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'queue'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ListVideo className="w-3.5 h-3.5" />
          Cola ({videoQueue?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Salón ({participants?.length || 0})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {messages.map((msg, index) => (
                <div key={msg.id || index} className="text-xs">
                  {msg.isSystem ? (
                    <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-purple-300 my-1 text-center font-medium">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-300">{msg.username}</span>
                        <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-slate-300 bg-slate-800/60 p-2 rounded-lg border border-slate-800/80 break-words">
                        {msg.text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="mt-3 flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'queue' && (
          <div>
            {activePoll ? (
              <PollPanel activePoll={activePoll} socket={socket} isHost={isHost} />
            ) : (
              isHost && videoQueue && videoQueue.length >= 2 && (
                <button
                  onClick={() => socket.emit('start_poll')}
                  className="w-full mb-4 py-2.5 px-3 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Vote className="w-4 h-4 text-purple-400" />
                  Iniciar votación para el siguiente video
                </button>
              )
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Próximos en lista ({videoQueue?.length || 0})
              </h3>

              {!videoQueue || videoQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No hay videos pendientes en la cola.
                </div>
              ) : (
                videoQueue.map((video, index) => (
                  <div
                    key={video.id || index}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3"
                  >
                    <span className="text-xs font-bold text-slate-500 w-4 text-center">
                      #{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">
                        {video.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        Por: {video.addedBy}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Conectados ({participants?.length || 0})
            </h3>
            {participants?.map((user, index) => (
              <div
                key={user.sessionId || index}
                className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-200">
                  {user.avatar || user.username?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-slate-200 truncate block">
                    {user.username}
                  </span>
                </div>
                {user.isHost && (
                  <span className="text-[10px] bg-purple-900/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}