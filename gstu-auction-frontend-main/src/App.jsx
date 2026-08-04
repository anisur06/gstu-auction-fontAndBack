import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { apiFetch, SOCKET_BASE } from './api';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import PlayerRegistration from './pages/PlayerRegistration';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PodiumAuctioneer from './pages/PodiumAuctioneer';
import TeamManagerBidding from './pages/TeamManagerBidding';
import LivePodiumSpectator from './pages/LivePodiumSpectator';
import TournamentDashboard from './pages/TournamentDashboard';
import MyTeam from './pages/MyTeam';
import MyProfile from './pages/MyProfile';
import UnallocatedPlayers from './pages/UnallocatedPlayers';
import ManagementConsole from './pages/ManagementConsole';

// Determine Socket.IO base (use Vite env `VITE_SOCKET_URL` or `VITE_API_URL` or fallback to backend host in production)
const socketBase = SOCKET_BASE || (import.meta.env.PROD ? 'https://gstu-auction-backend.onrender.com' : window.location.origin);
// Singleton Socket.IO client connection
const socket = io(socketBase, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

// Role → allowed tabs mapping
const ROLE_TABS = {
  super_admin: ['superadmin', 'management', 'tournament', 'landing'],
  auctioneer: ['podium', 'unallocated', 'management', 'tournament', 'landing'],
  public_podium: ['spectator', 'tournament', 'landing'],
  manager: ['management', 'myProfile', 'myTeam', 'bidding', 'spectator', 'landing'],
  team_captain: ['myProfile', 'myTeam', 'bidding', 'spectator', 'landing'],
  player: ['myProfile', 'myTeam', 'spectator', 'landing'],
  viewer: ['spectator', 'tournament', 'landing']
};

// Role → default landing tab after login
const ROLE_DEFAULT_TAB = {
  super_admin: 'superadmin',
  auctioneer: 'unallocated',
  public_podium: 'spectator',
  manager: 'myProfile',
  team_captain: 'myProfile',
  player: 'myProfile',
  viewer: 'spectator'
};

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [activeTab, setActiveTab] = useState('landing');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authOverlay, setAuthOverlay] = useState(false);
  const currentRole = user?.role?.toLowerCase() || 'viewer';

  // Realtime state from backend via Socket.IO
  const [systemState, setSystemState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [auctionLedger, setAuctionLedger] = useState([]);
  const [connected, setConnected] = useState(socket.connected);
  const [nukeFlash, setNukeFlash] = useState(false);

  // Check stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('gstu_auth_token');
    const storedUser = localStorage.getItem('gstu_auth_user');

    if (storedToken && storedUser) {
      // Validate token with backend
      apiFetch('/api/v1/auth/me', {
        headers: { 'x-auth-token': storedToken }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            const fullUser = { ...data.user, token: storedToken };
            setUser(fullUser);
            localStorage.setItem('gstu_auth_user', JSON.stringify(fullUser));
            setActiveTab(ROLE_DEFAULT_TAB[data.user.role] || 'landing');
          } else {
            // Token expired/invalid
            localStorage.removeItem('gstu_auth_token');
            localStorage.removeItem('gstu_auth_user');
          }
          setAuthChecked(true);
        })
        .catch(() => {
          // Backend might be down — still try with stored user data
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setActiveTab(ROLE_DEFAULT_TAB[parsed.role] || 'landing');
          } catch {
            localStorage.removeItem('gstu_auth_token');
            localStorage.removeItem('gstu_auth_user');
          }
          setAuthChecked(true);
        });
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleLoginSuccess = useCallback((userData) => {
    setUser(userData);
    setActiveTab(ROLE_DEFAULT_TAB[userData.role] || 'landing');
  }, []);

  const handleLogout = useCallback(() => {
    const token = localStorage.getItem('gstu_auth_token');
    if (token) {
      apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'x-auth-token': token }
      }).catch(() => {});
    }
    localStorage.removeItem('gstu_auth_token');
    localStorage.removeItem('gstu_auth_user');
    setUser(null);
    setActiveTab('landing');
  }, []);

  const handlePushToPodium = useCallback((playerId) => {
    if (!socket || !playerId) return;
    socket.emit('podium:set_player', { playerId });
    setActiveTab('podium');
  }, []);

  // Ensure the active tab is allowed for the current role
  const handleSetActiveTab = useCallback((tab) => {
    const allowed = ROLE_TABS[currentRole] || ROLE_TABS.viewer;
    if (allowed.includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab(allowed[0] || 'landing');
    }
  }, [currentRole]);

  const refetchState = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/system/state');
      const data = await res.json();
      if (data.success) setSystemState(data.data);
    } catch (e) {
      console.warn('Failed to refetch state:', e);
    }
  }, []);

  const refetchPlayers = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/players');
      const data = await res.json();
      if (data.success) setPlayers(data.data);
    } catch (e) {
      console.warn('Failed to refetch players:', e);
    }
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      refetchState();
      refetchPlayers();
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('state:sync', (state) => setSystemState(state));
    socket.on('players:sync', (p) => setPlayers(p));
    socket.on('teams:sync', (t) => setTeams(t));
    socket.on('ledger:sync', (l) => setAuctionLedger(l));

    socket.on('nuke:executed', () => {
      setNukeFlash(true);
      setTimeout(() => setNukeFlash(false), 3000);
      handleSetActiveTab('landing');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('state:sync');
      socket.off('players:sync');
      socket.off('teams:sync');
      socket.off('ledger:sync');
      socket.off('nuke:executed');
    };
  }, [refetchState, handleSetActiveTab]);

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading GSTU Football League...</p>
        </div>
      </div>
    );
  }

  // AUTH WALL — show login/register if not authenticated, but allow public spectator/tournament view
  if (!user && !['spectator', 'tournament'].includes(activeTab)) {
    return (
      <>
        <LandingPage
          systemState={systemState}
          setActiveTab={(tab) => {
            if (tab === 'register') {
              setAuthOverlay(true);
              return;
            }
            if (['spectator', 'tournament'].includes(tab)) {
              setActiveTab(tab);
            }
          }}
          players={players}
          teams={teams}
          onRequestAuth={() => setAuthOverlay(true)}
        />
        {authOverlay && (
          <div className="fixed inset-0 z-[1000] overflow-y-auto flex items-start sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <AuthPage
              onLoginSuccess={(userData) => {
                handleLoginSuccess(userData);
                setAuthOverlay(false);
              }}
              onClose={() => setAuthOverlay(false)}
            />
          </div>
        )}
      </>
    );
  }

  const allowedTabs = ROLE_TABS[currentRole] || ROLE_TABS.viewer;

  const renderPage = () => {
    // Safety check: if current tab isn't allowed, go to first allowed
    const tab = allowedTabs.includes(activeTab) ? activeTab : allowedTabs[0];

    switch (tab) {
      case 'landing':
        return <LandingPage systemState={systemState} setActiveTab={handleSetActiveTab} players={players} teams={teams} onRequestAuth={() => setAuthOverlay(true)} />;
      case 'register':
        return <PlayerRegistration systemState={systemState} user={user} players={players} onPlayerRegistered={() => {
          refetchState();
          refetchPlayers();
        }} />;
      case 'superadmin':
        return <SuperAdminDashboard systemState={systemState} onStateUpdated={refetchState} players={players} teams={teams} />;
      case 'podium':
        return <PodiumAuctioneer socket={socket} systemState={systemState} players={players} teams={teams} auctionLedger={auctionLedger} />;
      case 'bidding':
        return <TeamManagerBidding socket={socket} systemState={systemState} players={players} teams={teams} auctionLedger={auctionLedger} />;
      case 'myTeam':
        return <MyTeam user={user} players={players} teams={teams} />;
      case 'myProfile':
        return <MyProfile user={user} onUserUpdate={setUser} />;
      case 'spectator':
        return <LivePodiumSpectator socket={socket} systemState={systemState} players={players} teams={teams} auctionLedger={auctionLedger} />;
      case 'tournament':
        return <TournamentDashboard systemState={systemState} teams={teams} players={players} />;
      case 'unallocated':
        return <UnallocatedPlayers players={players} systemState={systemState} onPushToPodium={handlePushToPodium} />;
      case 'management':
        return <ManagementConsole user={user} players={players} teams={teams} systemState={systemState} />;
      default:
        return <LandingPage systemState={systemState} setActiveTab={handleSetActiveTab} players={players} teams={teams} onRequestAuth={() => setAuthOverlay(true)} />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 transition-colors duration-500 ${nukeFlash ? 'bg-red-950' : ''}`}>
      {/* Connection Status Banner */}
      {!connected && (
        <div className="bg-red-600/90 text-white text-center text-xs font-bold py-1.5 tracking-wider">
          ⚡ Connecting to GSTU Football League Live Server...
        </div>
      )}

      {/* Nuke Flash Banner */}
      {nukeFlash && (
        <div className="bg-red-600 text-white text-center text-sm font-bold py-3 tracking-wider animate-pulse border-b border-red-400">
          💥 LIFECYCLE RESET (NUKE) EXECUTED — Database & Cloud Storage Cleared!
        </div>
      )}

      <Navbar
        user={user}
        onLogout={handleLogout}
        onUserUpdate={setUser}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        systemPhase={systemState?.phase || 'SETUP'}
        allowedTabs={allowedTabs}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className={`pb-16 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        {renderPage()}
      </main>

      {/* Socket connection badge */}
      <div className={`fixed bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-lg z-50 transition-all ${
        connected ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-400' : 'bg-slate-900/90 border-slate-700 text-slate-500'
      }`}>
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        {connected ? 'Live — Real-Time Sync Active' : 'Offline'}
      </div>
    </div>
  );
}
