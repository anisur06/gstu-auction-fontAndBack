import React, { useState, useEffect } from 'react';
import FutPlayerCard from '../components/FutPlayerCard';
import { TrendingUp, Shield, AlertTriangle, Eye, EyeOff, DollarSign } from 'lucide-react';

export default function TeamManagerBidding({ socket, systemState, players = [], teams = [], auctionLedger = [] }) {
  const [myTeamId, setMyTeamId] = useState(teams[0]?.id || '');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [blindBidAmount, setBlindBidAmount] = useState('');
  const [showBlindModal, setShowBlindModal] = useState(false);
  const [minRaise, setMinRaise] = useState(500000);

  const isAuction = systemState?.phase === 'AUCTION';
  const biddingMode = systemState?.biddingMode || 'NORMAL';
  const currentBid = systemState?.currentBid || 0;
  const highestBidderTeamId = systemState?.highestBidderTeamId;
  const highestBidderName = systemState?.highestBidderTeamName || '—';
  const timerStatus = systemState?.podiumTimerStatus || 'STOPPED';

  const myTeam = teams.find(t => t.id === myTeamId);
  const currentPlayer = players.find(p => p.id === systemState?.currentAuctionPlayerId);
  const remainingPurse = myTeam ? myTeam.budget - myTeam.budgetSpent : 0;
  const isHighestBidder = highestBidderTeamId === myTeamId;

  // Fetch dynamic min raise from backend
  useEffect(() => {
    if (!currentBid) return;
    fetch(`/api/v1/auction/min-raise?currentBid=${currentBid}`)
      .then(r => r.json())
      .then(d => { if (d.success) setMinRaise(d.minRaise); })
      .catch(() => {});
  }, [currentBid]);

  useEffect(() => {
    socket.on('timer:tick', ({ seconds }) => setTimerSeconds(seconds));
    socket.on('bid:error', ({ message }) => {
      setBidError(message);
      setTimeout(() => setBidError(''), 5000);
    });
    socket.on('bid:new', (entry) => {
      if (entry.teamId === myTeamId) {
        setBidSuccess(`Bid of $${entry.amount.toLocaleString()} registered!`);
        setTimeout(() => setBidSuccess(''), 3000);
      }
    });
    socket.on('podium:sold_celebration', () => {
      setBidError('');
      setBidSuccess('');
    });
    return () => {
      socket.off('timer:tick');
      socket.off('bid:error');
      socket.off('bid:new');
      socket.off('podium:sold_celebration');
    };
  }, [socket, myTeamId]);

  const placeBid = (amount) => {
    if (!myTeamId) { setBidError('Please select your team!'); return; }
    socket.emit('bid:submit', { teamId: myTeamId, amount });
  };

  const submitBlindBid = () => {
    const amount = parseInt(blindBidAmount.replace(/,/g, ''), 10);
    if (!amount || isNaN(amount)) { setBidError('Enter a valid bid amount.'); return; }
    placeBid(amount);
    setShowBlindModal(false);
    setBlindBidAmount('');
  };

  // Raise amount buttons: base, +1x, +2x, +5x raise
  const raiseOptions = [
    { label: `MIN +$${minRaise.toLocaleString()}`, amount: currentBid + minRaise },
    { label: `+$${(minRaise * 2).toLocaleString()}`, amount: currentBid + minRaise * 2 },
    { label: `+$${(minRaise * 5).toLocaleString()}`, amount: currentBid + minRaise * 5 },
    { label: `+$${(minRaise * 10).toLocaleString()}`, amount: currentBid + minRaise * 10 },
  ];

  // Timer color
  const timerColor = timerSeconds > 15 ? 'text-emerald-400' : timerSeconds > 7 ? 'text-amber-400' : 'text-red-400 animate-pulse';

  const myRosterPlayers = myTeam?.roster || [];

  if (!isAuction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="font-teko text-5xl text-white mb-2">TEAM MANAGER BIDDING</h2>
        <p className="text-slate-400">This dashboard is only accessible during <strong className="text-blue-400">Phase 3: AUCTION</strong>.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Blind Bid Modal */}
      {showBlindModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-8 shadow-2xl w-full max-w-md">
            <div className="flex items-center gap-2 text-purple-400 font-teko text-3xl font-bold mb-2">
              <EyeOff className="w-7 h-7" /> BLIND BID
            </div>
            <p className="text-slate-400 text-sm mb-6">Your sealed bid will be hidden from other teams. The highest blind bid wins.</p>
            <input
              type="number"
              placeholder="Enter your sealed bid amount ($)"
              value={blindBidAmount}
              onChange={e => setBlindBidAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlindModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitBlindBid}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                SUBMIT SEALED BID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Selector + Budget Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-full uppercase mb-2 inline-block">
              Team Manager — Franchise Bidding Console
            </span>
            <h1 className="font-teko text-4xl sm:text-5xl font-bold text-white uppercase">FRANCHISE BIDDING</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">Your Team</label>
              <select
                value={myTeamId}
                onChange={e => setMyTeamId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            {myTeam && (
              <>
                <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Remaining Purse</div>
                  <div className="font-teko text-2xl text-emerald-400 font-extrabold">${remainingPurse.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950/80 border border-red-500/30 rounded-2xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Spent</div>
                  <div className="font-teko text-2xl text-red-400 font-extrabold">${(myTeam.budgetSpent || 0).toLocaleString()}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Budget Progress Bar */}
        {myTeam && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Budget Used: ${(myTeam.budgetSpent || 0).toLocaleString()}</span>
              <span>Total: ${(myTeam.budget || 0).toLocaleString()}</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((myTeam.budgetSpent || 0) / (myTeam.budget || 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Current Podium Player + Timer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Currently On Podium</span>
            {currentPlayer ? (
              <>
                <FutPlayerCard player={currentPlayer} size="large" />
                <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                  <div className="bg-slate-950 rounded-xl p-3 text-center border border-slate-800">
                    <div className="text-xs text-slate-400 uppercase font-bold">Base Price</div>
                    <div className="font-mono font-bold text-amber-400">${currentPlayer.basePrice?.toLocaleString()}</div>
                  </div>
                  <div className={`rounded-xl p-3 text-center border ${isHighestBidder ? 'bg-emerald-950/60 border-emerald-500/40' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="text-xs text-slate-400 uppercase font-bold">Current Bid</div>
                    <div className={`font-mono font-bold ${isHighestBidder ? 'text-emerald-400' : 'text-white'}`}>${currentBid.toLocaleString()}</div>
                    {isHighestBidder && <div className="text-[10px] text-emerald-400 font-bold mt-0.5">🎯 YOU'RE WINNING</div>}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Highest Bidder: <span className="font-bold text-blue-400">{highestBidderName}</span></p>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-slate-400 text-sm">Waiting for Podium Admin to select next player...</p>
              </div>
            )}
          </div>

          {/* Live Timer Display */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md text-center shadow-xl">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-2">Podium Timer</span>
            <div className={`font-teko text-7xl font-black tabular-nums ${timerColor}`}>
              {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all ${timerSeconds > 15 ? 'bg-emerald-500' : timerSeconds > 7 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${(timerSeconds / 30) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Status: <span className={`font-bold ${timerStatus === 'RUNNING' ? 'text-emerald-400' : timerStatus === 'PAUSED' ? 'text-amber-400' : 'text-slate-500'}`}>{timerStatus}</span></p>
          </div>
        </div>

        {/* RIGHT: Bid Actions + Team Roster */}
        <div className="lg:col-span-7 space-y-6">

          {/* Bid Error / Success */}
          {bidError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-4 text-sm font-semibold">
              ⚠️ {bidError}
            </div>
          )}
          {bidSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl p-4 text-sm font-semibold">
              ✅ {bidSuccess}
            </div>
          )}

          {/* Bid Raise Buttons */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Place Your Bid</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${biddingMode === 'BLIND' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                {biddingMode} MODE
              </span>
            </div>

            {biddingMode === 'BLIND' ? (
              /* Blind Bidding Mode */
              <div className="text-center py-4">
                <EyeOff className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <p className="text-slate-300 font-semibold mb-4">Submit a sealed blind bid. Highest wins!</p>
                <button
                  onClick={() => setShowBlindModal(true)}
                  disabled={!currentPlayer}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-teko text-2xl font-bold rounded-2xl shadow-xl shadow-purple-500/30 transition-all disabled:opacity-40"
                >
                  ENTER SEALED BLIND BID
                </button>
              </div>
            ) : (
              /* Normal Bidding Mode — Raise buttons */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {raiseOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => placeBid(opt.amount)}
                      disabled={!currentPlayer || opt.amount > remainingPurse || timerStatus === 'STOPPED'}
                      className="py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-teko text-xl font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all"
                    >
                      <span className="block text-xs font-semibold mb-1 opacity-70">{opt.label}</span>
                      ${opt.amount.toLocaleString()}
                    </button>
                  ))}
                </div>
                {timerStatus === 'STOPPED' && currentPlayer && (
                  <p className="text-xs text-center text-amber-400">⚠️ Bidding opens when Podium Admin starts the timer.</p>
                )}
              </div>
            )}
          </div>

          {/* Team Roster Preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Your Franchise Roster ({myRosterPlayers.length} Players)</span>
            </div>
            {myRosterPlayers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No players signed yet. Start bidding!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {myRosterPlayers.slice(0, 6).map(player => (
                  <FutPlayerCard key={player.id} player={player} size="small" isSold={true} soldPrice={player.soldPrice} soldTeamName={myTeam?.name} />
                ))}
              </div>
            )}
          </div>

          {/* Bid History for this team */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-4">Live Bid Feed</span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {auctionLedger.slice(0, 15).map(entry => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs border ${
                    entry.teamId === myTeamId
                      ? 'bg-blue-950/60 border-blue-500/30 text-blue-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span><strong className={entry.teamId === myTeamId ? 'text-blue-300' : 'text-slate-300'}>{entry.teamName}</strong> bid on {entry.playerName}</span>
                  <span className="font-mono font-bold ml-2">${entry.amount?.toLocaleString()}</span>
                </div>
              ))}
              {auctionLedger.length === 0 && <p className="text-slate-500 text-xs text-center py-4">No bids yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
