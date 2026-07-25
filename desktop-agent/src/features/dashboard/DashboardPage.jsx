import React, { useState, useEffect } from 'react';
import { useTracking } from '../../contexts/TrackingContext';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
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
    logs,
    tasks,
    activeTask,
    selectTask,
    updateTaskStatus
  } = useTracking();

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

  // System info is handled in MainLayout top header



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

  return (
    <>
      {/* Alert Banners */}
      {!clockedIn && (
        <AlertBanner type="danger" message="⚠  Please Clock In to start your mandatory 8-hour shift." />
      )}
      {clockedIn && !shiftActive && (
        <AlertBanner type="info" message="ℹ  Clocked in. Start the tracker to begin recording your session." />
      )}

      {/* Redundant status bar removed; unified workstation details and status are loaded in the top header */}

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
        <div className="shift-progress-container">
          <div className="shift-progress-header">
            <span className="card-label">8-Hour Shift Progress</span>
            <span className="card-label" style={{ color: 'var(--text-secondary)' }}>
              {formatTime(remaining)} remaining
            </span>
          </div>
          <div className="shift-progress-track">
            <div
              className="shift-progress-bar"
              style={{
                width: `${pctDone}%`,
                background: pctDone >= 100
                  ? 'var(--status-working)'
                  : 'linear-gradient(90deg, #f43f5e, var(--brand-red))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
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

      {/* Two-Column Tasks & Logs Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        {/* Left Column: Active Task Card & Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Task Card */}
          <div className="ent-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-label" style={{ color: 'var(--primary)' }}>Working On</span>
              {activeTask && (
                <button
                  type="button"
                  onClick={() => selectTask(null)}
                  className="btn-signout"
                  style={{ padding: '4px 10px', fontSize: '10px', textTransform: 'none' }}
                >
                  Release Task
                </button>
              )}
            </div>

            {activeTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {activeTask.title}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {activeTask.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontFamily: 'var(--text-mono)' }}>
                      Task Status
                    </label>
                    <select
                      value={activeTask.status}
                      onChange={(e) => updateTaskStatus(activeTask.id, e.target.value)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--sidebar-border)',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        background: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div>
                    <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontFamily: 'var(--text-mono)' }}>
                      Priority
                    </span>
                    <span className="brand-version" style={{ fontSize: '10.5px', fontWeight: '700', background: activeTask.priority === 'URGENT' ? 'var(--brand-red-glow)' : '#f1f5f9', color: activeTask.priority === 'URGENT' ? 'var(--brand-red)' : 'var(--text-secondary)', border: 'none' }}>
                      {activeTask.priority}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '10px 0', color: 'var(--text-secondary)', fontSize: '11.5px', fontStyle: 'italic' }}>
                No task currently selected. Choose an assigned task to associate your tracked session.
              </div>
            )}
          </div>

          {/* Log Console */}
          <LogConsole logs={logs} />
        </div>

        {/* Right Column: Assigned Tasks List */}
        <div className="ent-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content' }}>
          <span className="card-label">Your Assigned Tasks</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
            {tasks && tasks.length > 0 ? (
              tasks.map((task) => {
                const isActive = activeTask && activeTask.id === task.id;
                return (
                  <div
                    key={task.id}
                    className="ent-card"
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      background: isActive ? 'var(--sidebar-active-bg)' : '#ffffff',
                      borderColor: isActive ? 'var(--primary)' : 'var(--sidebar-border)',
                      borderWidth: isActive ? '1.5px' : '1px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                      <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.25' }}>
                        {task.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '9px', padding: '1.5px 5px', borderRadius: '4px', background: '#f1f5f9', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                          {task.status}
                        </span>
                        <span style={{ fontSize: '9px', padding: '1.5px 5px', borderRadius: '4px', background: task.priority === 'URGENT' ? 'var(--brand-red-glow)' : '#f1f5f9', color: task.priority === 'URGENT' ? 'var(--brand-red)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                          {task.priority}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => selectTask(task)}
                        disabled={isActive}
                        className="btn-ent btn-start"
                        style={{
                          width: 'auto',
                          padding: '4px 10px',
                          fontSize: '10.5px',
                          textTransform: 'none',
                          fontWeight: 'bold',
                          margin: 0,
                        }}
                      >
                        {isActive ? 'Tracking' : 'Track'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No tasks assigned to you.
              </div>
            )}
          </div>
        </div>
      </div>

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
