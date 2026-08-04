import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Users, Shield, Plus, Trash2, Search, X, Loader2, Star } from 'lucide-react';

export default function ManagementConsole({ user, players = [], teams = [], systemState }) {
  const isAdmin = user?.role === 'super_admin' || user?.role === 'auctioneer';
  const isSuperAdmin = user?.role === 'super_admin';
  const isManager = user?.role === 'manager';
  const isTeamCaptain = user?.role === 'team_captain';

  // State management
  const [activeSubTab, setActiveSubTab] = useState('players'); // 'players' | 'teams'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Modals
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [iconPlayers, setIconPlayers] = useState([]);
  const [iconLoading, setIconLoading] = useState(false);

  // Form states
  const [teamForm, setTeamForm] = useState({ name: '', managerName: '', managerEmail: '', logo: '⚽' });

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-auth-token': localStorage.getItem('gstu_auth_token') || ''
  });

  // ========== TEAM CRUD ==========
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/teams', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(teamForm)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Team created successfully!');
        setTeamForm({ name: '', managerName: '', managerEmail: '', logo: '⚽' });
        setShowCreateTeam(false);
      } else {
        setMsg('Error: ' + data.error);
      }
    } catch {
      setMsg('Network error creating team.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete team "${teamName}"?`)) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/teams/${teamId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Team deleted.');
      } else {
        setMsg('Error: ' + data.error);
      }
    } catch {
      setMsg('Network error deleting team.');
    } finally {
      setLoading(false);
    }
  };

  // ========== PLAYER CRUD ==========
  const handleDeletePlayer = async (playerId, playerName) => {
    if (!window.confirm(`Are you sure you want to delete player "${playerName}"?`)) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/players/${playerId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Player deleted.');
      } else {
        setMsg('Error: ' + data.error);
      }
    } catch {
      setMsg('Network error deleting player.');
    } finally {
      setLoading(false);
    }
  };

  const fetchIconPlayers = async () => {
    setIconLoading(true);
    try {
      const res = await apiFetch('/api/v1/auth/icon-players', {
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setIconPlayers(data.data || []);
      } else {
        setMsg('Error loading Icon Players: ' + (data.error || 'Unknown error'));
      }
    } catch {
      setMsg('Network error loading Icon Players.');
    } finally {
      setIconLoading(false);
    }
  };

  const handleMarkIconPlayer = async (userId, mark) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/auth/icon-players/${userId}/mark`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ is_icon_player: mark })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg(`Icon Player ${mark ? 'marked' : 'unmarked'} successfully.`);
        await fetchIconPlayers();
      } else {
        setMsg('Error updating Icon Player: ' + (data.error || 'Unknown error'));
      }
    } catch {
      setMsg('Network error updating Icon Player.');
    } finally {
      setLoading(false);
    }
  };

  const managerTeam = teams.find(team => {
    return team.managerEmail?.toLowerCase() === user?.email?.toLowerCase() ||
      team.managerName?.toLowerCase() === user?.fullName?.toLowerCase();
  });

  const handlePromoteCaptain = async (userId) => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/auth/promote-captain', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg('Icon Player promoted to Team Captain successfully.');
        await fetchIconPlayers();
      } else {
        setMsg('Error promoting Captain: ' + (data.error || 'Unknown error'));
      }
    } catch {
      setMsg('Network error promoting Captain.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.jerseyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  React.useEffect(() => {
    if (isSuperAdmin || isManager) {
      fetchIconPlayers();
    }
  }, [isSuperAdmin, isManager]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Console Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-full uppercase mb-2 inline-block">
              Franchise Management Console
            </span>
            <h1 className="font-teko text-4xl sm:text-5xl font-bold text-white uppercase">MANAGEMENT CONSOLE</h1>
            <p className="text-slate-400 text-sm">Create, edit, and delete players and franchise teams.</p>
          </div>
          
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1 shrink-0">
            <button
              onClick={() => setActiveSubTab('players')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                activeSubTab === 'players' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> PLAYERS
            </button>
            {(isSuperAdmin || isManager) && (
              <button
                onClick={() => setActiveSubTab('teams')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'teams' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> TEAMS
              </button>
            )}
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-300 text-sm flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-slate-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* ==================================== PLAYERS TAB ==================================== */}
      {activeSubTab === 'players' && (
        <>
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" /> Manage League Players ({players.length})
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-950 text-[11px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-800">
                <tr>
                  <th className="p-4">Player</th>
                  <th className="p-4">Student ID</th>
                  <th className="p-4">OVR</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Position</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPlayers.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/20 transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center font-teko font-bold text-white text-xs shrink-0">
                          {p.primaryPosition}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-none">{p.name}</p>
                          <p className="text-[10px] text-slate-500 mt-1">Jersey: {p.jerseyName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-xs">{p.studentId}</td>
                    <td className="p-4 text-slate-200 font-bold">{p.ovr}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                        p.tier === 'Platinum' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        p.tier === 'Gold' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        p.tier === 'Silver' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {p.tier}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-semibold">{p.primaryPosition}</td>
                    <td className="p-4">
                      <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                        p.status === 'SOLD' ? 'bg-emerald-500/20 text-emerald-400' :
                        p.status === 'ON_PODIUM' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                        p.status === 'UNSOLD' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleDeletePlayer(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"
                          title="Delete Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPlayers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">No players found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}

      {(isSuperAdmin || isManager) && activeSubTab === 'players' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> Icon Player Workflow
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl">
                {isSuperAdmin
                  ? 'Super Admin can mark Icon Players from the registered player pool.'
                  : 'Managers can promote marked Icon Players to Captain for their assigned team.'}
              </p>
            </div>
            {isManager && (
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-xs text-slate-300">
                <p className="font-semibold text-slate-200">Managed Team</p>
                <p>{managerTeam ? managerTeam.name : 'Team not found'}</p>
              </div>
            )}
          </div>

          {iconLoading ? (
            <div className="rounded-3xl border border-slate-800/80 p-6 text-center text-slate-400">Loading Icon Player candidates...</div>
          ) : iconPlayers.length === 0 ? (
            <div className="rounded-3xl border border-slate-800/80 p-6 text-center text-slate-400">
              No registered players available to mark or promote yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {iconPlayers.map(player => (
                <div key={player.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400 uppercase tracking-[0.25em]">{player.studentId || 'Player'}</p>
                      <h3 className="text-xl font-bold text-white">{player.fullName || player.jerseyName}</h3>
                      <p className="text-xs text-slate-500 mt-1">Jersey: {player.jerseyName || '—'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold uppercase ${player.is_icon_player ? 'bg-amber-500/15 text-amber-300 border border-amber-400/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {player.is_icon_player ? 'Icon Candidate' : 'Regular Player'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-400">
                    <p>Email: {player.email}</p>
                    <p>Role: {player.role?.replace('_', ' ')}</p>
                    <p>Captain Team: {player.captainTeamId || 'None'}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-800/80">
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleMarkIconPlayer(player.id, !player.is_icon_player)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-2xl font-semibold text-sm transition-all ${player.is_icon_player ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'}`}
                      >
                        {player.is_icon_player ? 'Unmark Icon Player' : 'Mark as Icon Player'}
                      </button>
                    )}

                    {isManager && (
                      <button
                        onClick={() => handlePromoteCaptain(player.id)}
                        disabled={!player.is_icon_player || Boolean(player.captainTeamId) || !managerTeam}
                        className={`w-full sm:w-auto px-4 py-2 rounded-2xl font-semibold text-sm transition-all ${player.is_icon_player && !player.captainTeamId && managerTeam ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                      >
                        {player.captainTeamId
                          ? 'Already a Captain'
                          : player.is_icon_player
                            ? 'Promote to Captain'
                            : 'Not marked as Icon'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================== TEAMS TAB ==================================== */}
      {activeSubTab === 'teams' && (isSuperAdmin || isManager) && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" /> Manage Franchise Teams ({teams.length})
            </h2>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Create Team
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(t => (
              <div key={t.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-2xl">
                      {t.logo || '⚽'}
                    </div>
                    <div>
                      <h3 className="font-teko text-2xl font-bold text-white leading-none">{t.name}</h3>
                      <p className="text-xs text-slate-400">Code: {t.code}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <p>Manager: <strong className="text-slate-200">{t.managerName || '—'}</strong></p>
                    <p>Email: <strong className="text-slate-200">{t.managerEmail || '—'}</strong></p>
                    <p>Roster Size: <strong className="text-slate-200">{t.roster?.length || 0} players</strong></p>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-slate-800/80 pt-3 mt-4">
                  <button
                    onClick={() => handleDeleteTeam(t.id, t.name)}
                    className="flex-1 py-2 bg-red-950/20 border border-red-500/20 hover:bg-red-600 text-red-400 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
            {teams.length === 0 && (
              <p className="text-slate-500 text-sm py-4 col-span-3 text-center">No franchise teams registered yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================================== MODAL: CREATE TEAM ==================================== */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateTeam} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-teko text-3xl font-bold text-white uppercase">Create Franchise Team</h3>
              <button type="button" onClick={() => setShowCreateTeam(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Team Logo (Emoji)</label>
              <input
                type="text"
                required
                maxLength="2"
                value={teamForm.logo}
                onChange={e => setTeamForm({ ...teamForm, logo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Team Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Red Dragons FC"
                value={teamForm.name}
                onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Manager Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Pep Guardiola"
                value={teamForm.managerName}
                onChange={e => setTeamForm({ ...teamForm, managerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Manager Email</label>
              <input
                type="email"
                required
                placeholder="manager@franchise.com"
                value={teamForm.managerEmail}
                onChange={e => setTeamForm({ ...teamForm, managerEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Team'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
