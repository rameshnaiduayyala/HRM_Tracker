import React, { createContext, useContext, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import apiClient from '../api/apiClient';

const TrackingContext = createContext(null);

export const TrackingProvider = ({ children }) => {
  const [shiftActive, setShiftActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({ keyboardCount: 0, mouseCount: 0, activeWindow: 'Idle' });

  useEffect(() => {
    // Poll stats from Rust tracking system
    let interval;
    if (shiftActive && !isPaused) {
      interval = setInterval(async () => {
        try {
          const rustStats = await invoke('get_tracking_stats');
          setStats(rustStats);
        } catch (e) {
          console.error("Failed to read stats from Rust", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [shiftActive, isPaused]);

  const startShift = async () => {
    try {
      await apiClient.post('/work-sessions/start');
      await invoke('start_tracking_command');
      setShiftActive(true);
      setIsPaused(false);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const pauseShift = async () => {
    try {
      await invoke('pause_tracking_command');
      setIsPaused(true);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const resumeShift = async () => {
    try {
      await invoke('resume_tracking_command');
      setIsPaused(false);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const endShift = async (reason = 'Manual Stop') => {
    try {
      await apiClient.post('/work-sessions/stop', { stopReason: reason });
      await invoke('stop_tracking_command', { reason });
      setShiftActive(false);
      setIsPaused(false);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <TrackingContext.Provider value={{ shiftActive, isPaused, stats, startShift, pauseShift, resumeShift, endShift }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => useContext(TrackingContext);
