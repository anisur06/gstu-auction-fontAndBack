import React, { useState, useEffect, useRef } from 'react';
import FutPlayerCard from '../components/FutPlayerCard';
import { Eye, TrendingUp, DollarSign, Trophy, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LivePodiumSpectator({ socket, systemState, players = [], teams = [], auctionLedger = [] }) {
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [celebrationPlayer, setCelebrationPlayer] = useState(null);
  const [celebrationTeam, setCelebrationTeam] = useState(null);
  const [celebrationPrice, setCelebrationPrice] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [latestBid, setLatestBid] = useState(null);
  const confettiRef = useRef(null);

  const isAuction = systemState?.phase === 'AUCTION';
  const biddingMode = systemState?.biddingMode || 'NORMAL';
  const currentBid = systemState?.currentBid || 0;
  const highestBidderName = systemState?.highestBidderTeamName || '—';
  const timerStatus = systemState?.podiumTimerStatus || 'STOPPED';

  const currentPlayer = players.find(p => p.id === systemState?.currentAuctionPlayerId);
  const soldPlayers = players.filter(p => p.status === 'SOLD').slice(0, 20);

  useEffect(() => {
    socket.on('timer:tick', ({ seconds }) => setTimerSeconds(seconds));
    socket.on('bid:new', (entry) => setLatestBid(entry));

    socket.on('podium:sold_celebration', ({ player, team, price }) => {
      setCelebrationPlayer(player);
      setCelebrationTeam(team);
      setCelebrationPrice(price);
      setShowCelebration(true);

      // Fire confetti!
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'] });
      setTimeout(() => {
        confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } });
      }, 300);

      setTimeout(() => setShowCelebration(false), 6000);
    });

    return () => {
      socket.off('timer:tick');
      socket.off('bid:new');
      socket.off('podium:sold_celebration');
    };
  }, [socket]);

  const timerColor = timerSeconds > 15 ? 'text-emerald-400' : timerSeconds > 7 ? 'text-amber-400' : 'text-red-400 animate-pulse';

  // Top spenders by budgetSpent
  const topSpenders = [...teams].sort((a, b) => (b.budgetSpent || 0) - (a.budgetSpent || 0));

  // Bidding feed — last 20 entries
  const liveFeed = auctionLedger.slice(0, 20);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ===== SOLD CELEBRATION OVERLAY ===== */}
      {showCelebration && celebrationPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 pointer-events-none">
          <div className="pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500 text-slate-950 font-teko text-3xl font-bold rounded-full shadow-2xl mb-6 animate-bounce">
              🎉 SOLD!
            </div>
            <FutPlayerCard player={celebrationPlayer} size="large" isSold={true} soldPrice={celebrationPrice} soldTeamName={celebrationTeam?.name} />
            <div className="mt-6 bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 max-w-sm mx-auto">
              <p className="font-teko text-4xl font-black text-white">{celebrationPlayer.name}</p>
              <p className="text-emerald-400 font-bold text-lg">{celebrationTeam?.name}</p>
              <p className="font-mono text-2xl font-black text-white mt-2">${celebrationPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== LIVE PODIUM BANNER ===== */}
      <div className={`${isAuction ? 'bg-gradient-to-r from-blue-950 via-slate-950 to-indigo-950' : 'bg-slate-950'} border-b border-slate-800 py-4 px-6`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold ${isAuction ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              <Eye className="w-3.5 h-3.5" />
              {isAuction ? 'LIVE AUCTION — SPECTATOR VIEW' : 'PUBLIC PODIUM — Waiting for Auction...'}
            </div>
            {isAuction && biddingMode === 'BLIND' && (
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-full">
                🙈 BLIND BIDDING ACTIVE
              </span>
            )}
          </div>
          {isAuction && currentPlayer && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Highest Bidder:</span>
              <span className="font-bold text-blue-400 text-sm">{highestBidderName}</span>
              <span className="font-mono font-black text-white text-lg">${currentBid.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Podium — Current Player Card + Timer */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl flex flex-col items-center">
              <h2 className="font-teko text-2xl font-bold text-white uppercase mb-6 tracking-wider">
                🎤 ON THE PODIUM
              </h2>
              {currentPlayer ? (
                <>
                  <FutPlayerCard player={currentPlayer} size="large" />
                  <div className="w-full mt-6 space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-400">Base Price</span>
                      <span className="font-mono text-amber-400">${currentPlayer.basePrice?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-400">Current Bid</span>
                      <span className="font-mono text-emerald-400 text-xl">${currentBid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-400">Winning Team</span>
                      <span className="text-blue-400">{highestBidderName}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="text-7xl mb-4">⏳</div>
                  <p className="text-slate-400">Next player will appear here...</p>
                </div>
              )}
            </div>

            {/* Live Timer */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center backdrop-blur-md shadow-xl">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">Bidding Timer</span>
              <div className={`font-teko text-8xl font-black tabular-nums ${timerColor}`}>
                {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${timerSeconds > 15 ? 'bg-emerald-500' : timerSeconds > 7 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`}
                  style={{ width: `${(timerSeconds / 30) * 100}%` }}
                />
              </div>
              <div className={`text-xs font-bold mt-2 ${timerStatus === 'RUNNING' ? 'text-emerald-400' : timerStatus === 'PAUSED' ? 'text-amber-400' : 'text-slate-500'}`}>
                {timerStatus}
              </div>
            </div>
          </div>

          {/* MIDDLE: Live Bid Feed + Top Spenders */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Bid Ticker */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="font-teko text-2xl font-bold text-white">LIVE BID TICKER</h3>
                <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {liveFeed.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">Waiting for bids...</p>
                ) : (
                  liveFeed.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${idx === 0 ? 'bg-blue-950/60 border-blue-500/50' : 'bg-slate-950 border-slate-800'}`}
                    >
                      <div className="flex items-center gap-2">
                        {idx === 0 && <Zap className="w-4 h-4 text-blue-400 shrink-0" />}
                        <div>
                          <p className="font-bold text-white text-xs">{entry.teamName}</p>
                          <p className="text-[11px] text-slate-400">{entry.playerName} · {entry.type}</p>
                        </div>
                      </div>
                      <span className={`font-mono font-black ${idx === 0 ? 'text-blue-300 text-base' : 'text-slate-300 text-sm'}`}>
                        ${entry.amount?.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Franchise Spenders */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="font-teko text-2xl font-bold text-white">FRANCHISE SPENDERS</h3>
              </div>
              <div className="space-y-3">
                {topSpenders.map((team, idx) => (
                  <div key={team.id} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-400 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'}`}>
                      {idx + 1}
                    </span>
                    <div className="text-2xl">{team.logo || '⚽'}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">{team.name}</span>
                        <span className="font-mono text-xs text-red-400 font-bold">${(team.budgetSpent || 0).toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, ((team.budgetSpent || 0) / (team.budget || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{team.roster?.length || 0} signed</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Completed Sales Gallery */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <h3 className="font-teko text-2xl font-bold text-white">SIGNED PLAYERS</h3>
              </div>
              {soldPlayers.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No signed players yet.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {soldPlayers.map(player => {
                    const soldTeam = teams.find(t => t.id === player.soldToTeamId);
                    return (
                      <div key={player.id} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 ${player.tier === 'Platinum' ? 'bg-gradient-to-br from-blue-600 to-purple-700' : player.tier === 'Gold' ? 'bg-gradient-to-br from-amber-500 to-yellow-600' : 'bg-slate-700'}`}>
                          {player.primaryPosition}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-xs truncate">{player.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{soldTeam?.name || 'Unknown'}</p>
                        </div>
                        <span className="font-mono text-xs text-emerald-400 font-bold shrink-0">${(player.soldPrice || 0).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
