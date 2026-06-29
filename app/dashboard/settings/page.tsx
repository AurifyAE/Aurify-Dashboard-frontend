'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/context/AuthContext';
import { Save, Lock, User, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axiosInstance from '@/app/axios/axiosInstance';

export default function SettingsPage() {
  const { user, login } = useAuth(); // login function in auth context might need token to be re-set

  const [form, setForm] = useState({
    companyName: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        companyName: user.companyName || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessageType('error');
      setMessage('New passwords do not match.');
      return;
    }

    if (form.newPassword && !form.currentPassword) {
      setMessageType('error');
      setMessage('Current password is required to set a new password.');
      return;
    }

    setSaving(true);
    try {
      const response = await axiosInstance.put('/auth/profile', {
        companyName: form.companyName,
        phone: form.phone,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      if (response.data.success) {
        setMessageType('success');
        setMessage('Profile updated successfully!');

        // Update local storage token if returned
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          // Optional: we might need to force AuthContext to re-fetch or use returned user
        }

        // clear password fields
        setForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }
    } catch (err: any) {
      setMessageType('error');
      setMessage(
        err.response?.data?.message ||
          err.response?.data?.errors?.password ||
          'Failed to update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all';
  const labelClass = 'block mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your personal details, company name, and password.
          </p>
        </div>

        {message && (
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              messageType === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 mb-4">
              <User className="h-5 w-5 text-blue-500" />
              General Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Email Address</label>
                <input
                  className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
                  value={user?.email || ''}
                  disabled
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Email address cannot be changed.
                </p>
              </div>

              <div>
                <label className={labelClass}>Company / Full Name</label>
                <input
                  className={inputClass}
                  placeholder="Your Company Name"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className={`${inputClass} pl-10`}
                    placeholder="+971..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 mb-4">
              <Lock className="h-5 w-5 text-amber-500" />
              Change Password
            </h2>
            <p className="text-sm text-slate-500 -mt-2">
              Leave password fields blank if you do not wish to change your password.
            </p>

            <div className="space-y-4 max-w-md">
              <div>
                <label className={labelClass}>Current Password</label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="Enter current password"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="Minimum 8 characters"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  minLength={8}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm New Password</label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
