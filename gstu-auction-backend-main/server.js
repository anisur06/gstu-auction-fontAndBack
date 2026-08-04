const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { loadDB, saveDB, resetDB } = require('./db');
const { wipeCloudinaryStorage } = require('./cloudinaryService');
const { initAuctionSocket, calculateMinRaise } = require('./auctionSocket');
const { authRouter, authMiddleware, requireRole, seedDefaultAdmin, UserModel } = require('./auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend from dist directory if built
const distPath = fs.existsSync(path.join(__dirname, '../gstu-auction-frontend/dist'))
  ? path.join(__dirname, '../gstu-auction-frontend/dist')
  : path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// --- MOUNT AUTH ROUTES ---
app.use('/api/v1/auth', authRouter);

// --- GLOBAL AUTH MIDDLEWARE (populates req.user on all subsequent routes) ---
app.use(authMiddleware);

// Middleware: Global State Machine Phase Locking
app.use((req, res, next) => {
  const db = loadDB();
  const phase = db.systemState.phase;

  // Phase 3 & Phase 4 Lock: Player Registration is locked
  if ((phase === 'AUCTION' || phase === 'TOURNAMENT') && req.path.startsWith('/api/v1/players/register')) {
    return res.status(403).json({ error: 'Player registration is frozen during Auction & Tournament phases.' });
  }

  // Phase 4 Lock: Auction routes strictly locked
  if (phase === 'TOURNAMENT' && req.path.startsWith('/api/v1/auction')) {
    return res.status(403).json({ error: 'Auction routes are strictly locked during Tournament phase.' });
  }

  next();
});

// --- API ENDPOINTS ---

// 1. System Settings & State Machine Phase Control
app.get('/api/v1/system/state', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.systemState });
});

app.post('/api/v1/system/phase', requireRole('super_admin', 'auctioneer'), (req, res) => {
  const { phase } = req.body; // SETUP, REGISTRATION, AUCTION, TOURNAMENT
  const db = loadDB();

  if (!['SETUP', 'REGISTRATION', 'AUCTION', 'TOURNAMENT'].includes(phase)) {
    return res.status(400).json({ error: 'Invalid phase string.' });
  }

  db.systemState.phase = phase;
  if (phase === 'REGISTRATION') db.systemState.registrationOpen = true;
  if (phase === 'AUCTION') db.systemState.auctionActive = true;

  saveDB();
  io.emit('state:sync', db.systemState);
  res.json({ success: true, phase: db.systemState.phase });
});

// 2. Dynamic Rules Config (Super Admin)
app.post('/api/v1/system/rules', requireRole('super_admin', 'auctioneer'), (req, res) => {
  const { totalBudget, tiers, raiseTiers } = req.body;
  const db = loadDB();

  if (totalBudget) db.systemState.totalBudget = totalBudget;
  if (tiers) db.systemState.tiers = tiers;
  if (raiseTiers) db.systemState.raiseTiers = raiseTiers;

  saveDB();
  io.emit('state:sync', db.systemState);
  res.json({ success: true, data: db.systemState });
});

// 3. Dynamic Bidding Math Calculator Endpoint
app.get('/api/v1/auction/min-raise', (req, res) => {
  const { currentBid } = req.query;
  const db = loadDB();
  const bidNum = parseInt(currentBid || '0', 10);
  const minRaise = calculateMinRaise(bidNum, db.systemState.totalBudget, db.systemState.raiseTiers);
  res.json({ success: true, currentBid: bidNum, minRaise, nextMinimumBid: bidNum + minRaise });
});

// 4. Player Registration & Management
app.get('/api/v1/players', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.players });
});

app.post('/api/v1/players/register', (req, res) => {
  const {
    name,
    studentId,
    session,
    jerseyName,
    primaryPosition,
    secondaryPositions,
    ovr,
    tier,
    stats,
    imageUrl
  } = req.body;

  const db = loadDB();

  if (!name || !studentId || !jerseyName || !primaryPosition) {
    return res.status(400).json({ error: 'Missing required player information fields.' });
  }

  // Calculate Base Price according to configured tier
  const matchedTier = db.systemState.tiers.find(t => t.name === tier) || db.systemState.tiers[2]; // fallback to silver
  const basePrice = matchedTier.basePrice;

  const newPlayer = {
    id: 'p-' + Date.now(),
    name,
    studentId,
    session: session || '2023-2024',
    jerseyName,
    primaryPosition,
    secondaryPositions: secondaryPositions || [],
    ovr: parseInt(ovr || '75', 10),
    tier: matchedTier.name,
    basePrice,
    stats: stats || { pac: 70, pas: 70, sho: 70, def: 70, dri: 70, phy: 70 },
    imageUrl: imageUrl || '', // Cloudinary photo URL or empty string for vector man silhouette
    status: 'AVAILABLE',
    soldToTeamId: null,
    soldPrice: 0
  };

  db.players.push(newPlayer);
  saveDB();
  io.emit('players:sync', db.players);

  res.json({ success: true, player: newPlayer });
});

// Super Admin: mark/unmark icon players by featured player id
app.put('/api/v1/players/:playerId/icon-status', requireRole('super_admin'), (req, res) => {
  const { playerId } = req.params;
  const { is_icon_player } = req.body;
  const db = loadDB();
  const player = db.players.find(p => p.id === playerId);

  if (!player) {
    return res.status(404).json({ error: 'Player not found.' });
  }

  player.is_icon_player = Boolean(is_icon_player);
  saveDB();
  io.emit('players:sync', db.players);
  res.json({ success: true, player });
});

// Manager: promote an Icon Player to team captain
app.post('/api/v1/players/:playerId/promote-captain', requireRole('manager'), async (req, res) => {
  const { playerId } = req.params;
  const db = loadDB();
  const player = db.players.find(p => p.id === playerId);

  if (!player) {
    return res.status(404).json({ error: 'Player not found.' });
  }

  if (!player.is_icon_player) {
    return res.status(400).json({ error: 'This player is not marked as an Icon Player.' });
  }

  const team = db.teams.find(team => {
    return team.managerEmail?.toLowerCase() === req.user.email?.toLowerCase() ||
      team.managerName?.toLowerCase() === req.user.fullName?.toLowerCase();
  });

  if (!team) {
    return res.status(403).json({ error: 'Manager is not assigned to any team.' });
  }

  const existingCaptain = await UserModel.findOne({ role: 'team_captain', captainTeamId: team.id });
  if (existingCaptain) {
    return res.status(400).json({ error: 'A captain is already assigned to this team.' });
  }

  const playerUserQuery = {
    $or: [{ studentId: player.studentId }, { jerseyName: player.jerseyName }]
  };
  const playerUser = await UserModel.findOne(playerUserQuery);

  if (!playerUser) {
    return res.status(404).json({ error: 'Player account not found for this player.' });
  }

  playerUser.role = 'team_captain';
  playerUser.captainTeamId = team.id;
  await playerUser.save();

  player.captainTeamId = team.id;
  saveDB();
  io.emit('players:sync', db.players);

  res.json({ success: true, player: {
    ...player,
    userRole: playerUser.role,
    captainTeamId: player.captainTeamId
  } });
});

// Player Edit (Manager, Team Captain, Super Admin)
app.put('/api/v1/players/:playerId', requireRole('manager', 'team_captain', 'super_admin', 'auctioneer'), (req, res) => {
  const { playerId } = req.params;
  const db = loadDB();
  const player = db.players.find(p => p.id === playerId);

  if (!player) {
    return res.status(404).json({ error: 'Player not found.' });
  }

  const updatable = ['name', 'jerseyName', 'primaryPosition', 'secondaryPositions', 'ovr', 'tier', 'stats', 'imageUrl', 'session', 'studentId'];
  for (const key of updatable) {
    if (req.body[key] !== undefined) {
      player[key] = req.body[key];
    }
  }

  // Recalculate base price if tier changed
  if (req.body.tier) {
    const matchedTier = db.systemState.tiers.find(t => t.name === req.body.tier);
    if (matchedTier) player.basePrice = matchedTier.basePrice;
  }

  saveDB();
  io.emit('players:sync', db.players);
  res.json({ success: true, player });
});

// Player Delete (Manager, Team Captain, Super Admin)
app.delete('/api/v1/players/:playerId', requireRole('manager', 'team_captain', 'super_admin', 'auctioneer'), (req, res) => {
  const { playerId } = req.params;
  const db = loadDB();
  const index = db.players.findIndex(p => p.id === playerId);

  if (index === -1) {
    return res.status(404).json({ error: 'Player not found.' });
  }

  const removed = db.players.splice(index, 1)[0];
  saveDB();
  io.emit('players:sync', db.players);
  res.json({ success: true, message: `Player "${removed.name}" deleted.` });
});

// 5. Teams & Franchise Management
app.get('/api/v1/teams', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.teams });
});

app.post('/api/v1/teams', requireRole('manager', 'super_admin', 'auctioneer'), (req, res) => {
  const { name, managerName, managerEmail, logo } = req.body;
  const db = loadDB();

  const newTeam = {
    id: 'team-' + Date.now(),
    name,
    code: 'TEAM' + Math.floor(100 + Math.random() * 900),
    managerName,
    managerEmail,
    logo: logo || '⚽',
    budget: db.systemState.totalBudget,
    budgetSpent: 0,
    roster: []
  };

  db.teams.push(newTeam);
  saveDB();
  io.emit('teams:sync', db.teams);
  res.json({ success: true, team: newTeam });
});

// Team Edit (Manager, Super Admin)
app.put('/api/v1/teams/:teamId', requireRole('manager', 'super_admin', 'auctioneer'), (req, res) => {
  const { teamId } = req.params;
  const db = loadDB();
  const team = db.teams.find(t => t.id === teamId);

  if (!team) {
    return res.status(404).json({ error: 'Team not found.' });
  }

  const updatable = ['name', 'managerName', 'managerEmail', 'logo'];
  for (const key of updatable) {
    if (req.body[key] !== undefined) {
      team[key] = req.body[key];
    }
  }

  saveDB();
  io.emit('teams:sync', db.teams);
  res.json({ success: true, team });
});

// Team Delete (Manager, Super Admin)
app.delete('/api/v1/teams/:teamId', requireRole('manager', 'super_admin', 'auctioneer'), (req, res) => {
  const { teamId } = req.params;
  const db = loadDB();
  const index = db.teams.findIndex(t => t.id === teamId);

  if (index === -1) {
    return res.status(404).json({ error: 'Team not found.' });
  }

  const removed = db.teams.splice(index, 1)[0];
  saveDB();
  io.emit('teams:sync', db.teams);
  res.json({ success: true, message: `Team "${removed.name}" deleted.` });
});

// 6. Tournament Matches & Points Table
app.get('/api/v1/tournament/matches', (req, res) => {
  const db = loadDB();
  res.json({ success: true, matches: db.matches });
});

app.post('/api/v1/tournament/matches/score', requireRole('super_admin', 'auctioneer'), (req, res) => {
  const { matchId, homeScore, awayScore } = req.body;
  const db = loadDB();

  const match = db.matches.find(m => m.id === matchId);
  if (match) {
    match.homeScore = parseInt(homeScore, 10);
    match.awayScore = parseInt(awayScore, 10);
    match.status = 'FINISHED';
    saveDB();
    io.emit('matches:sync', db.matches);
  }

  res.json({ success: true, match });
});

// 7. LIFECYCLE RESET (NUKE PROTOCOL)
app.post('/api/v1/admin/nuke', requireRole('super_admin', 'auctioneer'), async (req, res) => {
  console.log('[NUKE PROTOCOL] Super Admin requested complete system reset...');
  
  // 1. Wipe remote Cloudinary media storage
  const cloudinaryResult = await wipeCloudinaryStorage();

  // 2. Wipe local database back to Phase 1 (SETUP)
  const resetData = resetDB();

  // 3. Emit real-time reset event to all connected clients
  io.emit('state:sync', resetData.systemState);
  io.emit('players:sync', resetData.players);
  io.emit('teams:sync', resetData.teams);
  io.emit('ledger:sync', resetData.auctionLedger);
  io.emit('nuke:executed', { text: 'Lifecycle Reset executed! Database and Cloud storage cleared.' });

  res.json({
    success: true,
    message: 'Lifecycle Reset (Nuke) successfully executed! Remote media deleted and database reset to Phase 1.',
    cloudinaryReport: cloudinaryResult
  });
});

// Initialize Socket.IO engine
initAuctionSocket(io);

// Seed default Super Admin account after MongoDB connects
const mongoose = require('mongoose');
mongoose.connection.once('open', () => {
  seedDefaultAdmin();
});
// Also try seeding after a delay in case connection was already open
setTimeout(() => {
  if (mongoose.connection.readyState === 1) {
    seedDefaultAdmin();
  }
}, 5000);

const PORT = process.env.PORT || 5000;
// Handle listen errors (EADDRINUSE) with a friendly message
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error('\nERROR: Port ' + PORT + ' is already in use.\n' +
      ' - Stop the process using port ' + PORT + ', or set a different PORT environment variable.\n' +
      'Windows: run `netstat -ano | findstr :' + PORT + '` then `taskkill /PID <pid> /F`\n' +
      'Or start server with: set PORT=5001 && npm start (CMD) or $env:PORT=5001; npm start (PowerShell)\n');
    process.exit(1);
  }
  // rethrow other errors
  throw err;
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`   GSTU FOOTBALL LEAGUE BACKEND RUNNING ON ${PORT}  `);
  console.log(`=================================================`);
});
