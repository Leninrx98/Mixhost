import React, { useState } from 'react';
import { Vote, CheckCircle2 } from 'lucide-react';

export default function PollPanel({ activePoll, socket, isHost }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const hasVoted = activePoll?.votedUsers?.includes(socket?.id);

  if (!activePoll) return null;

  const handleVoteSubmit = () => {
    if (!selectedOption || hasVoted) return;
    socket.emit('cast_vote', { optionId: selectedOption });
  };

  return (
    <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4 mb-4 shadow-lg shadow-purple-950/20">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
          <Vote className="w-4 h-4 animate-pulse text-purple-400" />
          <span>Votación en Curso</span>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {activePoll.totalVotes} voto(s)
        </span>
      </div>

      <p className="text-xs text-slate-300 mb-3">Elige el siguiente video para la transmisión:</p>

      <div className="space-y-2 mb-4">
        {activePoll.options.map((option) => {
          const percentage = activePoll.totalVotes > 0 
            ? Math.round((option.votes / activePoll.totalVotes) * 100) 
            : 0;

          return (
            <div
              key={option.id}
              onClick={() => !hasVoted && setSelectedOption(option.id)}
              className={`relative overflow-hidden p-2.5 rounded-lg border transition text-left ${
                hasVoted
                  ? 'border-slate-800 bg-slate-900/50 cursor-default'
                  : selectedOption === option.id
                  ? 'border-purple-500 bg-purple-950/30 cursor-pointer'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 cursor-pointer'
              }`}
            >
              {hasVoted && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-purple-600/20 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200 truncate pr-2">
                  {option.title}
                </span>
                {hasVoted ? (
                  <span className="text-purple-400 font-bold ml-2">{percentage}%</span>
                ) : (
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedOption === option.id ? 'border-purple-500 bg-purple-600' : 'border-slate-600'
                  }`}>
                    {selectedOption === option.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!hasVoted ? (
        <button
          onClick={handleVoteSubmit}
          disabled={!selectedOption}
          className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            selectedOption
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Vote className="w-3.5 h-3.5" /> Confirmar Voto
        </button>
      ) : (
        <div className="flex items-center justify-center gap-1.5 text-xs text-purple-400 font-medium py-1">
          <CheckCircle2 className="w-4 h-4" /> Voto registrado
        </div>
      )}
    </div>
  );
}