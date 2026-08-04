import React, { useState, useEffect } from 'react';
import FutPlayerCard from '../components/FutPlayerCard';
import { Play, Pause, RotateCcw, SkipForward, AlertTriangle, Check, ChevronRight, Radio, RefreshCw, List } from 'lucide-react';

export default function PodiumAuctioneer({ socket, systemState, players = [], teams = [], auctionLedger = [] }) {
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [timerPreset, setTimerPreset] = useState(30);
  const [podiumMsg, setPodiumMsg] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);

  const isAuction = systemState?.phase === 'AUCTION';
  const timerStatus = systemState?.podiumTimerStatus || 'STOPPED';
  const biddingMode = systemState?.biddingMode || 'NORMAL';
  const currentBid = systemState?.currentBid || 0;
  const highestBidderName = systemState?.highestBidderTeamName || '—';

  const currentPlayer = players.find(p => p.id === systemState?.currentAuctionPlayerId);
  const availablePlayers = players.filter(p => p.status === 'AVAILABLE');

  // Live timer from state sync
  useEffect(() => {
    if (systemState?.podiumTimer !== undefined) {
      setTimerSeconds(systemState.podiumTimer);
    }
  }, [systemState?.podiumTimer]);

  useEffect(() => {
    socket.on('timer:tick', ({ seconds }) => setTimerSeconds(seconds));
    socket.on('podium:message', ({ text }) => {
      setPodiumMsg(text);
      setTimeout(() => setPodiumMsg(''), 4000);
    });
    socket.on('podium:sold_celebration', ({ player, team, price }) => {
      setPodiumMsg(`🎉 SOLD! ${player.name} → ${team.name} for $${price.toLocaleString()}`);
      setTimeout(() => setPodiumMsg(''), 6000);
    });
    return () => {
      socket.off('timer:tick');
      socket.off('podium:message');
      socket.off('podium:sold_celebration');
    };
  }, [socket]);

  // Timer countdown color
  const timerColor = timerSeconds > 15 ? 'text-emerald-400' : timerSeconds > 7 ? 'text-amber-400' : 'text-red-400';

  // Format timer as MM:SS
  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Sold players for ledger
  const recentSales = auctionLedger.filter(l => l.type === 'SOLD').slice(0, 8);

  if (!isAuction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="font-teko text-5xl text-white mb-2">PODIUM AUCTIONEER</h2>
        <p className="text-slate-400">This dashboard is only accessible during <strong className="text-blue-400">Phase 3: AUCTION</strong>. Ask the Super Admin to activate the Auction phase.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-xs rounded-full uppercase mb-2 inline-flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Podium Admin — Live Auction Control
          </span>
          <h1 className="font-teko text-4xl sm:text-5xl font-bold text-white uppercase">AUCTIONEER CONTROL PANEL</h1>
          <p className="text-slate-400 text-sm">Manage the live podium, timer, bids, and player auction flow.</p>
        </div>
        {/* Bidding Mode Toggle */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Bidding Mode</span>
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => socket.emit('podium:toggle_mode', { mode: 'NORMAL' })}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${biddingMode === 'NORMAL' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              NORMAL
            </button>
            <button
              onClick={() => socket.emit('podium:toggle_mode', { mode: 'BLIND' })}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${biddingMode === 'BLIND' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              BLIND BID
            </button>
          </div>
        </div>
      </div>

      {/* Podium Message Flash */}
      {podiumMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl p-4 text-center font-bold text-lg animate-pulse">
          {podiumMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Current Player On Podium + Timer */}
        <div className="lg:col-span-5 space-y-6">
          {/* Player FUT Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Currently On Podium</span>
            {currentPlayer ? (
              <>
                <FutPlayerCard player={currentPlayer} size="large" />
                <div className="mt-4 text-center space-y-1">
                  <p className="text-xs text-slate-400">Base Price: <span className="font-mono text-amber-400 font-bold">${currentPlayer.basePrice?.toLocaleString()}</span></p>
                  <p className="text-sm font-bold text-white">Current Bid: <span className="font-mono text-emerald-400">${currentBid.toLocaleString()}</span></p>
                  <p className="text-xs text-slate-400">Highest Bidder: <span className="text-blue-400 font-semibold">{highestBidderName}</span></p>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎤</div>
                <p className="text-slate-400 text-sm">No player selected. Pick a player from the draft pool.</p>
              </div>
            )}
          </div>

          {/* Timer Control */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-4">Podium Timer</span>

            <div className={`font-teko text-8xl font-black text-center mb-4 tabular-nums ${timerColor}`}>
              {formatTimer(timerSeconds)}
            </div>

            {/* Timer Progress Bar */}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-5">
              <div
                className={`h-full rounded-full transition-all ${timerSeconds > 15 ? 'bg-emerald-500' : timerSeconds > 7 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`}
                style={{ width: `${Math.max(0, (timerSeconds / timerPreset) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => { setTimerPreset(15); socket.emit('timer:start', { seconds: 15 }); }}
                className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> START 15s
              </button>
              <button
                onClick={() => { setTimerPreset(30); socket.emit('timer:start', { seconds: 30 }); }}
                className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> START 30s
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => socket.emit('timer:pause')}
                disabled={timerStatus !== 'RUNNING'}
                className="py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <Pause className="w-3.5 h-3.5" /> PAUSE
              </button>
              <button
                onClick={() => socket.emit('timer:resume')}
                disabled={timerStatus !== 'PAUSED'}
                className="py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <Play className="w-3.5 h-3.5" /> RESUME
              </button>
              <button
                onClick={() => socket.emit('timer:reset', { seconds: timerPreset })}
                className="py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> RESET
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Override Controls + Player Picker + Ledger */}
        <div className="lg:col-span-7 space-y-6">

          {/* Override Controls */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-4">Podium Override Controls</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => socket.emit('podium:rollback_bid')}
                className="py-3 bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 text-amber-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> ROLLBACK BID
              </button>
              <button
                onClick={() => socket.emit('podium:mark_unsold')}
                disabled={!currentPlayer}
                className="py-3 bg-slate-700/40 hover:bg-slate-700 border border-slate-600/30 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <SkipForward className="w-4 h-4" /> MARK UNSOLD
              </button>
              <button
                onClick={() => socket.emit('podium:confirm_sale')}
                disabled={!currentPlayer || !systemState?.highestBidderTeamId}
                className="py-3 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Check className="w-4 h-4" /> CONFIRM SALE
              </button>
            </div>
          </div>

          {/* Player Picker — Select next player for podium */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Draft Pool — Put Player On Podium</span>
              <button
                onClick={() => setShowPlayerPicker(!showPlayerPicker)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1"
              >
                <List className="w-3.5 h-3.5" /> {showPlayerPicker ? 'Hide' : 'Show'} Pool
              </button>
            </div>

            {showPlayerPicker && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {availablePlayers.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">All players have been auctioned!</p>
                ) : (
                  availablePlayers.map(p => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:border-blue-500/50 ${
                        systemState?.currentAuctionPlayerId === p.id
                          ? 'bg-blue-950/50 border-blue-500/70'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                      onClick={() => socket.emit('podium:set_player', { playerId: p.id })}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center font-teko font-bold text-white text-sm">
                          {p.primaryPosition}
                        </span>
                        <div>
                          <p className="font-bold text-white text-sm">{p.name}</p>
                          <p className="text-[11px] text-slate-400">{p.tier} · OVR {p.ovr} · Base ${p.basePrice?.toLocaleString()}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Recent Sales Ledger */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-4">Auction Ledger — Recent Sales</span>
            {recentSales.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No completed sales yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {recentSales.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-bold text-white text-sm">{entry.playerName}</p>
                      <p className="text-[11px] text-slate-400">→ {entry.teamName}</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">${entry.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
