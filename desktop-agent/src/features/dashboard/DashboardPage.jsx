import React, { useState, useEffect } from 'react';
import { useTracking } from '../../contexts/TrackingContext';
import { useAuth } from '../../contexts/AuthContext';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import StatusHeader from '../../components/StatusHeader';
import TelemetryCard from '../../components/TelemetryCard';
import ReasonModal from '../../components/ReasonModal';
import LogConsole from '../../components/LogConsole';
import AlertBanner from '../../components/AlertBanner';
import TrackingControls from '../../components/TrackingControls';

export const DashboardPage = () => {
  const {
    shiftActive, isPaused, stats,
    startShift, endShift,
    showReasonModal, submitStopReason,
    clockedIn, clockIn, clockOut,
    agentConfig,
    logs
  } = useTracking();

  const { logout } = useAuth();
  const [sysInfo, setSysInfo] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [stopActionType, setStopActionType] = useState('tracker');

  useEffect(() => {
    if (showReasonModal || showStopModal) {
      setSelectedReason('');
      setCustomReason('');
    }
  }, [showReasonModal, showStopModal]);

  useEffect(() => {
    invoke('get_system_info')
      .then((info) => setSysInfo(info))
      .catch(() => {});
  }, []);



  useEffect(() => {
    let timer;
    if (shiftActive && !isPaused) {
      timer = setInterval(() => setSessionTime((p) => p + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [shiftActive, isPaused]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const remaining = Math.max(0, 28800 - sessionTime);
  const pctDone = Math.min(100, (sessionTime / 28800) * 100);

  const statusClass = clockedIn ? (shiftActive ? 'working' : 'paused') : 'offline';
  const statusText = clockedIn ? (shiftActive ? (isPaused ? 'Paused' : 'Working') : 'On Break') : 'Offline';

  return (
    <>
      {/* Alert Banners */}
      {!clockedIn && (
        <AlertBanner type="danger" message="⚠  Please Clock In to start your mandatory 8-hour shift." />
      )}
      {clockedIn && !shiftActive && (
        <AlertBanner type="info" message="ℹ  Clocked in. Start the tracker to begin recording your session." />
      )}

      {/* Status Bar */}
      <StatusHeader
        shiftTimeText={formatTime(sessionTime)}
        statusText={statusText}
        statusClass={statusClass}
        workstation={sysInfo?.hostname || '—'}
        onLogout={() => {
          if (clockedIn || shiftActive) {
            setShowSignOutModal(true);
          } else {
            logout();
          }
        }}
      />

      {/* Controls */}
      <TrackingControls
        clockedIn={clockedIn}
        onClockToggle={clockedIn
          ? () => { setStopActionType('clockout'); setShowStopModal(true); }
          : clockIn}
        shiftActive={shiftActive}
        onSessionToggle={shiftActive
          ? () => { setStopActionType('tracker'); setShowStopModal(true); }
          : startShift}
      />

      {/* 8h Progress Bar */}
      <div className="ent-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="card-label">8-Hour Shift Progress</span>
          <span className="card-label" style={{ color: 'var(--text-secondary)' }}>
            {formatTime(remaining)} remaining
          </span>
        </div>
        <div style={{ background: 'var(--card-border)', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
          <div style={{
            width: `${pctDone}%`,
            height: '100%',
            background: pctDone >= 100
              ? 'var(--status-working)'
              : 'linear-gradient(90deg, #e53935, #ff6b35)',
            borderRadius: '4px',
            transition: 'width 1s linear'
          }} />
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <TelemetryCard
          label="Active Window"
          title={stats.activeWindow || 'Idle'}
          subtitle={`Host: ${sysInfo?.hostname || '—'}`}
          colorClass="blue"
        />
        <TelemetryCard
          label="Idle Time"
          value={isPaused ? formatTime(sessionTime) : '0:00'}
          colorClass="amber"
        />
        <TelemetryCard
          label="Shift Logged"
          value={formatTime(sessionTime)}
          colorClass="emerald"
        />
        <TelemetryCard
          label="Remaining"
          value={formatTime(remaining)}
          colorClass="purple"
        />
      </div>

      {/* Log Console */}
      <LogConsole logs={logs} />

      {/* Inactivity Modal */}
      {showReasonModal && (
        <ReasonModal
          title="Inactivity Detected"
          subtitle={`${agentConfig.idleThreshold}s of no keyboard/mouse activity detected. You must select a reason to continue:`}
          options={['Meeting', 'Break', 'Task Sync', 'Other']}
          selectedOption={selectedReason}
          onSelectOption={setSelectedReason}
          customReason={customReason}
          onChangeCustomReason={setCustomReason}
          isSubmitting={isSubmitting || !selectedReason || (selectedReason === 'Other' && !customReason.trim())}
          onSubmit={async () => {
            if (!selectedReason || (selectedReason === 'Other' && !customReason.trim())) return;
            setIsSubmitting(true);
            try {
              const reason = selectedReason === 'Other' ? customReason : selectedReason;
              await submitStopReason(reason);
            } catch (e) { console.error(e); }
            finally { setIsSubmitting(false); }
          }}
          showCancel={false}
        />
      )}

      {/* Manual Stop Modal */}
      {showStopModal && (
        <ReasonModal
          title={stopActionType === 'clockout' ? 'Clock Out Confirmation' : 'Stop Tracker'}
          subtitle="Select a reason for stopping:"
          options={['End of Day', 'Lunch Break', 'Meeting', 'Personal Break', 'Other']}
          selectedOption={selectedReason}
          onSelectOption={setSelectedReason}
          customReason={customReason}
          onChangeCustomReason={setCustomReason}
          isSubmitting={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
          onSubmit={async () => {
            if (!selectedReason || (selectedReason === 'Other' && !customReason.trim())) return;
            const reason = selectedReason === 'Other' ? customReason : selectedReason;
            setShowStopModal(false);
            setCustomReason('');
            if (stopActionType === 'tracker') {
              await endShift(reason);
              if (clockedIn) {
                await clockOut();
              }
            } else {
              await clockOut();
            }
          }}
          onCancel={() => setShowStopModal(false)}
          showCancel={true}
        />
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <ReasonModal
          title="Sign Out Confirmation"
          subtitle="Warning: Signing out will automatically stop the tracker and clock you out. Please select a reason for stopping:"
          options={['End of Day', 'Lunch Break', 'Meeting', 'Personal Break', 'Other']}
          selectedOption={selectedReason}
          onSelectOption={setSelectedReason}
          customReason={customReason}
          onChangeCustomReason={setCustomReason}
          isSubmitting={false}
          onSubmit={async () => {
            const reason = selectedReason === 'Other' ? customReason : selectedReason;
            setShowSignOutModal(false);
            setCustomReason('');
            try {
              if (shiftActive) {
                await endShift(reason || 'Sign Out stop');
              }
              if (clockedIn) {
                await clockOut();
              }
            } catch (e) {
              console.error(e);
            }
            logout();
          }}
          onCancel={() => setShowSignOutModal(false)}
          showCancel={true}
        />
      )}
    </>
  );
};

export default DashboardPage;
