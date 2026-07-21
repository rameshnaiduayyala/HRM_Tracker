import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Clock, Camera } from 'lucide-react';
import { settingsApi } from '../../services';
import { toast } from 'react-hot-toast';

export default function SettingsTab({ companyId }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    workHoursStart: '09:00',
    workHoursEnd: '18:00',
    screenshotIntervalMinutes: 10,
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
      if (res.data?.settings || res.settings) {
        const s = res.data?.settings || res.settings;
        setSettings({
          workHoursStart: s.workHoursStart || '09:00',
          workHoursEnd: s.workHoursEnd || '18:00',
          screenshotIntervalMinutes: s.screenshotIntervalMinutes || 10,
          allowManualTime: Boolean(s.allowManualTime),
          requireApprovalForOvertime: Boolean(s.requireApprovalForOvertime),
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
      await settingsApi.update(companyId, settings);
      toast.success('Company settings saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Company Configuration & Policies</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Configure tracking preferences, working hours, and security rules for your workspace</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Shift Start Time</label>
                <input
                  type="time"
                  value={settings.workHoursStart}
                  onChange={(e) => setSettings({ ...settings, workHoursStart: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Shift End Time</label>
                <input
                  type="time"
                  value={settings.workHoursEnd}
                  onChange={(e) => setSettings({ ...settings, workHoursEnd: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Desktop Tracking Settings */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tracking Agent Configuration</h3>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Screenshot Frequency (Minutes)</label>
              <select
                value={settings.screenshotIntervalMinutes}
                onChange={(e) => setSettings({ ...settings, screenshotIntervalMinutes: Number(e.target.value) })}
                className="w-full md:w-1/2 px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
              >
                <option value={5}>Every 5 Minutes</option>
                <option value={10}>Every 10 Minutes</option>
                <option value={15}>Every 15 Minutes</option>
                <option value={30}>Every 30 Minutes</option>
              </select>
            </div>
          </div>

          {/* Section 3: Time Logging Policies */}
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




