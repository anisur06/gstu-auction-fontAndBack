import React, { useMemo } from 'react';
import FutPlayerCard from '../components/FutPlayerCard';
import { Shield, Users, Search, Star } from 'lucide-react';

export default function MyTeam({ user, players = [], teams = [] }) {
  const isTeamUser = ['manager', 'team_captain', 'player'].includes(user?.role);

  const myTeam = useMemo(() => {
    if (!isTeamUser) return null;

    // For manager/captain, match by team manager email or fullName.
    if (user.role === 'manager' || user.role === 'team_captain') {
      const managerMatch = teams.find(team => {
        const emailMatch = team.managerEmail?.toLowerCase() === user.email?.toLowerCase();
        const nameMatch = team.managerName?.toLowerCase() === user.fullName?.toLowerCase();
        return emailMatch || nameMatch;
      });
      if (managerMatch) return managerMatch;
      return teams.find(team => team.id === user.captainTeamId) || null;
    }

    // For player, find their signed team by soldToTeamId.
    if (user.role === 'player') {
      const signedPlayer = players.find(player => player.studentId === user.studentId || player.jerseyName === user.jerseyName);
      if (!signedPlayer || !signedPlayer.soldToTeamId) return null;
      return teams.find(team => team.id === signedPlayer.soldToTeamId) || null;
    }

    return null;
  }, [user, players, teams, isTeamUser]);

  const teammates = useMemo(() => {
    if (!myTeam) return [];
    return (myTeam.roster || []).filter(player => player.soldToTeamId === myTeam.id);
  }, [myTeam]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
              <Users className="w-4 h-4" /> My Team
            </div>
            <h1 className="text-4xl sm:text-5xl font-teko text-white font-extrabold">Your Team Roster</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">View the players currently assigned to your team and the roster you represent in the GSTU auction.</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase text-slate-400 font-bold tracking-[0.3em]">Account</p>
            <p className="text-sm text-slate-200 mt-1">{user.fullName || user.email}</p>
            <p className="text-xs uppercase text-slate-500 tracking-[0.25em] mt-1">{user.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {!isTeamUser && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
          <p className="text-sm">This page is only available to Team Managers, Team Captains, and Players.</p>
        </div>
      )}

      {isTeamUser && !myTeam && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
          <div className="inline-flex items-center gap-2 text-blue-400 text-sm font-bold uppercase tracking-[0.25em] mb-3">
            <Shield className="w-4 h-4" /> Team Not Found
          </div>
          <p className="text-sm">We could not automatically determine your team.</p>
          <p className="text-slate-500 mt-2">If you're a player, you need to be signed to a team in the auction. If you're a manager or captain, ensure your team manager details match your account email or full name.</p>
        </div>
      )}

      {isTeamUser && myTeam && (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
                {myTeam.logo || '⚽'}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Team</p>
                <h2 className="text-3xl font-teko text-white font-extrabold mt-1">{myTeam.name}</h2>
                <p className="text-slate-500 text-sm mt-2">Roster: {teammates.length} players</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">Manager</p>
                <p className="text-sm text-slate-200 mt-1">{myTeam.managerName || 'Not assigned'}</p>
                <p className="text-xs text-slate-500 mt-1">{myTeam.managerEmail || 'No manager email'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">Budget</p>
                <p className="text-sm text-slate-200 mt-1">${(myTeam.budget || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Spent: ${(myTeam.budgetSpent || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">Team Tag</p>
                <p className="text-3xl font-teko text-white mt-2">{myTeam.code || '—'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Team Roster</p>
                  <h3 className="text-2xl font-bold text-white mt-2">My Teammates</h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/90 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300">
                  <Search className="w-4 h-4 text-slate-400" /> {teammates.length} players
                </div>
              </div>

              {teammates.length === 0 ? (
                <div className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-10 text-center text-slate-500">
                  <p>No players have been assigned to this team yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {teammates.map(player => (
                    <FutPlayerCard
                      key={player.id}
                      player={player}
                      size="small"
                      isSold={player.status === 'SOLD' || Boolean(player.soldToTeamId)}
                      soldPrice={player.soldPrice}
                      soldTeamName={myTeam.name}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 text-slate-300 mb-4">
                <Star className="w-4 h-4 text-amber-400" />
                <p className="text-xs uppercase tracking-[0.3em] font-bold">Roster Notes</p>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">Players shown here are the ones currently signed to your franchise through auction purchases. Team managers and captains can use this list to coordinate the squad.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
