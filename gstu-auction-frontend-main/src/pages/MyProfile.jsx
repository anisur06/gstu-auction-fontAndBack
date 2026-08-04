import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { User, Shield, CheckCircle2, Loader2, Lock } from 'lucide-react';

export default function MyProfile({ user, onUserUpdate }) {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    jerseyName: '',
    jerseyNo: ''
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState({ message: '', type: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        jerseyName: user.jerseyName || '',
        jerseyNo: user.jerseyNo !== null && user.jerseyNo !== undefined ? String(user.jerseyNo) : ''
      });
    }
  }, [user]);

  const handleChange = (key, value) => setProfile(prev => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ message: '', type: '' });
    try {
      const res = await apiFetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('gstu_auth_token') || ''
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          jerseyName: profile.jerseyName,
          jerseyNo: profile.jerseyNo
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ message: 'Profile updated successfully.', type: 'success' });
        if (onUserUpdate) onUserUpdate(data.user);
      } else {
        setStatus({ message: data.error || 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      setStatus({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ message: '', type: '' });
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordStatus({ message: 'New passwords do not match.', type: 'error' });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await apiFetch('/api/v1/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('gstu_auth_token') || ''
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordStatus({ message: 'Password changed successfully.', type: 'success' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      } else {
        setPasswordStatus({ message: data.error || 'Failed to change password.', type: 'error' });
      }
    } catch (err) {
      setPasswordStatus({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl">
            <User className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 font-bold mb-2">My Profile</p>
            <h1 className="text-4xl font-teko font-bold text-white">Your Account Details</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">Update your details, jersey specifications, or change your password.</p>
          </div>
        </div>

        {status.message && (
          <div className={`rounded-2xl p-4 mb-6 text-sm font-medium ${status.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <label className="block text-sm text-slate-400 font-semibold">Full Name</label>
            <input
              type="text"
              required
              value={profile.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-5">
            <label className="block text-sm text-slate-400 font-semibold">Email Address</label>
            <input
              type="email"
              required
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-5">
            <label className="block text-sm text-slate-400 font-semibold">Mobile Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-5">
            <label className="block text-sm text-slate-400 font-semibold">Jersey Name</label>
            <input
              type="text"
              value={profile.jerseyName}
              onChange={(e) => handleChange('jerseyName', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-5 lg:col-span-2">
            <label className="block text-sm text-slate-400 font-semibold">Jersey Number</label>
            <input
              type="number"
              min="0"
              value={profile.jerseyNo}
              onChange={(e) => handleChange('jerseyNo', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <Shield className="w-4 h-4 text-slate-400" />
              Keep your team profile updated for seamless auction access.
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Save Profile</>}
            </button>
          </div>
        </form>

        <div className="mt-10 bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500 font-bold mb-2">Security</p>
              <h2 className="text-2xl font-bold text-white">Change Password</h2>
              <p className="text-slate-400 mt-2 max-w-2xl">Update your account password for extra security.</p>
            </div>
          </div>

          {passwordStatus.message && (
            <div className={`rounded-2xl p-4 mb-6 text-sm font-medium ${passwordStatus.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
              {passwordStatus.message}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="block text-sm text-slate-400 font-semibold">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm text-slate-400 font-semibold">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-slate-400 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-amber-400 transition-all disabled:opacity-70"
            >
              {savingPassword ? 'Saving password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
