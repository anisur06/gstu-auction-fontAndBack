import React, { useState, useEffect } from 'react';
import {
  Trophy, Shield, Users, Radio, Settings, UserCheck, ChevronRight, LogOut, Crown, Eye,
  Menu, X, LayoutDashboard, UserPlus, Coins, Tv, Award, Sliders, ChevronLeft
} from 'lucide-react';

const TAB_CONFIG = {
  landing: { label: 'Home', shortLabel: 'Home', icon: LayoutDashboard },
  register: { label: 'Player Registration', shortLabel: 'Registration', icon: UserPlus },
  superadmin: { label: 'Admin Dashboard', shortLabel: 'Admin', icon: Settings },
  podium: { label: 'Podium Auctioneer', shortLabel: 'Podium', icon: Radio },
  bidding: { label: 'Team Bidding', shortLabel: 'Bidding', icon: Coins },
  myTeam: { label: 'My Team', shortLabel: 'My Team', icon: Users },
  myProfile: { label: 'My Profile', shortLabel: 'Profile', icon: UserCheck },
  unallocated: { label: 'Unallocated Players', shortLabel: 'Unallocated', icon: Trophy },
  spectator: { label: 'Live Podium', shortLabel: 'Live', icon: Tv },
  tournament: { label: 'Tournament Standings', shortLabel: 'Standings', icon: Award },
  management: { label: 'Management Console', shortLabel: 'Management', icon: Sliders }
};

const ROLE_DISPLAY = {
  super_admin: { label: 'Super Admin', icon: Settings, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  auctioneer: { label: 'Auctioneer', icon: Radio, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  public_podium: { label: 'Public Podium', icon: Trophy, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  manager: { label: 'Manager', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  team_captain: { label: 'Team Captain', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  player: { label: 'Player', icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' }
};

export default function Navbar({ user, onLogout, onUserUpdate, activeTab, setActiveTab, systemPhase, allowedTabs = [], isCollapsed, setIsCollapsed }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  const getPhaseBadge = (phase) => {
    switch (phase) {
      case 'SETUP':
        return { label: 'Phase 1: Pre-Event Setup', shortLabel: 'Setup', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'REGISTRATION':
        return { label: 'Phase 2: Player Registration', shortLabel: 'Reg', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'AUCTION':
        return { label: 'Phase 3: Live Podium Auction', shortLabel: 'Live', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse' };
      case 'TOURNAMENT':
        return { label: 'Phase 4: Tournament Live', shortLabel: 'Tourney', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { label: 'Setup', shortLabel: 'Setup', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const normalizedRole = user?.role?.toLowerCase();
  const badge = getPhaseBadge(systemPhase);
  const roleInfo = ROLE_DISPLAY[normalizedRole] || ROLE_DISPLAY.viewer;
  const RoleIcon = roleInfo.icon;
  const isViewerRole = normalizedRole === 'viewer';

  const visibleTabs = allowedTabs
    .filter(tab => TAB_CONFIG[tab])
    .map(tab => ({ id: tab, ...TAB_CONFIG[tab] }));

  const showUserFooter = Boolean(user && normalizedRole && !isViewerRole);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/80 text-white select-none">
      {/* Brand Header */}
      <div className={`p-4 flex items-center justify-between border-b border-slate-900 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-3 cursor-pointer overflow-hidden" onClick={() => setActiveTab('landing')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30 shrink-0">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 transition-opacity duration-300">
              <span className="font-teko text-xl font-bold tracking-wide text-white block truncate leading-none">
                GSTU LEAGUE
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Auction & Tournament</span>
            </div>
          )}
        </div>
        
        {/* Toggle Collapse Button on Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Phase Badge */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-slate-900/60">
          <div className={`text-[10px] uppercase font-bold text-center px-2 py-1 rounded-lg border ${badge.color}`}>
            {badge.label}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {visibleTabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {!isCollapsed && <span className="truncate">{tab.label}</span>}

              {/* Hover Tooltip when Collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs font-bold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-800 shadow-xl">
                  {tab.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile & Action Footer */}
      {showUserFooter && (
      <div className="p-3 border-t border-slate-900/80 bg-slate-950/40 space-y-2">
        {/* User Info */}
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-900/80 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`w-8 h-8 rounded-lg bg-slate-850 flex items-center justify-center border text-xs font-bold text-slate-300 shrink-0 ${roleInfo.bg.split(' ')[1]}`}>
            <RoleIcon className={`w-4 h-4 ${roleInfo.color}`} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate" title={user?.fullName || user?.email}>
                {user?.fullName || user?.email?.split('@')[0]}
              </p>
              <p className={`text-[10px] font-bold ${roleInfo.color}`}>
                {roleInfo.label}
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 text-xs font-semibold transition-all group ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-red-400" />
          {!isCollapsed && <span>Sign Out</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-red-950 text-red-400 text-xs font-bold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-red-500/20 shadow-xl">
              Sign Out
            </div>
          )}
        </button>
      </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden md:block fixed inset-y-0 left-0 z-40 transition-all duration-300 shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-50 h-16 bg-slate-950 border-b border-slate-900 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-teko text-lg font-bold tracking-wide text-white uppercase">
            GSTU LEAGUE
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border scale-90 ${badge.color}`}>
            {badge.shortLabel}
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay background */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-64 max-w-xs h-full bg-slate-950 animate-slide-in shadow-2xl">
            {/* Close Button Inside Drawer */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
