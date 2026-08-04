const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { loadDB } = require('./db');

const router = express.Router();

// --- ALL SYSTEM ROLES ---
const ALL_ROLES = ['super_admin', 'auctioneer', 'public_podium', 'manager', 'player', 'team_captain', 'viewer'];
const SELF_REGISTRABLE_ROLES = ['player', 'manager', 'viewer'];
const ADMIN_ONLY_ROLES = ['super_admin', 'auctioneer', 'public_podium'];

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ALL_ROLES, required: true },
  token: { type: String, default: null },
  is_icon_player: { type: Boolean, default: false },
  captainTeamId: { type: String, default: null },

  // Player-specific fields
  studentId: { type: String, default: null },
  fullName: { type: String, default: null },
  phone: { type: String, default: null },
  jerseyName: { type: String, default: null },
  jerseyNo: { type: Number, default: null },
  session: { type: String, default: null },
  preferredPosition: { type: String, default: null },
  secondaryPosition: { type: String, default: null }
}, { timestamps: true });

// Ensure unique studentId for players
userSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { studentId: { $ne: null } } }
);

// Prevent more than one team captain per team
userSchema.index(
  { captainTeamId: 1 },
  { unique: true, partialFilterExpression: { captainTeamId: { $ne: null } } }
);

const UserModel = mongoose.model('User', userSchema);

// --- HELPER: Generate session token ---
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// --- MIDDLEWARE: Extract user from token ---
async function authMiddleware(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const user = await UserModel.findOne({ token });
    req.user = user;
  } catch (e) {
    req.user = null;
  }
  next();
}

// --- MIDDLEWARE: Require specific roles ---
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient role permissions.' });
    }
    next();
  };
}

// --- SEED DEFAULT SUPER ADMIN ---
async function seedDefaultAdmin() {
  try {
    const existing = await UserModel.findOne({ role: 'super_admin' });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await UserModel.create({
        email: 'admin@gstu.edu',
        password: hashedPassword,
        role: 'super_admin',
        fullName: 'Super Admin',
        token: null
      });
      console.log('[AUTH] ✅ Default Super Admin seeded: admin@gstu.edu / admin123');
    } else {
      console.log('[AUTH] Super Admin account already exists.');
    }
    // Ensure there is at least one auctioneer account
    const existingAuctioneer = await UserModel.findOne({ role: 'auctioneer' });
    if (!existingAuctioneer) {
      const salt2 = await bcrypt.genSalt(10);
      const hashedPassword2 = await bcrypt.hash('auctioneer123', salt2);
      await UserModel.create({
        email: 'auctioneer@gstu.edu',
        password: hashedPassword2,
        role: 'auctioneer',
        fullName: 'Default Auctioneer',
        token: null
      });
      console.log('[AUTH] ✅ Default Auctioneer seeded: auctioneer@gstu.edu / auctioneer123');
    } else {
      console.log('[AUTH] Auctioneer account already exists.');
    }

    const managerSeeds = [
      { email: 'red@franchise.com', fullName: 'Alex Ferguson', password: 'manager123' },
      { email: 'blue@franchise.com', fullName: 'Pep Guardiola', password: 'manager123' }
    ];

    for (const manager of managerSeeds) {
      const existingManager = await UserModel.findOne({ email: manager.email });
      if (!existingManager) {
        const salt3 = await bcrypt.genSalt(10);
        const hashedPassword3 = await bcrypt.hash(manager.password, salt3);
        await UserModel.create({
          email: manager.email,
          password: hashedPassword3,
          role: 'manager',
          fullName: manager.fullName,
          token: null
        });
        console.log(`[AUTH] ✅ Default Manager seeded: ${manager.email} / ${manager.password}`);
      } else {
        console.log(`[AUTH] Manager account already exists: ${manager.email}`);
      }
    }
  } catch (err) {
    console.warn('[AUTH] Seed admin warning:', err.message);
  }
}

// ===========================================
// AUTH API ENDPOINTS
// ===========================================

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, studentId, fullName, jerseyName, jerseyNo, session, preferredPosition, secondaryPosition } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    if (!SELF_REGISTRABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: `Role "${role}" cannot be self-registered. Contact an administrator.` });
    }

    if (role === 'team_captain') {
      return res.status(400).json({ error: 'Direct Team Captain registration is disabled. Captains must be promoted through the approved workflow.' });
    }

    // Check existing email
    const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Player-specific validation
    if (role === 'player') {
      if (!studentId || !fullName || !jerseyName || !preferredPosition) {
        return res.status(400).json({ error: 'Player registration requires: studentId, fullName, jerseyName, and preferredPosition.' });
      }

      // Check unique studentId
      const existingStudent = await UserModel.findOne({ studentId });
      if (existingStudent) {
        return res.status(409).json({ error: 'A player with this Student ID is already registered.' });
      }
    }

    // Manager / Team Captain validation
    if (role === 'manager') {
      if (!fullName) {
        return res.status(400).json({ error: 'Manager registration requires a full name.' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate session token
    const token = generateToken();

    const newUser = await UserModel.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      token,
      studentId: role === 'player' ? studentId : null,
      fullName: fullName || email.split('@')[0],
      jerseyName: role === 'player' ? jerseyName : null,
      jerseyNo: role === 'player' ? (jerseyNo || null) : null,
      session: role === 'player' ? (session || null) : null,
      preferredPosition: role === 'player' ? preferredPosition : null,
      secondaryPosition: role === 'player' ? (secondaryPosition || null) : null
    });

    // Return user data (without password)
    const userData = {
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      token: newUser.token,
      fullName: newUser.fullName,
      phone: newUser.phone,
      studentId: newUser.studentId,
      jerseyName: newUser.jerseyName,
      jerseyNo: newUser.jerseyNo,
      session: newUser.session,
      preferredPosition: newUser.preferredPosition,
      secondaryPosition: newUser.secondaryPosition,
      is_icon_player: newUser.is_icon_player,
      captainTeamId: newUser.captainTeamId
    };

    console.log(`[AUTH] New ${role} registered: ${email}`);
    res.json({ success: true, user: userData });
  } catch (err) {
    console.error('[AUTH] Register error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate email or student ID.' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate fresh token
    const token = generateToken();
    user.token = token;
    await user.save();

    const userData = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      token: user.token,
      fullName: user.fullName,
      phone: user.phone,
      studentId: user.studentId,
      jerseyName: user.jerseyName,
      jerseyNo: user.jerseyNo,
      session: user.session,
      preferredPosition: user.preferredPosition,
      secondaryPosition: user.secondaryPosition,
      is_icon_player: user.is_icon_player,
      captainTeamId: user.captainTeamId
    };

    console.log(`[AUTH] Login: ${email} (${user.role})`);
    res.json({ success: true, user: userData });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const userData = {
    id: req.user._id.toString(),
    email: req.user.email,
    role: req.user.role,
    fullName: req.user.fullName,
    phone: req.user.phone,
    studentId: req.user.studentId,
    jerseyName: req.user.jerseyName,
    jerseyNo: req.user.jerseyNo,
    session: req.user.session,
    preferredPosition: req.user.preferredPosition,
    secondaryPosition: req.user.secondaryPosition
  };

  res.json({ success: true, user: userData });
});

// PUT /api/v1/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  try {
    const { email, fullName, phone, jerseyName, jerseyNo } = req.body;

    if (email && email.toLowerCase().trim() !== req.user.email) {
      const existing = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      req.user.email = email.toLowerCase().trim();
    }

    if (fullName !== undefined) req.user.fullName = fullName;
    if (phone !== undefined) req.user.phone = phone;
    if (jerseyName !== undefined) req.user.jerseyName = jerseyName;
    if (jerseyNo !== undefined) req.user.jerseyNo = (jerseyNo === '' ? null : Number(jerseyNo));

    await req.user.save();

    const userData = {
      id: req.user._id.toString(),
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName,
      phone: req.user.phone,
      studentId: req.user.studentId,
      jerseyName: req.user.jerseyName,
      jerseyNo: req.user.jerseyNo,
      session: req.user.session,
      preferredPosition: req.user.preferredPosition,
      secondaryPosition: req.user.secondaryPosition,
      is_icon_player: req.user.is_icon_player,
      captainTeamId: req.user.captainTeamId
    };

    res.json({ success: true, user: userData });
  } catch (err) {
    console.error('[AUTH] Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PUT /api/v1/auth/change-password
router.put('/change-password', authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    req.user.password = await bcrypt.hash(newPassword, salt);
    await req.user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[AUTH] Change password error:', err.message);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  if (req.user) {
    req.user.token = null;
    await req.user.save();
    console.log(`[AUTH] Logout: ${req.user.email}`);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/v1/auth/create-account (Super Admin or Auctioneer — create privileged accounts)
router.post('/create-account', authMiddleware, async (req, res) => {
  if (!req.user || (req.user.role !== 'super_admin' && req.user.role !== 'auctioneer')) {
    return res.status(403).json({ error: 'Only Super Admin or Auctioneer can create privileged accounts.' });
  }

  try {
    const { email, password, role, fullName } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    if (!ALL_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role: "${role}".` });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      fullName: fullName || email.split('@')[0],
      token: null
    });

    console.log(`[AUTH] Super Admin created ${role} account: ${email}`);
    res.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName
      }
    });
  } catch (err) {
    console.error('[AUTH] Create account error:', err.message);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// GET /api/v1/auth/icon-players - list all icon player candidates
router.get('/icon-players', authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const query = { role: 'player' };
    const users = await UserModel.find(query).select('-password');
    const data = users.map(u => ({
      id: u._id.toString(),
      email: u.email,
      fullName: u.fullName,
      studentId: u.studentId,
      jerseyName: u.jerseyName,
      role: u.role,
      is_icon_player: u.is_icon_player,
      captainTeamId: u.captainTeamId
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('[AUTH] Get icon players error:', err.message);
    res.status(500).json({ error: 'Failed to load icon players.' });
  }
});

// PUT /api/v1/auth/icon-players/:userId/mark - super admin marks or unmarks icon players
router.put('/icon-players/:userId/mark', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Super Admin can mark Icon Players.' });
  }

  try {
    const { userId } = req.params;
    const { is_icon_player } = req.body;
    const user = await UserModel.findById(userId);
    if (!user || user.role !== 'player') {
      return res.status(404).json({ error: 'Icon Player candidate not found.' });
    }

    user.is_icon_player = Boolean(is_icon_player);
    await user.save();

    res.json({ success: true, user: {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      studentId: user.studentId,
      jerseyName: user.jerseyName,
      role: user.role,
      is_icon_player: user.is_icon_player,
      captainTeamId: user.captainTeamId
    }});
  } catch (err) {
    console.error('[AUTH] Mark icon player error:', err.message);
    res.status(500).json({ error: 'Failed to update Icon Player status.' });
  }
});

// POST /api/v1/auth/promote-captain - manager appoints an icon player to their team
router.post('/promote-captain', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Only Managers can appoint Captains.' });
  }

  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Icon Player ID is required.' });
    }

    const db = loadDB();
    const team = db.teams.find(team => {
      return team.managerEmail?.toLowerCase() === req.user.email?.toLowerCase() ||
        team.managerName?.toLowerCase() === req.user.fullName?.toLowerCase();
    });

    if (!team) {
      return res.status(403).json({ error: 'Manager is not assigned to any team.' });
    }

    const playerUser = await UserModel.findById(userId);
    if (!playerUser || playerUser.role !== 'player') {
      return res.status(404).json({ error: 'Icon Player candidate not found.' });
    }

    if (!playerUser.is_icon_player) {
      return res.status(400).json({ error: 'This player is not marked as an Icon Player.' });
    }

    if (playerUser.captainTeamId && playerUser.captainTeamId !== team.id) {
      return res.status(400).json({ error: 'This Icon Player is already assigned as Captain to another team.' });
    }

    playerUser.role = 'team_captain';
    playerUser.captainTeamId = team.id;
    await playerUser.save();

    res.json({ success: true, user: {
      id: playerUser._id.toString(),
      email: playerUser.email,
      fullName: playerUser.fullName,
      studentId: playerUser.studentId,
      jerseyName: playerUser.jerseyName,
      role: playerUser.role,
      is_icon_player: playerUser.is_icon_player,
      captainTeamId: playerUser.captainTeamId
    }});
  } catch (err) {
    console.error('[AUTH] Promote captain error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A captain for this team already exists.' });
    }
    res.status(500).json({ error: 'Failed to promote Icon Player to Captain.' });
  }
});

module.exports = {
  authRouter: router,
  authMiddleware,
  requireRole,
  UserModel,
  seedDefaultAdmin,
  ALL_ROLES,
  SELF_REGISTRABLE_ROLES,
  ADMIN_ONLY_ROLES
};
