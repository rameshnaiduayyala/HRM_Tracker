import React, { useState } from 'react';
import { useTracking } from '../contexts/TrackingContext';

export const SettingsPage = () => {
  const { agentConfig, stats } = useTracking();
  const [startup, setStartup] = useState(true);
  const [minimizeTray, setMinimizeTray] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [captureAlerts, setCaptureAlerts] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const handleUpdateCheck = () => {
    setUpdating(true);
    setUpdateMsg('');
    setTimeout(() => {
      setUpdating(false);
      setUpdateMsg('taskTracky Agent is already up-to-date (v2.0.4).');
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
      {/* Policy Sync banner */}
      <div className="alert-ent info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className="bi bi-cloud-check-fill" style={{ fontSize: '16px' }} />
        <div>
          <strong>Enterprise Policies Active</strong> — Some configuration parameters are forced by your workspace administrator and cannot be modified locally.
        </div>
      </div>

      {/* Synced policies section */}
      <div className="ent-card" style={{ padding: '20px' }}>
        <span className="card-label" style={{ display: 'block', marginBottom: '16px' }}>Synced Tracking Policies</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Policy item 1 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>Inactivity Threshold</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Time before the session is auto-paused due to keyboard/mouse idle state</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="brand-version" style={{ fontSize: '11px', fontFamily: 'var(--text-mono)' }}>
                {agentConfig?.idleThreshold || 180} seconds
              </span>
              <i className="bi bi-lock-fill" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--sidebar-border)' }} />

          {/* Policy item 2 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>Screenshot Interval</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Target rate for capturing random screenshots of active workspaces</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="brand-version" style={{ fontSize: '11px', fontFamily: 'var(--text-mono)' }}>
                10 mins (avg)
              </span>
              <i className="bi bi-lock-fill" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--sidebar-border)' }} />

          {/* Policy item 3 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>Offline Tracking</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cache activity logs on disk when internet connection is lost</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="brand-version" style={{ fontSize: '11px', fontFamily: 'var(--text-mono)', color: 'var(--status-working)', background: 'var(--status-working-glow)', border: 'none' }}>
                ENABLED
              </span>
              <i className="bi bi-lock-fill" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Local App Preferences */}
      <div className="ent-card" style={{ padding: '20px' }}>
        <span className="card-label" style={{ display: 'block', marginBottom: '16px' }}>App Preferences</span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Preference 1 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>Launch on Startup</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Automatically launch taskTracky agent when Windows starts up</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={startup} onChange={(e) => setStartup(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>

          <div style={{ height: '1px', background: 'var(--sidebar-border)' }} />

          {/* Preference 2 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>Minimize to Tray</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Closing the window will minimize the agent to the system notification area</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={minimizeTray} onChange={(e) => setMinimizeTray(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>

          <div style={{ height: '1px', background: 'var(--sidebar-border)' }} />

          {/* Preference 3 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>Break Notifications</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Show desktop reminder alerts when shift duration target is reached</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
        </div>
      </div>

      {/* About & Updates */}
      <div className="ent-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <span className="card-label">System Diagnostics</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>taskTracky Desktop Agent</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Version 2.0.4 (Stable Release) · Build: x64-win32</div>
          </div>
          <button
            type="button"
            className="btn-signout"
            onClick={handleUpdateCheck}
            disabled={updating}
            style={{ textTransform: 'none', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                Checking...
              </>
            ) : (
              'Check for Updates'
            )}
          </button>
        </div>
        {updateMsg && (
          <div style={{ fontSize: '11.5px', color: 'var(--status-working)', fontFamily: 'var(--text-mono)' }}>
            ✔ {updateMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
