import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import FutPlayerCard from '../components/FutPlayerCard';
import { Trophy, Target, Activity, Star } from 'lucide-react';

export default function TournamentDashboard({ systemState, teams = [], players = [] }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/v1/tournament/matches')
      .then(r => r.json())
      .then(d => { if (d.success) setMatches(d.matches); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Calculate points table from matches
  const calcPointsTable = () => {
    const table = {};
    teams.forEach(t => {
      table[t.name] = { name: t.name, logo: t.logo, pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    });

    matches.filter(m => m.status === 'FINISHED').forEach(m => {
      if (!table[m.homeTeam]) table[m.homeTeam] = { name: m.homeTeam, logo: '⚽', pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
      if (!table[m.awayTeam]) table[m.awayTeam] = { name: m.awayTeam, logo: '⚽', pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };

      const h = table[m.homeTeam];
      const a = table[m.awayTeam];
      const hs = m.homeScore || 0;
      const as = m.awayScore || 0;

      h.pld++; h.gf += hs; h.ga += as;
      a.pld++; a.gf += as; a.ga += hs;

      if (hs > as) { h.w++; h.pts += 3; a.l++; }
      else if (hs < as) { a.w++; a.pts += 3; h.l++; }
      else { h.d++; h.pts++; a.d++; a.pts++; }
    });

    return Object.values(table)
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  };

  const standings = calcPointsTable();
  const soldPlayers = players.filter(p => p.status === 'SOLD');
  const topOvr = [...soldPlayers].sort((a, b) => (b.ovr || 0) - (a.ovr || 0)).slice(0, 6);

  if (systemState?.phase !== 'TOURNAMENT') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <Trophy className="w-16 h-16 text-indigo-400 mb-4" />
        <h2 className="font-teko text-5xl text-white mb-2">TOURNAMENT DASHBOARD</h2>
        <p className="text-slate-400">Live tournament data is available during <strong className="text-indigo-400">Phase 4: TOURNAMENT</strong>.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-full mb-2 inline-block uppercase tracking-wider">
              Phase 4: Tournament Live
            </span>
            <h1 className="font-teko text-5xl sm:text-6xl font-bold text-white uppercase leading-none">
              TOURNAMENT <span className="text-indigo-400">STANDINGS</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Live points table, match results, and franchise player stats.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Teams', value: teams.length, color: 'text-blue-400' },
              { label: 'Matches Played', value: matches.filter(m => m.status === 'FINISHED').length, color: 'text-emerald-400' },
              { label: 'Players Signed', value: soldPlayers.length, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center">
                <div className={`font-teko text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT: Points Table + Match Results */}
        <div className="lg:col-span-7 space-y-8">

          {/* Points Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
            <div className="p-6 border-b border-slate-800">
              <h2 className="font-teko text-3xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" /> POINTS TABLE
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/80">
                  <tr className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">
                    <th className="text-left p-4">#</th>
                    <th className="text-left p-4">Team</th>
                    <th className="p-4">PLD</th>
                    <th className="p-4">W</th>
                    <th className="p-4">D</th>
                    <th className="p-4">L</th>
                    <th className="p-4">GF</th>
                    <th className="p-4">GA</th>
                    <th className="p-4">GD</th>
                    <th className="p-4 text-right">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {standings.map((team, idx) => (
                    <tr key={team.name} className={`transition-all hover:bg-slate-800/30 ${idx === 0 ? 'bg-amber-950/20' : idx === 1 ? 'bg-slate-700/10' : ''}`}>
                      <td className="p-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-400 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'text-slate-500'}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{team.logo || '⚽'}</span>
                          <span className="font-bold text-white">{team.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-300">{team.pld}</td>
                      <td className="p-4 text-center text-emerald-400 font-bold">{team.w}</td>
                      <td className="p-4 text-center text-amber-400 font-bold">{team.d}</td>
                      <td className="p-4 text-center text-red-400 font-bold">{team.l}</td>
                      <td className="p-4 text-center text-slate-300">{team.gf}</td>
                      <td className="p-4 text-center text-slate-300">{team.ga}</td>
                      <td className={`p-4 text-center font-bold ${team.gf - team.ga > 0 ? 'text-emerald-400' : team.gf - team.ga < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                        {team.gf - team.ga > 0 ? '+' : ''}{team.gf - team.ga}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-teko text-2xl font-black ${idx === 0 ? 'text-amber-400' : 'text-white'}`}>
                          {team.pts}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {standings.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500 text-sm">No match data yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Match Results */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h2 className="font-teko text-3xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-400" /> MATCH RESULTS
            </h2>
            {loading ? (
              <p className="text-slate-400 text-sm text-center py-8">Loading fixtures...</p>
            ) : (
              <div className="space-y-3">
                {matches.map(match => (
                  <div key={match.id} className={`p-4 rounded-2xl border transition-all ${match.status === 'FINISHED' ? 'bg-slate-950 border-slate-800' : 'bg-blue-950/30 border-blue-500/30'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 text-right">
                        <span className="font-bold text-white text-sm truncate block">{match.homeTeam}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {match.status === 'FINISHED' ? (
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2">
                            <span className="font-teko text-2xl font-black text-white">{match.homeScore}</span>
                            <span className="text-slate-500 font-bold">—</span>
                            <span className="font-teko text-2xl font-black text-white">{match.awayScore}</span>
                          </div>
                        ) : (
                          <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-bold">
                            UPCOMING
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-bold text-white text-sm truncate block">{match.awayTeam}</span>
                      </div>
                    </div>
                    <p className="text-center text-[11px] text-slate-500 mt-1">{match.date}</p>
                  </div>
                ))}
                {matches.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-8">No fixtures scheduled.</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT: Top Players By OVR + Franchise Rosters */}
        <div className="lg:col-span-5 space-y-8">

          {/* Top Players by OVR */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h2 className="font-teko text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-400" /> TOP PLAYERS — OVR RANKINGS
            </h2>
            {topOvr.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No players signed yet.</p>
            ) : (
              <div className="space-y-3">
                {topOvr.map((player, idx) => {
                  const soldTeam = teams.find(t => t.id === player.soldToTeamId);
                  return (
                    <div key={player.id} className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-400 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'}`}>
                        {idx + 1}
                      </span>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-teko font-black text-white text-sm shrink-0 ${player.tier === 'Platinum' ? 'bg-gradient-to-br from-blue-600 to-purple-700' : player.tier === 'Gold' ? 'bg-gradient-to-br from-amber-500 to-yellow-600' : 'bg-slate-700'}`}>
                        {player.primaryPosition}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{player.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{soldTeam?.name || '?'} · {player.tier}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-teko text-2xl font-black text-white leading-none">{player.ovr}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">OVR</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Franchise Squad Preview (FUT Cards) */}
          {teams.slice(0, 2).map(team => (
            <div key={team.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-2xl">
                  {team.logo || '⚽'}
                </div>
                <div>
                  <h3 className="font-teko text-2xl font-bold text-white leading-none">{team.name}</h3>
                  <p className="text-xs text-slate-400">{team.roster?.length || 0} players signed</p>
                </div>
              </div>
              {team.roster?.length > 0 ? (
                <div className="flex flex-wrap gap-3 justify-center">
                  {(team.roster || []).slice(0, 4).map(player => (
                    <FutPlayerCard key={player.id} player={player} size="small" isSold={true} soldPrice={player.soldPrice} soldTeamName={team.name} />
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs text-center py-4">No signed players yet.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
