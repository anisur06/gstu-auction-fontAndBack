import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Settings, Shield, Flame, Play, Lock, AlertTriangle, CheckCircle, RefreshCw, Star } from 'lucide-react';

export default function SuperAdminDashboard({ systemState, onStateUpdated }) {
  const [totalBudget, setTotalBudget] = useState(systemState?.totalBudget || 100000000);
  const [nuking, setNuking] = useState(false);
  const [msg, setMsg] = useState('');
  const [iconPlayers, setIconPlayers] = useState([]);
  const [iconLoading, setIconLoading] = useState(false);

  const currentPhase = systemState?.phase || 'SETUP';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-auth-token': localStorage.getItem('gstu_auth_token')
  });

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
    } catch (err) {
      setMsg('Network error loading Icon Players.');
    } finally {
      setIconLoading(false);
    }
  };

  const handleToggleIconPlayer = async (userId, mark) => {
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
        setMsg('Failed to update Icon Player: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setMsg('Network error updating Icon Player status.');
    }
  };

  useEffect(() => {
    fetchIconPlayers();
  }, []);

  const handlePhaseChange = async (newPhase) => {
    try {
      const res = await apiFetch('/api/v1/system/phase', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('gstu_auth_token')
        },
        body: JSON.stringify({ phase: newPhase })
      });
      const data = await res.json();
      if (data.success && onStateUpdated) {
        onStateUpdated();
        setMsg(`System state shifted to ${newPhase}`);
      } else {
        setMsg(data.error || 'Failed to shift phase.');
      }
    } catch (err) {
      setMsg('Error updating phase.');
    }
  };

  const handleSaveBudget = async () => {
    try {
      const res = await apiFetch('/api/v1/system/rules', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('gstu_auth_token')
        },
        body: JSON.stringify({ totalBudget: parseInt(totalBudget, 10) })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Total team allowance budget updated!');
      } else {
        setMsg(data.error || 'Failed to save budget.');
      }
    } catch (err) {
      setMsg('Error saving budget rules.');
    }
  };

  const handleNuke = async () => {
    if (!window.confirm('WARNING: THIS WILL WIPE THE DATABASE AND DELETE ALL REMOTE CLOUDINARY MEDIA ASSETS! Are you sure you want to execute Lifecycle Reset (Nuke)?')) {
      return;
    }

    setNuking(true);
    setMsg('');

    try {
      const res = await apiFetch('/api/v1/admin/nuke', {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('gstu_auth_token')
        }
      });
      const data = await res.json();

      if (data.success) {
        setMsg('Lifecycle Reset (Nuke) successfully executed! Remote media deleted and state reset to Phase 1.');
        if (onStateUpdated) onStateUpdated();
      } else {
        setMsg('Nuke failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setMsg('Network error executing Nuke.');
    } finally {
      setNuking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs rounded-full uppercase tracking-wider mb-2 inline-block">
              Super Admin Workspace
            </span>
            <h1 className="font-teko text-4xl sm:text-5xl font-bold tracking-tight text-white uppercase">
              EVENT CONFIGURATION & STATE MACHINE
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Configure dynamic event rules, control the global system phase state, and execute the Nuke protocol to wipe database and Cloudinary storage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Phase</span>
              <span className="font-teko text-3xl font-extrabold text-purple-400">{currentPhase}</span>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-300 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid: State Machine + Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Global State Machine Stepper */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-400" /> Global System State Machine
          </h2>

          <div className="space-y-4">
            
            {/* Phase 1 */}
            <div className={`p-4 rounded-2xl border transition-all ${currentPhase === 'SETUP' ? 'bg-purple-950/40 border-purple-500/60 shadow-lg' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-teko text-xl font-bold text-white uppercase">Phase 1: SETUP (Pre-Event)</span>
                {currentPhase === 'SETUP' && <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">Active</span>}
              </div>
              <p className="text-xs text-slate-400 mb-3">Define rules, tiers, total budget, team managers, and registration parameters.</p>
              <button
                onClick={() => handlePhaseChange('SETUP')}
                className="px-4 py-2 bg-slate-800 hover:bg-purple-600 text-white font-semibold text-xs rounded-xl transition-all"
              >
                Set Phase 1: SETUP
              </button>
            </div>

            {/* Phase 2 */}
            <div className={`p-4 rounded-2xl border transition-all ${currentPhase === 'REGISTRATION' ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-teko text-xl font-bold text-white uppercase">Phase 2: REGISTRATION</span>
                {currentPhase === 'REGISTRATION' && <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">Active</span>}
              </div>
              <p className="text-xs text-slate-400 mb-3">Player portal opens. Players submit OVR, positions, stats, and photos.</p>
              <button
                onClick={() => handlePhaseChange('REGISTRATION')}
                className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition-all"
              >
                Open Phase 2: REGISTRATION
              </button>
            </div>

            {/* Phase 3 */}
            <div className={`p-4 rounded-2xl border transition-all ${currentPhase === 'AUCTION' ? 'bg-blue-950/40 border-blue-500/60 shadow-lg' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-teko text-xl font-bold text-white uppercase">Phase 3: THE AUCTION</span>
                {currentPhase === 'AUCTION' && <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">Active</span>}
              </div>
              <p className="text-xs text-slate-400 mb-3">Registration freezes. Sockets open. Podium Admin controls live bidding & timer.</p>
              <button
                onClick={() => handlePhaseChange('AUCTION')}
                className="px-4 py-2 bg-slate-800 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl transition-all"
              >
                Start Phase 3: AUCTION
              </button>
            </div>

            {/* Phase 4 */}
            <div className={`p-4 rounded-2xl border transition-all ${currentPhase === 'TOURNAMENT' ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-teko text-xl font-bold text-white uppercase">Phase 4: TOURNAMENT</span>
                {currentPhase === 'TOURNAMENT' && <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">Active</span>}
              </div>
              <p className="text-xs text-slate-400 mb-3">Auction routes strictly locked. Live match scores, points table, and statistics active.</p>
              <button
                onClick={() => handlePhaseChange('TOURNAMENT')}
                className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl transition-all"
              >
                Shift to Phase 4: TOURNAMENT
              </button>
            </div>

          </div>
        </div>

        {/* Right: Dynamic Event Rules & Nuke Protocol */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dynamic Budget Rules */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" /> Dynamic Allowance Budget
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Total Team Purse Allowance ($)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                  <button
                    onClick={handleSaveBudget}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
                <span className="font-bold text-slate-300 block mb-1">Percentage-Based Raise Tiers (Backend Calculated)</span>
                <div className="flex justify-between text-slate-400"><span>0% - 3% of budget:</span><span className="font-mono text-emerald-400">+0.15% raise</span></div>
                <div className="flex justify-between text-slate-400"><span>3% - 10% of budget:</span><span className="font-mono text-emerald-400">+0.50% raise</span></div>
                <div className="flex justify-between text-slate-400"><span>10% - 25% of budget:</span><span className="font-mono text-emerald-400">+1.00% raise</span></div>
                <div className="flex justify-between text-slate-400"><span>&gt;25% of budget:</span><span className="font-mono text-emerald-400">+2.50% raise</span></div>
              </div>
            </div>
          </div>

          {/* Icon Player Marking */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Star className="w-5 h-5 text-amber-400" /> Icon Player Selection</h2>
                <p className="text-sm text-slate-400 max-w-2xl">Mark players as Icon Players from the registered player pool. Once marked, Managers can promote them to Team Captain.</p>
              </div>
              <button
                onClick={fetchIconPlayers}
                className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
              >
                Refresh
              </button>
            </div>

            {iconLoading ? (
              <div className="rounded-3xl border border-slate-800/80 p-6 text-center text-slate-400">Loading Icon Player candidates...</div>
            ) : iconPlayers.length === 0 ? (
              <div className="rounded-3xl border border-slate-800/80 p-6 text-center text-slate-400">No registered player accounts found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {iconPlayers.map(player => (
                  <div key={player.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-[0.25em]">{player.studentId || 'Player Account'}</p>
                      <h3 className="text-xl font-bold text-white mt-1">{player.fullName || player.jerseyName}</h3>
                      <p className="text-xs text-slate-400 mt-1">{player.email}</p>
                      <p className="text-xs text-slate-400 mt-1">Jersey: {player.jerseyName || '—'}</p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-3">
                      <span className={`px-3 py-1 rounded-full text-[11px] uppercase font-bold ${player.is_icon_player ? 'bg-amber-500/10 text-amber-300 border border-amber-400/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {player.is_icon_player ? 'Icon Player' : 'Regular Player'}
                      </span>
                      <button
                        onClick={() => handleToggleIconPlayer(player.id, !player.is_icon_player)}
                        className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all ${player.is_icon_player ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'}`}
                      >
                        {player.is_icon_player ? 'Unmark Icon Player' : 'Mark as Icon Player'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LIFECYCLE RESET (NUKE PROTOCOL) */}
          <div className="bg-red-950/30 border border-red-500/30 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wider mb-2">
              <Flame className="w-5 h-5 text-red-500 animate-pulse" /> Lifecycle Reset (Nuke Protocol)
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Resets database back to Phase 1: SETUP and triggers Cloudinary API (`delete_resources_by_prefix`) to destroy all uploaded remote images.
            </p>

            <button
              onClick={handleNuke}
              disabled={nuking}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-teko text-2xl font-bold rounded-2xl shadow-xl shadow-red-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {nuking ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> EXECUTING NUKE & WIPING CLOUDINARY...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6" /> EXECUTE LIFECYCLE RESET (NUKE)
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
