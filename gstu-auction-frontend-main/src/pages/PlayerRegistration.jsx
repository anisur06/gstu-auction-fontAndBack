import React, { useState } from 'react';
import { apiFetch, apiUrl } from '../api';
import FutPlayerCard from '../components/FutPlayerCard';
import { User, Shield, Sparkles, Upload, AlertCircle, CheckCircle } from 'lucide-react';

const emptyFormState = {
  name: '',
  studentId: '',
  session: '2023-2024',
  jerseyName: '',
  primaryPosition: 'ST',
  secondaryPositions: [],
  ovr: 75,
  tier: 'Silver',
  stats: {
    pac: 75,
    pas: 75,
    sho: 75,
    def: 75,
    dri: 75,
    phy: 75
  },
  imageUrl: ''
};

export default function PlayerRegistration({ systemState, user, players = [], onPlayerRegistered }) {
  const isLocked = systemState?.phase === 'AUCTION' || systemState?.phase === 'TOURNAMENT';

  // Check if player is already registered in the draft pool
  const registeredPlayer = user?.role === 'player'
    ? players.find(p => p.studentId === user.studentId)
    : null;

  const [formData, setFormData] = useState(() => ({
    ...emptyFormState,
    name: user?.fullName || '',
    studentId: user?.studentId || '',
    jerseyName: user?.jerseyName || '',
    jerseyNo: user?.jerseyNo || '',
    primaryPosition: user?.preferredPosition || 'ST',
    session: user?.session || '2024-2025'
  }));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isGk = formData.primaryPosition === 'GK';

  // Handle position toggle
  const handlePrimaryPosChange = (pos) => {
    setFormData(prev => ({
      ...prev,
      primaryPosition: pos,
      stats: pos === 'GK'
        ? { div: 75, ref: 75, han: 75, spd: 75, kic: 75, pos: 75 }
        : { pac: 75, pas: 75, sho: 75, def: 70, dri: 75, phy: 75 }
    }));
  };

  // Cloudinary Direct Unsigned Upload Simulation / File Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('upload_preset', 'gstu_players');

      const cloudinaryUpload = apiUrl('https://api.cloudinary.com/v1_1/gstu-hackathon-demo/image/upload');
      const res = await fetch(cloudinaryUpload, {
        method: 'POST',
        body: uploadData
      });

      const data = await res.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, imageUrl: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked || submitting) return;

    if (!formData.name.trim() || !formData.studentId.trim() || !formData.jerseyName.trim()) {
      setErrorMsg('Please fill in all required fields (Name, Student ID, Jersey Name).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/v1/players/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('gstu_auth_token')
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        const registeredName = formData.name;
        setSuccessMsg(`Player ${registeredName} successfully registered for the League!`);
        setErrorMsg('');
        setFormData(emptyFormState);
        if (onPlayerRegistered) onPlayerRegistered(data.player);
      } else {
        setErrorMsg(data.error || 'Failed to register player.');
      }
    } catch (err) {
      setErrorMsg('Network error submitting player registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredPlayer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl w-full max-w-md flex flex-col items-center text-center space-y-6">
          <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-xs uppercase tracking-widest inline-flex items-center gap-1.5 animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Registered Profile
          </span>
          <FutPlayerCard player={registeredPlayer} size="large" />
          <div className="text-center space-y-2">
            <h2 className="font-teko text-4xl font-bold text-white uppercase">{registeredPlayer.name}</h2>
            <p className="text-xs text-slate-400">Position: <strong className="text-slate-200">{registeredPlayer.primaryPosition}</strong> | Tier: <strong className="text-amber-400">{registeredPlayer.tier}</strong></p>
            <p className="text-xs text-slate-400">Student ID: <strong className="text-slate-200">{registeredPlayer.studentId}</strong></p>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-semibold mt-2">
              Your profile is verified and active in the live franchise draft pool.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-xs rounded-full uppercase tracking-wider">
                Module 1: Registration Portal
              </span>
              {isLocked && (
                <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-full uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Registration Frozen
                </span>
              )}
            </div>
            <h1 className="font-teko text-4xl sm:text-5xl font-bold tracking-tight text-white uppercase">
              PLAYER REGISTRATION & FUT CARD BUILDER
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Register your player profile with overall ratings, stats, and custom Cloudinary photo upload to generate your official EA FC FUT shield card.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Allocated Tier</span>
              <span className="font-teko text-2xl font-bold text-amber-400">{formData.tier}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Overall OVR</span>
              <span className="font-teko text-2xl font-bold text-blue-400">{formData.ovr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Live Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Basic Information */}
            <div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" /> Basic Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Full Name</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Student ID</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Academic Session (Dynamic)</label>
                  <select
                    value={formData.session}
                    disabled={isLocked}
                    onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {(systemState?.academicSessions || ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025']).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Jersey Name & No.</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    value={formData.jerseyName}
                    onChange={(e) => setFormData({ ...formData, jerseyName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Position & Tier Selection */}
            <div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" /> Playing Position & Tier
              </h2>

              <div className="mb-4">
                <label className="text-xs text-slate-400 font-semibold mb-2 block">Primary Position (Select Exactly One)</label>
                <div className="flex flex-wrap gap-2">
                  {['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'].map(pos => (
                    <button
                      key={pos}
                      type="button"
                      disabled={isLocked}
                      onClick={() => handlePrimaryPosChange(pos)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        formData.primaryPosition === pos
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Player Tier Category</label>
                  <select
                    value={formData.tier}
                    disabled={isLocked}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="Platinum">Platinum (Base: $15,000,000)</option>
                    <option value="Gold">Gold (Base: $10,000,000)</option>
                    <option value="Silver">Silver (Base: $5,000,000)</option>
                    <option value="Bronze">Bronze (Base: $2,000,000)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Overall Rating (OVR: 40-99)</label>
                  <input
                    type="number"
                    min="40"
                    max="99"
                    disabled={isLocked}
                    value={formData.ovr}
                    onChange={(e) => setFormData({ ...formData, ovr: parseInt(e.target.value || '75', 10) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Player Statistics Input */}
            <div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" /> EA FC FUT Card Statistics ({isGk ? 'Goalkeeper' : 'Outfielder'})
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {isGk ? (
                  <>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">DIV (Diving)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.div || 85}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, div: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">REF (Reflexes)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.ref || 88}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, ref: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">HAN (Handling)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.han || 84}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, han: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">SPD (Speed)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.spd || 78}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, spd: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">KIC (Kicking)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.kic || 82}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, kic: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">POS (Positioning)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.pos || 85}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, pos: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">PAC (Pace)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.pac || 84}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, pac: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">PAS (Passing)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.pas || 82}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, pas: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">SHO (Shooting)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.sho || 88}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, sho: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">DEF (Defending)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.def || 72}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, def: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">DRI (Dribbling)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.dri || 87}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, dri: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">PHY (Physicality)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        disabled={isLocked}
                        value={formData.stats.phy || 85}
                        onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, phy: parseInt(e.target.value, 10) } })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 4: Cloudinary Image Upload */}
            <div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" /> Cloud Media Photo (Cloudinary)
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Upload a photo to Cloudinary or paste a direct image URL. If omitted, card displays the vector man avatar.
              </p>

              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  disabled={isLocked || uploading}
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50"
                />

                <input
                  type="url"
                  placeholder="Or paste direct Cloudinary photo URL (https://res.cloudinary.com/...)"
                  disabled={isLocked}
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-teko text-2xl font-bold rounded-2xl shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLocked ? 'REGISTRATION FROZEN' : 'SUBMIT REGISTRATION & GENERATE FUT CARD'}
            </button>
          </form>
        </div>

        {/* Right Column: Live FUT Card Preview */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-6">
          <div className="sticky top-24 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl w-full flex flex-col items-center text-center">
            <span className="px-4 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-bold text-xs uppercase tracking-widest mb-6 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> LIVE FUT CARD PREVIEW
            </span>

            {/* Real-time rendering of EA FC FUT card matching form inputs */}
            <FutPlayerCard player={formData} size="large" />

            <div className="mt-6 text-xs text-slate-400 max-w-xs space-y-1">
              <p><strong className="text-slate-200">Position:</strong> {formData.primaryPosition}</p>
              <p><strong className="text-slate-200">Tier Base Price:</strong> ${formData.tier === 'Platinum' ? '15,000,000' : formData.tier === 'Gold' ? '10,000,000' : formData.tier === 'Silver' ? '5,000,000' : '2,000,000'}</p>
              <p><strong className="text-slate-200">Media Avatar:</strong> {formData.imageUrl ? 'Uploaded Photo' : 'Vector Man Avatar (Default)'}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
