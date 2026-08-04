const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // Bypasses local DNS blocking


require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DB_FILE = path.join(__dirname, 'data.json');
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gstu_auction';

let isMongoConnected = false;

// --- MONGOOSE SCHEMAS & MODELS ---
const systemStateSchema = new mongoose.Schema({
  phase: { type: String, default: 'SETUP' },
  totalBudget: { type: Number, default: 100000000 },
  academicSessions: [String],
  tiers: [mongoose.Schema.Types.Mixed],
  raiseTiers: [mongoose.Schema.Types.Mixed],
  registrationOpen: { type: Boolean, default: false },
  auctionActive: { type: Boolean, default: false },
  currentAuctionPlayerId: { type: String, default: null },
  biddingMode: { type: String, default: 'NORMAL' },
  podiumTimer: { type: Number, default: 30 },
  podiumTimerStatus: { type: String, default: 'STOPPED' },
  currentBid: { type: Number, default: 0 },
  highestBidderTeamId: { type: String, default: null },
  highestBidderTeamName: { type: String, default: null }
}, { timestamps: true });

const teamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  code: String,
  managerName: String,
  managerEmail: String,
  logo: String,
  budget: Number,
  budgetSpent: Number,
  roster: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

const playerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  studentId: String,
  session: String,
  jerseyName: String,
  primaryPosition: String,
  secondaryPositions: [String],
  ovr: Number,
  tier: String,
  basePrice: Number,
  stats: mongoose.Schema.Types.Mixed,
  imageUrl: String,
  status: String,
  soldToTeamId: String,
  soldPrice: Number
}, { timestamps: true });

const auctionLedgerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: String,
  playerId: String,
  playerName: String,
  teamId: String,
  teamName: String,
  amount: Number,
  type: String
}, { timestamps: true });

const matchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  homeTeam: String,
  awayTeam: String,
  homeScore: Number,
  awayScore: Number,
  status: String,
  date: String
}, { timestamps: true });

const SystemStateModel = mongoose.model('SystemState', systemStateSchema);
const TeamModel = mongoose.model('Team', teamSchema);
const PlayerModel = mongoose.model('Player', playerSchema);
const LedgerModel = mongoose.model('AuctionLedger', auctionLedgerSchema);
const MatchModel = mongoose.model('Match', matchSchema);

// Try connecting to MongoDB asynchronously
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 3000
}).then(() => {
  isMongoConnected = true;
  console.log('[MONGODB] Connected to MongoDB database successfully at:', process.env.MONGO_URI);
  syncFromMongo();
}).catch((err) => {
  isMongoConnected = false;
  console.log('[MONGODB] Connection error:', err.message);
});

// Default initial state
const initialData = {
  systemState: {
    phase: 'SETUP',
    totalBudget: 100000000,
    academicSessions: ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025'],
    tiers: [
      { name: 'Platinum', basePrice: 15000000, color: 'platinum' },
      { name: 'Gold', basePrice: 10000000, color: 'gold' },
      { name: 'Silver', basePrice: 5000000, color: 'silver' },
      { name: 'Bronze', basePrice: 2000000, color: 'bronze' }
    ],
    raiseTiers: [
      { minPct: 0, maxPct: 3, raisePct: 0.15 },
      { minPct: 3, maxPct: 10, raisePct: 0.50 },
      { minPct: 10, maxPct: 25, raisePct: 1.00 },
      { minPct: 25, maxPct: 100, raisePct: 2.50 }
    ],
    registrationOpen: false,
    auctionActive: false,
    currentAuctionPlayerId: null,
    biddingMode: 'NORMAL',
    podiumTimer: 30,
    podiumTimerStatus: 'STOPPED',
    currentBid: 0,
    highestBidderTeamId: null,
    highestBidderTeamName: null
  },
  teams: [
    {
      id: 'team-1',
      name: 'Red Dragons FC',
      code: 'RED123',
      managerName: 'Alex Ferguson',
      managerEmail: 'red@franchise.com',
      logo: '🐉',
      budget: 100000000,
      budgetSpent: 0,
      roster: []
    },
    {
      id: 'team-2',
      name: 'Blue Lightning FC',
      code: 'BLUE456',
      managerName: 'Pep Guardiola',
      managerEmail: 'blue@franchise.com',
      logo: '⚡',
      budget: 100000000,
      budgetSpent: 0,
      roster: []
    },
    {
      id: 'team-3',
      name: 'Golden Eagles FC',
      code: 'GOLD789',
      managerName: 'Carlo Ancelotti',
      managerEmail: 'gold@franchise.com',
      logo: '🦅',
      budget: 100000000,
      budgetSpent: 0,
      roster: []
    }
  ],
  players: [
    {
      id: 'p-1',
      name: 'Kylian Mbappe',
      studentId: 'CSE-2022-001',
      session: '2022-2023',
      jerseyName: 'KM9',
      primaryPosition: 'ST',
      secondaryPositions: ['LW', 'RW'],
      ovr: 91,
      tier: 'Platinum',
 basePrice: 15000000,
      stats: { pac: 97, pas: 80, sho: 90, def: 36, dri: 92, phy: 78 },
      imageUrl: '',
      status: 'AVAILABLE',
      soldToTeamId: null,
      soldPrice: 0
    },
    {
      id: 'p-2',
      name: 'Thibaut Courtois',
      studentId: 'CSE-2021-042',
      session: '2021-2022',
      jerseyName: 'TC1',
      primaryPosition: 'GK',
      secondaryPositions: [],
      ovr: 89,
      tier: 'Gold',
      basePrice: 10000000,
      stats: { div: 89, ref: 90, han: 89, spd: 46, kic: 76, pos: 88 },
      imageUrl: '',
      status: 'AVAILABLE',
      soldToTeamId: null,
      soldPrice: 0
    },
    {
      id: 'p-3',
      name: 'Jude Bellingham',
      studentId: 'CSE-2023-088',
      session: '2023-2024',
      jerseyName: 'JB5',
      primaryPosition: 'CM',
      secondaryPositions: ['CAM', 'CDM'],
      ovr: 88,
      tier: 'Gold',
      basePrice: 10000000,
      stats: { pac: 80, pas: 83, sho: 82, def: 78, dri: 87, phy: 84 },
      imageUrl: '',
      status: 'AVAILABLE',
      soldToTeamId: null,
      soldPrice: 0
    },
    {
      id: 'p-4',
      name: 'Virgil Van Dijk',
      studentId: 'CSE-2020-015',
      session: '2020-2021',
      jerseyName: 'VVD4',
      primaryPosition: 'CB',
      secondaryPositions: [],
      ovr: 89,
      tier: 'Platinum',
      basePrice: 15000000,
      stats: { pac: 78, pas: 71, sho: 60, def: 89, dri: 72, phy: 86 },
      imageUrl: '',
      status: 'AVAILABLE',
      soldToTeamId: null,
      soldPrice: 0
    }
  ],
  auctionLedger: [],
  matches: [
    { id: 'm-1', homeTeam: 'Red Dragons FC', awayTeam: 'Blue Lightning FC', homeScore: 2, awayScore: 1, status: 'FINISHED', date: 'Matchday 1' },
    { id: 'm-2', homeTeam: 'Golden Eagles FC', awayTeam: 'Red Dragons FC', homeScore: 0, awayScore: 0, status: 'FINISHED', date: 'Matchday 2' },
    { id: 'm-3', homeTeam: 'Blue Lightning FC', awayTeam: 'Golden Eagles FC', homeScore: 3, awayScore: 2, status: 'FINISHED', date: 'Matchday 3' }
  ]
};

let dbData = null;

async function syncFromMongo() {
  if (!isMongoConnected) return;
  try {
    const sysDoc = await SystemStateModel.findOne();
    const mongoTeams = await TeamModel.find();
    const mongoPlayers = await PlayerModel.find();
    const mongoLedger = await LedgerModel.find().sort({ createdAt: -1 });
    const mongoMatches = await MatchModel.find();

    if (sysDoc) dbData.systemState = sysDoc.toObject();
    if (mongoTeams.length > 0) dbData.teams = mongoTeams.map(t => t.toObject());
    if (mongoPlayers.length > 0) dbData.players = mongoPlayers.map(p => p.toObject());
    if (mongoLedger.length > 0) dbData.auctionLedger = mongoLedger.map(l => l.toObject());
    if (mongoMatches.length > 0) dbData.matches = mongoMatches.map(m => m.toObject());

    saveDB();
    console.log('[MONGODB] Initial database sync complete from MongoDB.');
  } catch (e) {
    console.warn('[MONGODB] Sync warning:', e.message);
  }
}

function loadDB() {
  if (!dbData) {
    if (fs.existsSync(DB_FILE)) {
      try {
        dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      } catch (e) {
        dbData = JSON.parse(JSON.stringify(initialData));
      }
    } else {
      dbData = JSON.parse(JSON.stringify(initialData));
      saveDB();
    }
  }
  return dbData;
}

function saveDB() {
  if (dbData) {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');

    // Async sync to MongoDB if connected
    if (isMongoConnected) {
      (async () => {
        try {
          await SystemStateModel.deleteMany({});
          await SystemStateModel.create(dbData.systemState);

          await TeamModel.deleteMany({});
          if (dbData.teams.length > 0) await TeamModel.insertMany(dbData.teams);

          await PlayerModel.deleteMany({});
          if (dbData.players.length > 0) await PlayerModel.insertMany(dbData.players);

          await LedgerModel.deleteMany({});
          if (dbData.auctionLedger.length > 0) await LedgerModel.insertMany(dbData.auctionLedger);

          await MatchModel.deleteMany({});
          if (dbData.matches.length > 0) await MatchModel.insertMany(dbData.matches);
        } catch (err) {
          console.warn('[MONGODB] Async save error:', err.message);
        }
      })();
    }
  }
}

/**
 * Super Admin Lifecycle Reset (Nuke Protocol)
 * Clears database back to initial pre-event state.
 */
function resetDB() {
  dbData = JSON.parse(JSON.stringify(initialData));
  saveDB();
  return dbData;
}

module.exports = {
  loadDB,
  saveDB,
  resetDB,
  SystemStateModel,
  TeamModel,
  PlayerModel,
  LedgerModel,
  MatchModel
};
