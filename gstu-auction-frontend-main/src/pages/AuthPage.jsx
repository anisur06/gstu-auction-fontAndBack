import React, { useState } from 'react';
import { apiUrl } from '../api';
import { Trophy, Mail, Lock, User, Hash, MapPin, Shield, Eye, EyeOff, ChevronRight, Loader2, Sparkles, Users, Radio, Settings, UserCheck, Crown, X } from 'lucide-react';

const ROLE_CONFIG = {
  player: {
    label: 'Player',
    icon: UserCheck,
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    description: 'Register as a player to enter the draft pool'
  },
  manager: {
    label: 'Manager',
    icon: Shield,
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    description: 'Manage teams and bid on players during auctions'
  }
};

const POSITIONS = [
  'GK', 'CB', 'LB', 'RB', 'LWB', 'RWB',
  'CDM', 'CM', 'CAM', 'LM', 'RM',
  'LW', 'RW', 'CF', 'ST'
];

export default function AuthPage({ onLoginSuccess, onClose }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('player');
  const [regFullName, setRegFullName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regJerseyName, setRegJerseyName] = useState('');
  const [regJerseyNo, setRegJerseyNo] = useState('');
  const [regPreferredPosition, setRegPreferredPosition] = useState('');
  const [regSession, setRegSession] = useState('2024-2025');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      // Store auth data
      localStorage.setItem('gstu_auth_token', data.user.token);
      localStorage.setItem('gstu_auth_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      setLoading(false);
      return;
    }

    try {
      const body = {
        email: regEmail,
        password: regPassword,
        role: regRole,
        fullName: regFullName
      };

      if (regRole === 'player') {
        body.studentId = regStudentId;
        body.jerseyName = regJerseyName;
        body.jerseyNo = regJerseyNo ? parseInt(regJerseyNo) : undefined;
        body.preferredPosition = regPreferredPosition;
        body.session = regSession;
      }

      const res = await fetch(apiUrl('/api/v1/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Auto-login after registration
      localStorage.setItem('gstu_auth_token', data.user.token);
      localStorage.setItem('gstu_auth_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-start sm:items-center justify-center relative overflow-y-auto py-8">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Brand Header */}
        <div className="relative text-center mb-8">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="absolute right-0 top-0 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-full p-2 transition-all"
            aria-label="Close login modal"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-2xl shadow-blue-500/30 border border-blue-400/30 mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-teko text-4xl sm:text-5xl font-bold tracking-tight text-white leading-none">
            GSTU FOOTBALL
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Franchise Auction & Tournament Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden max-h-[calc(100vh-4rem)] w-full">
          
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800/80">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 text-sm font-bold tracking-wider uppercase transition-all relative ${
                mode === 'login'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign In
              {mode === 'login' && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 text-sm font-bold tracking-wider uppercase transition-all relative ${
                mode === 'register'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Register
              {mode === 'register' && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              )}
            </button>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* ========== LOGIN FORM ========== */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-11 pr-11 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500 mt-4">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                    Register here
                  </button>
                </p>
              </form>
            )}

            {/* ========== REGISTER FORM ========== */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                
                {/* Role Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Select Your Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ROLE_CONFIG)
                      .filter(([roleKey]) => roleKey !== 'manager')
                      .map(([roleKey, cfg]) => {
                      const Icon = cfg.icon;
                      const isSelected = regRole === roleKey;
                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => setRegRole(roleKey)}
                          className={`relative p-3 rounded-xl border transition-all text-left group ${
                            isSelected
                              ? `${cfg.bgColor} ${cfg.borderColor} ring-1 ring-offset-0 ring-opacity-50`
                              : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isSelected ? `bg-gradient-to-br ${cfg.color}` : 'bg-slate-700/60'
                            }`}>
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            </div>
                            <span className={`text-xs font-bold ${isSelected ? cfg.textColor : 'text-slate-400'}`}>
                              {cfg.label}
                            </span>
                          </div>
                          {isSelected && (
                            <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-br ${cfg.color}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">{ROLE_CONFIG[regRole].description}</p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Player-Specific Fields */}
                {regRole === 'player' && (
                  <div className="space-y-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Player Details</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Student ID</label>
                      <input
                        type="text"
                        value={regStudentId}
                        onChange={(e) => setRegStudentId(e.target.value)}
                        placeholder="e.g. CSE-2021-001"
                        required
                        className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Jersey Name</label>
                        <input
                          type="text"
                          value={regJerseyName}
                          onChange={(e) => setRegJerseyName(e.target.value)}
                          placeholder="e.g. RONALDO"
                          required
                          className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Jersey Number</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={regJerseyNo}
                            onChange={(e) => setRegJerseyNo(e.target.value)}
                            placeholder="7"
                            className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Preferred Position</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select
                          value={regPreferredPosition}
                          onChange={(e) => setRegPreferredPosition(e.target.value)}
                          required
                          className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-slate-900">Select position...</option>
                          {POSITIONS.map(pos => (
                            <option key={pos} value={pos} className="bg-slate-900">{pos}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Academic Session</label>
                      <select
                        value={regSession}
                        onChange={(e) => setRegSession(e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                      >
                        {['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025'].map(s => (
                          <option key={s} value={s} className="bg-slate-900">{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-11 pr-11 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500 mt-4">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-600 mt-6">
          GSTU Football Franchise League • Dept. Hackathon 2026
        </p>
      </div>
    </div>
  );
}
