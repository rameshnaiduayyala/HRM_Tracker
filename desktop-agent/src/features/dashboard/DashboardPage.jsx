import React, { useState, useEffect } from 'react';
import { useTracking } from '../../contexts/TrackingContext';
import { useAuth } from '../../contexts/AuthContext';
import { invoke } from '@tauri-apps/api/core';
import StatusHeader from '../../components/StatusHeader';
import TelemetryCard from '../../components/TelemetryCard';
import ReasonModal from '../../components/ReasonModal';
import LogConsole from '../../components/LogConsole';
import AlertBanner from '../../components/AlertBanner';
import TrackingControls from '../../components/TrackingControls';

export const DashboardPage = () => {
  const {
    shiftActive,
    isPaused,
    stats,
    startShift,
    pauseShift,
    resumeShift,
    endShift,
    showReasonModal,
    submitStopReason,
    clockedIn,
    clockIn,
    clockOut,
    breakReason,
    changeBreakReason,
    logs
  } = useTracking();

  const { user, logout } = useAuth();
  const [sysInfo, setSysInfo] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [selectedReason, setSelectedReason] = useState('Meeting');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopActionType, setStopActionType] = useState('tracker');

  // Fetch system details
  useEffect(() => {
    invoke('get_system_info')
      .then((info) => setSysInfo(info))
      .catch((e) => console.error("System info error", e));
  }, []);

  // Session timer increment (matches shift log time)
  useEffect(() => {
    let timer;
    if (shiftActive && !isPaused && breakReason === 'Working') {
      timer = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [shiftActive, isPaused, breakReason]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  return (
    <div className="container-fluid py-2">
      {/* 1. Warning Banners */}
      {!clockedIn && (
        <AlertBanner type="danger" message="⚠️ Please Clock In to start tracking your mandatory 8-hour shift." />
      )}

      {clockedIn && !shiftActive && (
        <AlertBanner type="primary" message="ℹ️ Clocked In. Click Start Tracker to begin recording work hours." />
      )}

      {/* 2. Sleek Swiss Status Header Bar Component */}
      <StatusHeader
        shiftTimeText={formatTime(sessionTime)}
        statusText={clockedIn ? (shiftActive ? 'WORKING' : 'ON BREAK') : 'OFFLINE'}
        statusBadgeClass={clockedIn ? (shiftActive ? 'bg-danger text-white' : 'bg-warning text-dark') : 'bg-secondary text-white'}
        workstation={sysInfo?.hostname || 'UNKNOWN'}
        onLogout={logout}
      />

      {/* 3. Operations Controls Component */}
      <TrackingControls
        clockedIn={clockedIn}
        onClockToggle={clockedIn ? () => { setStopActionType('clockout'); setShowStopModal(true); } : clockIn}
        shiftActive={shiftActive}
        onSessionToggle={shiftActive ? () => { setStopActionType('tracker'); setShowStopModal(true); } : startShift}
      />

      {/* 4. Real-Time Metrics Grid Component */}
      <div className="row g-3 mb-3">
        <div className="col-lg-3 col-sm-6">
          <TelemetryCard
            label="ACTIVE WINDOW"
            title={stats.activeWindow || '-'}
            subtitle={`Process: ${sysInfo?.hostname ? 'Active' : 'Idle'}`}
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <TelemetryCard
            label="IDLE TIME"
            value="0s"
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <TelemetryCard
            label="SHIFT LOGGED"
            value={formatTime(sessionTime)}
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <TelemetryCard
            label="REMAINING TIME"
            value={formatTime(Math.max(0, 28800 - sessionTime))}
          />
        </div>
      </div>

      {/* 5. Telemetry Log Console Component */}
      <LogConsole logs={logs} />

      {/* Swiss Inactivity Reason Modal Dialog */}
      {showReasonModal && (
        <ReasonModal
          title="Inactivity Detected"
          subtitle="Please specify a reason for inactivity:"
          options={['Meeting', 'Break', 'Task Sync', 'Other']}
          selectedOption={selectedReason}
          onSelectOption={setSelectedReason}
          customReason={customReason}
          onChangeCustomReason={setCustomReason}
          isSubmitting={isSubmitting}
          onSubmit={async () => {
            setIsSubmitting(true);
            try {
              const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
              await submitStopReason(finalReason || 'Idle');
            } catch (e) {
              console.error(e);
            } finally {
              setIsSubmitting(false);
            }
          }}
          showCancel={false}
        />
      )}

      {/* Swiss Manual Stop Reason Modal Dialog */}
      {showStopModal && (
        <ReasonModal
          title="Specify Stop Reason"
          subtitle="Please specify a reason for stopping:"
          options={['End of Day', 'Lunch Break', 'Meeting', 'Personal Break', 'Other']}
          selectedOption={selectedReason}
          onSelectOption={setSelectedReason}
          customReason={customReason}
          onChangeCustomReason={setCustomReason}
          isSubmitting={false}
          onSubmit={async () => {
            const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
            const reasonText = finalReason || 'Manual Stop';
            setShowStopModal(false);
            if (stopActionType === 'tracker') {
              await endShift(reasonText);
            } else {
              await clockOut();
            }
          }}
          onCancel={() => setShowStopModal(false)}
          showCancel={true}
        />
      )}
    </div>
  );
};

export default DashboardPage;
