import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Clock, Camera, Timer } from 'lucide-react';
import { settingsApi } from '../../services';
import { toast } from 'react-hot-toast';

export default function SettingsTab({ companyId }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    shiftStart: '09:00',
    shiftEnd: '18:00',
    workingHoursPerDay: 8,
    screenshotInterval: 60,     // seconds
    idleThreshold: 300,         // seconds
    timezone: 'UTC',
    allowManualTime: false,
    requireApprovalForOvertime: true,
  });

  useEffect(() => {
    if (companyId) fetchSettings();
  }, [companyId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.get(companyId);
      const s = res.data?.data?.settings || res.data?.settings || res.settings;
      if (s) {
        setSettings({
          shiftStart: s.shiftStart || '09:00',
          shiftEnd: s.shiftEnd || '18:00',
          workingHoursPerDay: s.workingHoursPerDay || 8,
          screenshotInterval: s.screenshotInterval || 60,
          idleThreshold: s.idleThreshold || 300,
          timezone: s.timezone || 'UTC',
          allowManualTime: Boolean(s.allowManualTime),
          requireApprovalForOvertime: s.requireApprovalForOvertime !== false,
        });
      }
    } catch (err) {
      toast.error('Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update(companyId, {
        shiftStart: settings.shiftStart,
        shiftEnd: settings.shiftEnd,
        workingHoursPerDay: settings.workingHoursPerDay,
        screenshotInterval: settings.screenshotInterval,
        idleThreshold: settings.idleThreshold,
        timezone: settings.timezone,
      });
      toast.success('Settings saved! Desktop agents will pick up the new config on next session start.');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg focus:border-indigo-500 focus:outline-none transition';
  const labelClass = 'block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Company Configuration & Policies</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Configure tracking preferences, working hours, and security rules. Desktop agents fetch these settings on every session start.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[var(--text-muted)]">Loading settings...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Work Schedule */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Standard Working Hours</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Shift Start Time</label>
                <input
                  type="time"
                  value={settings.shiftStart}
                  onChange={(e) => setSettings({ ...settings, shiftStart: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Shift End Time</label>
                <input
                  type="time"
                  value={settings.shiftEnd}
                  onChange={(e) => setSettings({ ...settings, shiftEnd: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Working Hours / Day</label>
                <select
                  value={settings.workingHoursPerDay}
                  onChange={(e) => setSettings({ ...settings, workingHoursPerDay: Number(e.target.value) })}
                  className={inputClass}
                >
                  {[6, 7, 8, 9, 10, 12].map(h => (
                    <option key={h} value={h}>{h} Hours</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Desktop Agent Tracking Config */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-lg space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Desktop Agent Configuration</h3>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] -mt-3">
              These settings control the employee desktop tracking agent. Changes take effect on the next session start — no agent restart needed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Screenshot Interval */}
              <div className="p-4 bg-[var(--bg-card-alt)] rounded-xl border border-[var(--border-base)]">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  <h4 className="text-xs font-bold text-white uppercase">Screenshot Interval</h4>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mb-3">How often the agent captures a screenshot of the employee's screen.</p>
                <select
                  value={settings.screenshotInterval}
                  onChange={(e) => setSettings({ ...settings, screenshotInterval: Number(e.target.value) })}
                  className={inputClass}
                >
                  <option value={30}>Every 30 Seconds</option>
                  <option value={60}>Every 1 Minute</option>
                  <option value={120}>Every 2 Minutes</option>
                  <option value={180}>Every 3 Minutes</option>
                  <option value={300}>Every 5 Minutes</option>
                  <option value={600}>Every 10 Minutes</option>
                  <option value={900}>Every 15 Minutes</option>
                </select>
                <p className="text-[9px] text-[var(--text-muted)] mt-2 font-mono">
                  Current: {settings.screenshotInterval}s ({Math.round(settings.screenshotInterval / 60)} min)
                </p>
              </div>

              {/* Idle Threshold */}
              <div className="p-4 bg-[var(--bg-card-alt)] rounded-xl border border-[var(--border-base)]">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase">Idle Timeout Threshold</h4>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mb-3">After this duration of zero keyboard/mouse input, the agent forces the window open and requires a reason from the employee.</p>
                <select
                  value={settings.idleThreshold}
                  onChange={(e) => setSettings({ ...settings, idleThreshold: Number(e.target.value) })}
                  className={inputClass}
                >
                  <option value={10}>10 Seconds (Test/Debug)</option>
                  <option value={60}>1 Minute (Strict)</option>
                  <option value={120}>2 Minutes</option>
                  <option value={180}>3 Minutes</option>
                  <option value={300}>5 Minutes (Default)</option>
                  <option value={600}>10 Minutes</option>
                  <option value={900}>15 Minutes (Relaxed)</option>
                </select>
                <p className="text-[9px] text-[var(--text-muted)] mt-2 font-mono">
                  Current: {settings.idleThreshold}s {settings.idleThreshold >= 60 ? `(${Math.round(settings.idleThreshold / 60)} min)` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Policies */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Policy & Approvals</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--bg-card-alt)] rounded-xl border border-[var(--border-base)]">
                <div>
                  <h4 className="text-xs font-bold text-white">Allow Manual Time Entries</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Permit staff to manually log off-screen work hours.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowManualTime}
                  onChange={(e) => setSettings({ ...settings, allowManualTime: e.target.checked })}
                  className="rounded border-[var(--border-muted)] text-indigo-600 bg-[var(--bg-card-alt)] w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--bg-card-alt)] rounded-xl border border-[var(--border-base)]">
                <div>
                  <h4 className="text-xs font-bold text-white">Require Overtime Approval</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Require manager review for work beyond standard shift hours.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireApprovalForOvertime}
                  onChange={(e) => setSettings({ ...settings, requireApprovalForOvertime: e.target.checked })}
                  className="rounded border-[var(--border-muted)] text-indigo-600 bg-[var(--bg-card-alt)] w-4 h-4"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 uppercase tracking-wider"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}
