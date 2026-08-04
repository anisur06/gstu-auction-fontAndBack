import React from 'react';
import { Trophy, Users, Radio, Star, ChevronRight, Zap, Shield } from 'lucide-react';
import FutPlayerCard from '../components/FutPlayerCard';

export default function LandingPage({ systemState, setActiveTab, players = [], teams = [] }) {
  const phase = systemState?.phase || 'SETUP';

  const phaseConfig = {
    SETUP: {
      title: 'PRE-EVENT SETUP',
      subtitle: 'The league is being configured. Registration will open soon.',
      gradient: 'from-purple-900 via-slate-950 to-blue-950',
      accent: 'purple',
      cta: null,
    },
    REGISTRATION: {
      title: 'PLAYER REGISTRATION OPEN',
      subtitle: 'Register now! Build your EA FC FUT card and enter the franchise draft pool.',
      gradient: 'from-emerald-900 via-slate-950 to-teal-950',
      accent: 'emerald',
      cta: { label: 'REGISTER AS A PLAYER', tab: 'register' },
    },
    AUCTION: {
      title: 'THE AUCTION IS LIVE',
      subtitle: 'Bids are flying — watch the live podium and franchise action in real time.',
      gradient: 'from-blue-900 via-slate-950 to-indigo-950',
      accent: 'blue',
      cta: { label: 'WATCH LIVE PODIUM, TOURNAMENT STANDINGS', tab: 'spectator' },
    },
    TOURNAMENT: {
      title: 'TOURNAMENT IS UNDERWAY',
      subtitle: 'Live matches, points table, goal scorers, and team standings are active.',
      gradient: 'from-indigo-900 via-slate-950 to-purple-950',
      accent: 'indigo',
      cta: { label: 'VIEW TOURNAMENT STANDINGS', tab: 'tournament' },
    },
  };

  const cfg = phaseConfig[phase] || phaseConfig.SETUP;

  // Compute quick stats
  const availablePlayers = players.filter(p => p.status === 'AVAILABLE').length;
  const soldPlayers = players.filter(p => p.status === 'SOLD').length;
  const totalPurse = teams.reduce((s, t) => s + (t.budget || 0), 0);
  const totalSpent = teams.reduce((s, t) => s + (t.budgetSpent || 0), 0);

  // Sample cards (max 3 available players)
  const featuredPlayers = players.filter(p => p.status !== 'SOLD').slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* ===== HERO BANNER ===== */}
      <section className={`relative bg-gradient-to-br ${cfg.gradient} overflow-hidden`}>
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 flex flex-col items-center text-center">
          {/* Phase Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-widest uppercase mb-6 bg-${cfg.accent}-500/10 border-${cfg.accent}-500/30 text-${cfg.accent}-400`}>
            <div className={`w-2 h-2 rounded-full bg-${cfg.accent}-400 ${phase === 'AUCTION' ? 'animate-pulse' : ''}`} />
            {phase} — {cfg.title}
          </div>

          <h1 className="font-teko text-6xl sm:text-8xl font-bold tracking-tight text-white mb-4 leading-none">
            GSTU FOOTBALL<br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              FRANCHISE LEAGUE
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mb-8">{cfg.subtitle}</p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {cfg.cta && (
              <button
                onClick={() => {
                  if (cfg.cta.tab === 'register' && typeof onRequestAuth === 'function') {
                    onRequestAuth();
                  } else {
                    setActiveTab(cfg.cta.tab);
                  }
                }}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-teko text-2xl px-8 py-4 rounded-2xl shadow-2xl shadow-blue-500/30 transition-all"
              >
                {cfg.cta.label}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <button
              onClick={() => {
                if (typeof onRequestAuth === 'function') onRequestAuth();
                else setActiveTab('register');
              }}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-slate-100 border border-slate-700 px-6 py-4 rounded-2xl font-semibold transition-all"
            >
              <Shield className="w-4 h-4 text-blue-300" /> Login / Register
            </button>
          </div>

          {/* Quick Stats Row */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl">
            {[
              { label: 'Registered Players', value: players.length, icon: Users, color: 'text-blue-400' },
              { label: 'Available in Draft', value: availablePlayers, icon: Star, color: 'text-amber-400' },
              { label: 'Sold / Signed', value: soldPlayers, icon: Trophy, color: 'text-emerald-400' },
              { label: 'Franchises', value: teams.length, icon: Zap, color: 'text-purple-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <div className="font-teko text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-[11px] text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PLAYER CARDS ===== */}
      {featuredPlayers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest rounded-full">
              Draft Pool Spotlight
            </span>
            <h2 className="font-teko text-5xl font-bold text-white mt-3">FEATURED PLAYERS</h2>
            <p className="text-slate-400 text-sm mt-1">EA FC FUT Shield Cards from the registered player pool</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {featuredPlayers.map(player => (
              <FutPlayerCard key={player.id} player={player} size="normal" />
            ))}
          </div>
        </section>
      )}

      {/* ===== HOW IT WORKS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
        <div className="text-center mb-10">
          <span className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest rounded-full">
            Platform Overview
          </span>
          <h2 className="font-teko text-5xl font-bold text-white mt-3">HOW THE PLATFORM WORKS</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { phase: '01', title: 'SETUP', desc: 'Super Admin configures tiers, budgets, and team franchises.', color: 'purple', icon: '⚙️' },
            { phase: '02', title: 'REGISTRATION', desc: 'Players self-register with stats, positions, OVR, and Cloudinary photo to generate FUT cards.', color: 'emerald', icon: '📋' },
            { phase: '03', title: 'LIVE AUCTION', desc: 'Podium Admin controls live bidding. Team Managers bid in real time via WebSockets with dynamic raise tiers.', color: 'blue', icon: '🔨' },
            { phase: '04', title: 'TOURNAMENT', desc: 'Live match scores, real-time points table, goal scorers, and team squad stats.', color: 'indigo', icon: '🏆' },
          ].map(step => (
            <div key={step.phase} className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all group">
              <div className="text-3xl mb-4">{step.icon}</div>
              <div className={`text-xs font-black text-${step.color}-500 tracking-widest uppercase mb-1`}>Phase {step.phase}</div>
              <h3 className="font-teko text-2xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TEAM FRANCHISES ===== */}
      {teams.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
          <div className="text-center mb-10">
            <h2 className="font-teko text-5xl font-bold text-white">FRANCHISE TEAMS</h2>
            <p className="text-slate-400 text-sm mt-1">Competing franchises and their remaining purse</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <div key={team.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-3xl shadow-lg">
                    {team.logo || '⚽'}
                  </div>
                  <div>
                    <h3 className="font-teko text-2xl font-bold text-white leading-none">{team.name}</h3>
                    <p className="text-xs text-slate-400">{team.managerName || 'Manager TBD'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Purse</span>
                    <span className="font-mono font-bold text-emerald-400">${(team.budget || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Spent</span>
                    <span className="font-mono font-bold text-red-400">${(team.budgetSpent || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Remaining</span>
                    <span className="font-mono font-bold text-blue-400">${((team.budget || 0) - (team.budgetSpent || 0)).toLocaleString()}</span>
                  </div>
                  {/* Budget bar */}
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((team.budgetSpent || 0) / (team.budget || 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 text-right">{team.roster?.length || 0} players signed</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
