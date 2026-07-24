import React, { createContext, useContext, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import apiClient from '../api/apiClient';

const TrackingContext = createContext(null);

export const TrackingProvider = ({ children }) => {
  const [shiftActive, setShiftActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({ keyboardCount: 0, mouseCount: 0, activeWindow: 'Idle' });
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [breakReason, setBreakReason] = useState('Working');
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    const timeStr = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timeStr}] ${msg}`, ...prev].slice(0, 100));
  };

  // Fetch status on startup
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await apiClient.get('/attendance/status');
        if (response.data && response.data.data) {
          const status = response.data.data.clockedIn;
          setClockedIn(status);
          addLog(status ? "Active shift detected on backend." : "Shift is offline. Please Clock In.");
        }
      } catch (e) {
        console.error("Failed to fetch attendance status", e);
        addLog("Offline mode: Attendance status unavailable.");
      }
    };
    fetchStatus();
  }, []);

  // Poll stats from Rust tracking system
  useEffect(() => {
    let interval;
    if (shiftActive && !isPaused) {
      interval = setInterval(async () => {
        try {
          const rustStats = await invoke('get_tracking_stats');
          setStats(rustStats);
          addLog(`Heartbeat synced: ${rustStats.activeWindow || 'Idle'}`);
        } catch (e) {
          console.error("Failed to read stats from Rust", e);
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [shiftActive, isPaused]);

  useEffect(() => {
    let unlisten;
    const setupListener = async () => {
      unlisten = await listen('inactivity-detected', () => {
        setIsPaused(true);
        setShowReasonModal(true);
        addLog("Inactivity detected: Auto-suspending work session.");
      });
    };
    setupListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const clockIn = async () => {
    try {
      await apiClient.post('/attendance/clock-in');
      setClockedIn(true);
      addLog("Shift attendance clock-in completed. Mandatory 8h shift started.");
    } catch (e) {
      console.error(e);
      addLog("Failed to clock in: " + (e.response?.data?.message || e.message));
      throw e;
    }
  };

  const clockOut = async () => {
    try {
      if (shiftActive) {
        await endShift('Shift Clock Out');
      }
      await apiClient.post('/attendance/clock-out');
      setClockedIn(false);
      addLog("Shift attendance clock-out completed.");
    } catch (e) {
      console.error(e);
      addLog("Failed to clock out: " + (e.response?.data?.message || e.message));
      throw e;
    }
  };

  const changeBreakReason = async (reason) => {
    setBreakReason(reason);
    if (reason === 'Working') {
      addLog("Returned from break status. Automatically resuming work sessions...");
      if (!shiftActive) {
        await startShift();
      }
    } else {
      addLog(`Transitioned to break: ${reason.toUpperCase()}. Pausing tracking sessions.`);
      if (shiftActive) {
        await pauseShift();
      }
    }
  };

  const startShift = async () => {
    try {
      const token = localStorage.getItem('agent_auth_token') || '';
      await apiClient.post('/work-sessions/start');
      await invoke('start_tracking_command', { token });
      setShiftActive(true);
      setIsPaused(false);
      addLog("Work session tracker active. Background activity loop started.");
    } catch (e) {
      console.error(e);
      addLog("Failed to start shift: " + (e.response?.data?.message || e.message));
      throw e;
    }
  };

  const pauseShift = async () => {
    try {
      await invoke('pause_tracking_command');
      setIsPaused(true);
      addLog("Work session tracker suspended.");
    } catch (e) {
      console.error(e);
      addLog("Failed to pause shift: " + e.message);
      throw e;
    }
  };

  const resumeShift = async () => {
    try {
      const token = localStorage.getItem('agent_auth_token') || '';
      await invoke('resume_tracking_command', { token });
      setIsPaused(false);
      addLog("Work session tracker resumed. Activity loop active.");
    } catch (e) {
      console.error(e);
      addLog("Failed to resume shift: " + e.message);
      throw e;
    }
  };

  const endShift = async (reason = 'Manual Stop') => {
    try {
      await apiClient.post('/work-sessions/stop', { stopReason: reason });
      await invoke('stop_tracking_command', { reason });
      setShiftActive(false);
      setIsPaused(false);
      addLog(`Work session tracker stopped. Reason: ${reason}`);
    } catch (e) {
      console.error(e);
      addLog("Failed to stop shift: " + (e.response?.data?.message || e.message));
      throw e;
    }
  };

  const submitStopReason = async (reason) => {
    try {
      await apiClient.post('/work-sessions/update-reason', { stopReason: reason });
      setShowReasonModal(false);
      addLog(`Inactivity reason submitted: ${reason}`);
    } catch (e) {
      console.error("Failed to submit stop reason", e);
      addLog("Failed to submit inactivity reason: " + e.message);
      throw e;
    }
  };

  return (
    <TrackingContext.Provider value={{
      shiftActive,
      isPaused,
      stats,
      startShift,
      pauseShift,
      resumeShift,
      endShift,
      showReasonModal,
      setShowReasonModal,
      submitStopReason,
      clockedIn,
      clockIn,
      clockOut,
      breakReason,
      changeBreakReason,
      logs,
      addLog
    }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => useContext(TrackingContext);
