import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Clock, Camera, Timer, Building, Upload, MapPin, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { settingsApi, companyApi, departmentApi } from '../../services';
import { toast } from 'react-hot-toast';

export default function SettingsTab({ companyId, onSettingsSaved }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyDetails, setCompanyDetails] = useState({
    name: '',
    logoUrl: '',
  });
  const [logoPreview, setLogoPreview] = useState('');
  
  // Company Branches State (CRUD)
  const [branches, setBranches] = useState([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');

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
    if (companyId) {
      fetchSettings();
      fetchCompanyDetails();
      fetchBranches();
    }
  }, [companyId]);

  const fetchBranches = async () => {
    try {
      const res = await companyApi.list();
      const list = res.data?.companies || res.companies || [];
      setBranches(list);
    } catch (err) {
      console.error('Failed to fetch company branches:', err);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    try {
      await companyApi.create(newBranchName.trim());
      toast.success(`Company Branch "${newBranchName}" created successfully.`);
      setNewBranchName('');
      fetchBranches();
      if (onSettingsSaved) onSettingsSaved();
    } catch (err) {
      toast.error(err.message || 'Failed to add company branch.');
    }
  };

  const handleUpdateBranch = async (id) => {
    if (!editBranchName.trim()) return;
    try {
      await companyApi.update(id, { name: editBranchName.trim() });
      toast.success('Company Branch updated.');
      setEditingBranchId(null);
      fetchBranches();
      if (onSettingsSaved) onSettingsSaved();
    } catch (err) {
      toast.error('Failed to update branch.');
    }
  };

  const handleDeleteBranch = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete branch "${name}"?`)) return;
    try {
      await companyApi.delete(id);
      toast.success('Company Branch deleted.');
      fetchBranches();
      if (onSettingsSaved) onSettingsSaved();
    } catch (err) {
      toast.error('Failed to delete branch.');
    }
  };

  const fetchCompanyDetails = async () => {
    try {
      const res = await companyApi.get(companyId);
      const c = res.data?.company || res.data || res;
      if (c) {
        setCompanyDetails({
          name: c.name || '',
          logoUrl: c.logoUrl || c.logo || '',
        });
        setLogoPreview(c.logoUrl || c.logo || '');
      }
    } catch (err) {
      console.error('Failed to fetch company details:', err);
    }
  };

  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const handleLogoFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Logo file size must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyCrop = async () => {
    if (!rawImageSrc) return;
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const TARGET_WIDTH = 200;
      const TARGET_HEIGHT = 48;
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      const drawWidth = img.width * zoom;
      const drawHeight = img.height * zoom;
      const drawX = (TARGET_WIDTH - drawWidth) / 2 + pan.x;
      const drawY = (TARGET_HEIGHT - drawHeight) / 2 + pan.y;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      const croppedBase64 = canvas.toDataURL('image/png');
      setLogoPreview(croppedBase64);
      setCompanyDetails(prev => ({ ...prev, logoUrl: croppedBase64 }));
      setCropModalOpen(false);

      // Instantly upload cropped logo to backend
      try {
        const base64Data = croppedBase64.split(',')[1] || croppedBase64;
        await companyApi.uploadLogo(companyId, base64Data);
        toast.success('Cropped logo saved & updated!');
        if (onSettingsSaved) {
          onSettingsSaved();
        }
      } catch (err) {
        toast.error('Failed to save cropped logo to server');
      }
    };
    img.src = rawImageSrc;
  };

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
      console.warn('Tracking settings not initialized yet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Save Company Profile (Name & Logo)
      if (companyDetails.name) {
        await companyApi.update(companyId, { name: companyDetails.name });
      }
      if (logoPreview && logoPreview.startsWith('data:')) {
        const base64Data = logoPreview.split(',')[1] || logoPreview;
        await companyApi.uploadLogo(companyId, base64Data);
      }

      // 2. Save Tracking & Policy Settings
      try {
        await settingsApi.update(companyId, {
          shiftStart: settings.shiftStart,
          shiftEnd: settings.shiftEnd,
          workingHoursPerDay: settings.workingHoursPerDay,
          screenshotInterval: settings.screenshotInterval,
          idleThreshold: settings.idleThreshold,
          timezone: settings.timezone,
        });
      } catch (settingsErr) {
        console.warn('Settings API update warning:', settingsErr);
      }

      toast.success('Company profile & configuration saved successfully!');
      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save company settings');
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
        <h2 className="text-xl font-bold text-white tracking-tight">Company Management & Settings</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage company details, workspace logo, tracking policies, and standard working shift hours.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[var(--text-muted)]">Loading company profile & settings...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 0: Company Details & Logo Management */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Company Profile Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  type="text"
                  value={companyDetails.name}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Workspace Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img
                      src={logoPreview.startsWith('data:') || logoPreview.startsWith('http') ? logoPreview : `http://localhost:5000${logoPreview}`}
                      alt="Company Logo"
                      className="w-16 h-12 object-contain rounded-xl border border-[var(--border-muted)] bg-slate-900 p-1"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded-xl border border-dashed border-[var(--border-muted)] flex items-center justify-center text-xs text-[var(--text-muted)] bg-[var(--bg-canvas)]">
                      Logo
                    </div>
                  )}
                  <div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-card-alt)] hover:bg-indigo-600/20 text-xs font-semibold text-white rounded-lg border border-[var(--border-muted)] cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Adjust Logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoFileSelect} className="hidden" />
                    </label>
                    <p className="text-[10px] text-indigo-300 font-mono mt-1">
                      Recommended: <strong>240 × 80 px</strong> (PNG with transparent background)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 0.5: Company Branches / Divisions Management */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tenant Company Locations & Regional Branches</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {branches.length} Active Workspaces
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] -mt-2">
              Manage multi-company locations, regional entities, and branch workspaces under your tenant account.
            </p>

            {/* Add New Branch Input */}
            <div className="flex gap-3 pt-2">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Enter branch name (e.g. New York HQ, London Office)"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleAddBranch}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shrink-0 uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" /> Add Branch
              </button>
            </div>

            {/* Branch List Table / Grid */}
            <div className="space-y-2 pt-2">
              {branches.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-[var(--bg-card-alt)] rounded-xl border border-[var(--border-base)]">
                  {editingBranchId === b.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-3">
                      <input
                        type="text"
                        value={editBranchName}
                        onChange={(e) => setEditBranchName(e.target.value)}
                        className={inputClass}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateBranch(b.id)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBranchId(null)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{b.name}</h4>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">Branch ID: {b.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBranchId(b.id);
                            setEditBranchName(b.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition"
                          title="Edit Branch"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBranch(b.id, b.name)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
                          title="Delete Branch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {branches.length === 0 && (
                <div className="py-6 text-center text-xs text-[var(--text-muted)] italic">
                  No company branches created yet. Use the form above to add your first branch.
                </div>
              )}
            </div>
          </div>
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

      {/* ── Logo Crop & Adjust Modal ── */}
      {cropModalOpen && rawImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Crop & Adjust Workspace Logo</h3>
              <p className="text-xs text-slate-400 mt-0.5">Scale and position your logo image to fit perfectly in the sidebar header.</p>
            </div>

            {/* Live Sidebar Preview Container */}
            <div className="flex flex-col items-center justify-center py-6 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-indigo-400 mb-2 tracking-widest flex items-center gap-1.5">
                Exact Sidebar Header Box Preview
              </span>
              <div className="w-[220px] h-[52px] border-2 border-indigo-500/60 rounded-xl overflow-hidden bg-[#0f172a] flex items-center justify-start px-3 relative shadow-2xl">
                <img
                  src={rawImageSrc}
                  alt="Crop Preview"
                  className="max-w-none transition-transform duration-75 select-none"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    maxHeight: '36px',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>

            {/* Controls: Zoom & Pan */}
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Horizontal Offset (X)</label>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={pan.x}
                    onChange={(e) => setPan({ ...pan, x: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Vertical Offset (Y)</label>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    value={pan.y}
                    onChange={(e) => setPan({ ...pan, y: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={async () => {
                  if (!rawImageSrc) return;
                  setLogoPreview(rawImageSrc);
                  setCompanyDetails(prev => ({ ...prev, logoUrl: rawImageSrc }));
                  setCropModalOpen(false);
                  try {
                    const base64Data = rawImageSrc.split(',')[1] || rawImageSrc;
                    await companyApi.uploadLogo(companyId, base64Data);
                    toast.success('Original logo saved!');
                    if (onSettingsSaved) onSettingsSaved();
                  } catch (err) {
                    toast.error('Failed to save logo');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition"
              >
                Use Original (No Crop)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-400 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl transition shadow-lg shadow-indigo-600/20 uppercase tracking-wider"
                >
                  Apply Crop & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
