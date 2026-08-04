const { loadDB, saveDB } = require('./db');

let timerInterval = null;

/**
 * Calculates the next minimum raise amount based on current bid and team total budget allowance.
 * Problem statement requirement: Bidding Math percentage-based raise tiers.
 */
function calculateMinRaise(currentBid, totalBudget, raiseTiers) {
  const pct = (currentBid / totalBudget) * 100;
  let raisePct = 0.5; // default fallback 0.5%
  
  for (const tier of raiseTiers) {
    if (pct >= tier.minPct && pct < tier.maxPct) {
      raisePct = tier.raisePct;
      break;
    }
  }
  
  // Calculate monetary amount
  const monetaryRaise = Math.round(totalBudget * (raisePct / 100));
  return Math.max(monetaryRaise, 100000); // Minimum raise $100,000
}

function initAuctionSocket(io) {
  io.on('connection', (socket) => {
    console.log('[SOCKET] Client connected:', socket.id);

    // Send current state on connection
    const db = loadDB();
    socket.emit('state:sync', db.systemState);
    socket.emit('players:sync', db.players);
    socket.emit('teams:sync', db.teams);
    socket.emit('ledger:sync', db.auctionLedger);

    // --- PODIUM TIMER CONTROLS (Podium Admin Only) ---
    socket.on('timer:start', ({ seconds = 30 }) => {
      const db = loadDB();
      if (db.systemState.phase !== 'AUCTION') return;

      clearInterval(timerInterval);
      db.systemState.podiumTimer = seconds;
      db.systemState.podiumTimerStatus = 'RUNNING';
      saveDB();
      io.emit('state:sync', db.systemState);

      timerInterval = setInterval(() => {
        const currentDb = loadDB();
        if (currentDb.systemState.podiumTimerStatus !== 'RUNNING') return;

        if (currentDb.systemState.podiumTimer > 0) {
          currentDb.systemState.podiumTimer -= 1;
          saveDB();
          io.emit('timer:tick', { seconds: currentDb.systemState.podiumTimer });
        } else {
          clearInterval(timerInterval);
          currentDb.systemState.podiumTimerStatus = 'STOPPED';
          saveDB();
          io.emit('timer:expired', { playerId: currentDb.systemState.currentAuctionPlayerId });
          io.emit('state:sync', currentDb.systemState);
        }
      }, 1000);
    });

    socket.on('timer:pause', () => {
      const db = loadDB();
      db.systemState.podiumTimerStatus = 'PAUSED';
      saveDB();
      io.emit('state:sync', db.systemState);
    });

    socket.on('timer:resume', () => {
      const db = loadDB();
      db.systemState.podiumTimerStatus = 'RUNNING';
      saveDB();
      io.emit('state:sync', db.systemState);
    });

    socket.on('timer:reset', ({ seconds = 30 }) => {
      clearInterval(timerInterval);
      const db = loadDB();
      db.systemState.podiumTimer = seconds;
      db.systemState.podiumTimerStatus = 'STOPPED';
      saveDB();
      io.emit('state:sync', db.systemState);
    });

    // --- AUCTION PODIUM CONTROL (Podium Admin) ---
    socket.on('podium:set_player', ({ playerId }) => {
      const db = loadDB();
      if (db.systemState.phase !== 'AUCTION') return;

      const player = db.players.find(p => p.id === playerId);
      if (!player) return;

      // Update player status
      db.players.forEach(p => {
        if (p.status === 'ON_PODIUM') p.status = 'AVAILABLE';
      });
      player.status = 'ON_PODIUM';

      db.systemState.currentAuctionPlayerId = playerId;
      db.systemState.currentBid = player.basePrice;
      db.systemState.highestBidderTeamId = null;
      db.systemState.highestBidderTeamName = null;
      db.systemState.podiumTimer = 30;
      db.systemState.podiumTimerStatus = 'STOPPED';
      
      saveDB();
      io.emit('players:sync', db.players);
      io.emit('state:sync', db.systemState);
      io.emit('auction:player_changed', { player });
    });

    // --- MODE TOGGLE (Normal vs Blind Bidding) ---
    socket.on('podium:toggle_mode', ({ mode }) => {
      const db = loadDB();
      db.systemState.biddingMode = mode; // NORMAL or BLIND
      saveDB();
      io.emit('state:sync', db.systemState);
    });

    // --- LIVE BID SUBMISSION (Team Manager) ---
    socket.on('bid:submit', ({ teamId, amount }) => {
      const db = loadDB();
      if (db.systemState.phase !== 'AUCTION') {
        socket.emit('bid:error', { message: 'Auction is not active!' });
        return;
      }

      const team = db.teams.find(t => t.id === teamId);
      const player = db.players.find(p => p.id === db.systemState.currentAuctionPlayerId);

      if (!team || !player) {
        socket.emit('bid:error', { message: 'Invalid team or player on podium!' });
        return;
      }

      const remainingPurse = team.budget - team.budgetSpent;
      if (amount > remainingPurse) {
        socket.emit('bid:error', { message: `Insufficient budget! Remaining purse: $${remainingPurse.toLocaleString()}` });
        return;
      }

      const currentBid = db.systemState.currentBid || player.basePrice;
      if (amount <= currentBid && db.systemState.highestBidderTeamId) {
        socket.emit('bid:error', { message: `Bid must be higher than current bid ($${currentBid.toLocaleString()})` });
        return;
      }

      // Record bid
      db.systemState.currentBid = amount;
      db.systemState.highestBidderTeamId = team.id;
      db.systemState.highestBidderTeamName = team.name;

      const ledgerEntry = {
        id: 'bid-' + Date.now(),
        timestamp: new Date().toISOString(),
        playerId: player.id,
        playerName: player.name,
        teamId: team.id,
        teamName: team.name,
        amount: amount,
        type: db.systemState.biddingMode === 'BLIND' ? 'BLIND_BID' : 'RAISE'
      };

      db.auctionLedger.unshift(ledgerEntry);
      saveDB();

      io.emit('state:sync', db.systemState);
      io.emit('ledger:sync', db.auctionLedger);
      io.emit('bid:new', ledgerEntry);
    });

    // --- PODIUM ADMIN OVERRIDES (Rollback, Unsold, Confirm Sale) ---
    socket.on('podium:rollback_bid', () => {
      const db = loadDB();
      if (db.auctionLedger.length === 0) return;

      const lastBid = db.auctionLedger.shift();
      const previousBid = db.auctionLedger.find(b => b.playerId === db.systemState.currentAuctionPlayerId);

      if (previousBid) {
        db.systemState.currentBid = previousBid.amount;
        db.systemState.highestBidderTeamId = previousBid.teamId;
        db.systemState.highestBidderTeamName = previousBid.teamName;
      } else {
        const player = db.players.find(p => p.id === db.systemState.currentAuctionPlayerId);
        db.systemState.currentBid = player ? player.basePrice : 0;
        db.systemState.highestBidderTeamId = null;
        db.systemState.highestBidderTeamName = null;
      }

      saveDB();
      io.emit('state:sync', db.systemState);
      io.emit('ledger:sync', db.auctionLedger);
      io.emit('podium:message', { text: `Last bid of $${lastBid.amount.toLocaleString()} rolled back!` });
    });

    socket.on('podium:mark_unsold', () => {
      const db = loadDB();
      const player = db.players.find(p => p.id === db.systemState.currentAuctionPlayerId);
      if (!player) return;

      player.status = 'UNSOLD';
      db.systemState.currentAuctionPlayerId = null;
      db.systemState.currentBid = 0;
      db.systemState.highestBidderTeamId = null;
      db.systemState.highestBidderTeamName = null;
      db.systemState.podiumTimerStatus = 'STOPPED';

      saveDB();
      io.emit('players:sync', db.players);
      io.emit('state:sync', db.systemState);
      io.emit('podium:message', { text: `${player.name} marked as UNSOLD.` });
    });

    socket.on('podium:confirm_sale', () => {
      const db = loadDB();
      const player = db.players.find(p => p.id === db.systemState.currentAuctionPlayerId);
      const team = db.teams.find(t => t.id === db.systemState.highestBidderTeamId);

      if (!player || !team) {
        socket.emit('podium:error', { message: 'Cannot sell: No valid winning team or player!' });
        return;
      }

      const finalPrice = db.systemState.currentBid;
      player.status = 'SOLD';
      player.soldToTeamId = team.id;
      player.soldPrice = finalPrice;

      team.budgetSpent += finalPrice;
      team.roster.push(player);

      db.auctionLedger.unshift({
        id: 'sale-' + Date.now(),
        timestamp: new Date().toISOString(),
        playerId: player.id,
        playerName: player.name,
        teamId: team.id,
        teamName: team.name,
        amount: finalPrice,
        type: 'SOLD'
      });

      db.systemState.currentAuctionPlayerId = null;
      db.systemState.currentBid = 0;
      db.systemState.highestBidderTeamId = null;
      db.systemState.highestBidderTeamName = null;
      db.systemState.podiumTimerStatus = 'STOPPED';

      saveDB();
      io.emit('players:sync', db.players);
      io.emit('teams:sync', db.teams);
      io.emit('state:sync', db.systemState);
      io.emit('ledger:sync', db.auctionLedger);
      io.emit('podium:sold_celebration', { player, team, price: finalPrice });
    });

    socket.on('disconnect', () => {
      console.log('[SOCKET] Client disconnected:', socket.id);
    });
  });
}

module.exports = {
  initAuctionSocket,
  calculateMinRaise
};
