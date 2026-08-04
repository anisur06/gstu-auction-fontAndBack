import React from 'react';

/**
 * EA FC / FIFA FUT Style Shield Player Card Component
 * Exactly matches the user's provided reference image design.
 */
export default function FutPlayerCard({ player, size = 'normal', isSold = false, soldPrice = 0, soldTeamName = '' }) {
  if (!player) return null;

  const {
    name = 'PLAYER NAME',
    primaryPosition = 'ST',
    ovr = 85,
    tier = 'Gold',
    stats = {},
    imageUrl = ''
  } = player;

  const isGk = primaryPosition === 'GK';

  // Tier Theme Colors & Metallic Gradients
  const getTierTheme = (tierName) => {
    switch (tierName?.toLowerCase()) {
      case 'platinum':
        return {
          borderGradient: 'from-blue-400 via-indigo-500 to-purple-600',
          bgGradient: 'from-slate-900 via-slate-950 to-blue-950',
          bannerBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700',
          bannerText: 'text-white',
          glow: 'shadow-blue-500/30 border-blue-400/80',
          badgeColor: 'text-blue-400'
        };
      case 'gold':
        return {
          borderGradient: 'from-amber-300 via-yellow-500 to-amber-600',
          bgGradient: 'from-amber-950/40 via-slate-950 to-slate-900',
          bannerBg: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600',
          bannerText: 'text-slate-950',
          glow: 'shadow-yellow-500/30 border-amber-400/80',
          badgeColor: 'text-yellow-400'
        };
      case 'silver':
        return {
          borderGradient: 'from-slate-300 via-slate-400 to-slate-600',
          bgGradient: 'from-slate-900 via-slate-950 to-slate-900',
          bannerBg: 'bg-gradient-to-r from-slate-300 via-slate-200 to-slate-400',
          bannerText: 'text-slate-950',
          glow: 'shadow-slate-400/20 border-slate-300/80',
          badgeColor: 'text-slate-300'
        };
      default: // Bronze
        return {
          borderGradient: 'from-amber-700 via-orange-800 to-amber-900',
          bgGradient: 'from-amber-950/60 via-slate-950 to-slate-900',
          bannerBg: 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800',
          bannerText: 'text-amber-100',
          glow: 'shadow-amber-800/30 border-amber-700/80',
          badgeColor: 'text-amber-600'
        };
    }
  };

  const theme = getTierTheme(tier);

  // Scaled dimensions
  const scaleClasses = size === 'large' 
    ? 'w-72 h-[410px]' 
    : size === 'small' 
    ? 'w-48 h-[275px]' 
    : 'w-60 h-[345px]';

  return (
    <div className={`relative ${scaleClasses} transition-transform duration-300 hover:scale-105 group select-none`}>
      {/* Outer Glow & Metallic Border Container */}
      <div className={`w-full h-full p-[3px] bg-gradient-to-b ${theme.borderGradient} rounded-[32px] shadow-2xl ${theme.glow}`}>
        
        {/* Inner Card Background */}
        <div className={`w-full h-full bg-gradient-to-b ${theme.bgGradient} rounded-[29px] overflow-hidden flex flex-col justify-between relative p-3 border border-white/10`}>
          
          {/* Top Decorative Metallic Texture Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

          {/* --- TOP SECTION: POS, OVR, MAN SILHOUETTE AVATAR / UPLOADED PHOTO, BADGE --- */}
          <div className="relative z-10 flex justify-between items-start pt-1">
            {/* Position & OVR */}
            <div className="flex flex-col items-center leading-none pl-1">
              <span className="font-teko text-2xl font-bold uppercase tracking-tight text-white drop-shadow">
                {primaryPosition}
              </span>
              <span className="font-teko text-3xl font-extrabold tracking-tighter text-white drop-shadow-md -mt-1">
                {ovr}
              </span>
            </div>

            {/* Center Player Media: Uploaded Photo OR Vector Man Silhouette (Exact user match) */}
            <div className="flex-1 flex justify-center items-center h-28 relative overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={name}
                  className="h-full object-cover rounded-md drop-shadow-xl"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                /* Vector Silhouette of Man with Crossed Arms matching user reference image */
                <svg className="h-full text-slate-300/85 drop-shadow-lg" viewBox="0 0 100 120" fill="currentColor">
                  {/* Head */}
                  <circle cx="50" cy="22" r="14" fill="currentColor" />
                  {/* Neck */}
                  <path d="M43 34 h14 v6 h-14 z" fill="currentColor" />
                  {/* Shoulders & Upper Torso */}
                  <path d="M20 45 C 20 38, 30 38, 50 38 C 70 38, 80 38, 80 45 L 85 90 C 85 95, 75 100, 50 100 C 25 100, 15 95, 15 90 Z" fill="currentColor" opacity="0.9" />
                  {/* Crossed Arms Overlay Line details */}
                  <path d="M22 48 C 30 65, 70 65, 78 48 C 72 75, 28 75, 22 48 Z" fill="rgba(0,0,0,0.15)" />
                  <path d="M28 55 Q 50 78 72 55" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
                </svg>
              )}
            </div>

            {/* Top Right Emblem / Badge */}
            <div className="flex flex-col items-center pr-1 gap-1">
              {/* Shield Badge */}
              <div className="w-5 h-5 rounded-full bg-slate-950/80 border border-white/20 flex items-center justify-center shadow">
                <span className={`text-[10px] font-black ${theme.badgeColor}`}>A</span>
              </div>
            </div>
          </div>

          {/* --- MIDDLE SECTION: METALLIC NAME BANNER --- */}
          <div className={`relative z-10 w-full py-1 px-2 my-1.5 ${theme.bannerBg} rounded-md shadow-md flex items-center justify-center border border-white/20`}>
            <span className={`font-teko text-xl font-bold tracking-wider uppercase truncate ${theme.bannerText} drop-shadow-sm`}>
              {name}
            </span>
          </div>

          {/* --- BOTTOM SECTION: 6-STAT ATTRIBUTE GRID --- */}
          <div className="relative z-10 px-1 pb-1">
            {isGk ? (
              /* Goalkeeper Stats: DIV, REF, HAN, SPD, KIC, POS */
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">DIV</span>
                  <span className="font-teko text-lg font-bold">{stats.div || 85}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">REF</span>
                  <span className="font-teko text-lg font-bold">{stats.ref || 88}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">HAN</span>
                  <span className="font-teko text-lg font-bold">{stats.han || 84}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">SPD</span>
                  <span className="font-teko text-lg font-bold">{stats.spd || 78}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">KIC</span>
                  <span className="font-teko text-lg font-bold">{stats.kic || 82}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">POS</span>
                  <span className="font-teko text-lg font-bold">{stats.pos || 85}</span>
                </div>
              </div>
            ) : (
              /* Outfielder Stats: PAC, PAS, SHO, DEF, DRI, PHY */
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">PAC</span>
                  <span className="font-teko text-lg font-bold">{stats.pac || 82}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">PAS</span>
                  <span className="font-teko text-lg font-bold">{stats.pas || 80}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">SHO</span>
                  <span className="font-teko text-lg font-bold">{stats.sho || 84}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">DEF</span>
                  <span className="font-teko text-lg font-bold">{stats.def || 65}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">DRI</span>
                  <span className="font-teko text-lg font-bold">{stats.dri || 85}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">PHY</span>
                  <span className="font-teko text-lg font-bold">{stats.phy || 78}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sold Overlay Banner if applicable */}
          {isSold && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-2 text-center border border-emerald-500/50 rounded-[29px]">
              <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-teko text-2xl font-bold rounded-md shadow-lg uppercase tracking-wider mb-1">
                SOLD
              </span>
              <span className="text-xs text-emerald-300 font-semibold truncate max-w-full">
                {soldTeamName || 'Franchise'}
              </span>
              <span className="text-sm font-teko font-extrabold text-white">
                ${soldPrice ? soldPrice.toLocaleString() : '0'}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
