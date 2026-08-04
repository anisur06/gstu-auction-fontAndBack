import React from 'react';
import { ArrowRightCircle, Tag, Sparkles } from 'lucide-react';
import FutPlayerCard from '../components/FutPlayerCard';

export default function UnallocatedPlayers({ players = [], onPushToPodium, systemState }) {
  const unallocated = players.filter(p => ['AVAILABLE', 'UNSOLD'].includes(p.status));
  const isAuction = systemState?.phase === 'AUCTION';

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs uppercase tracking-[0.35em] border border-blue-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Unallocated Players Pool
            </div>
            <h1 className="text-4xl font-teko font-bold text-white">Available Players</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">All players not yet sold or currently available for auction selection.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-[0.25em]">Auction Phase Status</p>
            <p className={`text-lg font-bold ${isAuction ? 'text-emerald-400' : 'text-slate-400'}`}>{isAuction ? 'Live Auction Active' : 'Auction Not Active'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {unallocated.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-center text-slate-400">
            No unallocated players found. All players have been processed or are already on the podium.
          </div>
        ) : unallocated.map(player => (
          <div key={player.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl transition-all hover:border-blue-500/30">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-[0.3em]">{player.status === 'UNSOLD' ? 'Unsold' : 'Available'}</p>
                <h2 className="text-xl font-bold text-white mt-2">{player.name}</h2>
              </div>
              <div className="rounded-2xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs font-bold text-slate-300">
                {player.tier}
              </div>
            </div>

            <FutPlayerCard player={player} size="small" />

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Position</span>
                <span className="font-bold text-white">{player.primaryPosition}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>OVR</span>
                <span className="font-bold text-white">{player.ovr}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Base Price</span>
                <span className="font-mono font-bold text-emerald-400">${(player.basePrice || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                disabled={!isAuction}
                onClick={() => onPushToPodium?.(player.id)}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-700/60 transition-all hover:from-blue-500 hover:to-purple-500"
              >
                <ArrowRightCircle className="w-4 h-4" /> Push to Live Podium
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-700 px-4 py-3 text-slate-300 hover:border-blue-500 hover:text-white transition-all"
                onClick={() => alert('Category assignment is managed from the Dashboard.')}
              >
                <Tag className="w-4 h-4" /> Assign / Switch Category
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
