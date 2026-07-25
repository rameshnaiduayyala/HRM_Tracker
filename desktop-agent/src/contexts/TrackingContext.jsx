import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import apiClient from '../api/apiClient';
import { LOCAL_STORAGE_JWT_KEY } from '../constants/appConstants';
import { useAuth } from './AuthContext';

const TrackingContext = createContext(null);

export const TrackingProvider = ({ children }) => {
  const { user } = useAuth();
  const [shiftActive, setShiftActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({ keyboardCount: 0, mouseCount: 0, activeWindow: 'Idle' });
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [logs, setLogs] = useState([]);
  const [agentConfig, setAgentConfig] = useState({ screenshotInterval: 60, idleThreshold: 300 });
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const statsIntervalRef = useRef(null);

  const addLog = (msg) => {
    const timeStr = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timeStr}] ${msg}`, ...prev].slice(0, 100));
  };

  // Fetch company config (screenshot interval + idle threshold)
  const fetchAgentConfig = async () => {
    try {
      const res = await apiClient.get('/work-sessions/config');
      if (res.data?.data) {
        const cfg = res.data.data;
        setAgentConfig({
          screenshotInterval: cfg.screenshotInterval || 60,
          idleThreshold: cfg.idleThreshold || 300,
        });
        addLog(`✔ Company config loaded — screenshot every ${cfg.screenshotInterval}s, idle threshold ${cfg.idleThreshold}s`);
        return cfg;
      }
    } catch (e) {
      addLog('⚠ Could not fetch company config. Using defaults (60s / 300s).');
    }
    return { screenshotInterval: 60, idleThreshold: 300 };
  };

  // Fetch attendance status on startup
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await apiClient.get('/attendance/status');
        if (response.data?.data) {
          const status = response.data.data.clockedIn;
          setClockedIn(status);
          addLog(status
            ? '✔ Active shift detected. Ready to track.'
            : 'No active shift today. Please Clock In.');
        }
      } catch (e) {
        addLog('Ready. Awaiting Clock In to begin shift.');
      }
    };
    const timeout = setTimeout(fetchStatus, 1200);
    return () => clearTimeout(timeout);
  }, []);

  // Poll tracking stats from Rust every 10s when session is active
  useEffect(() => {
    if (shiftActive && !isPaused) {
      statsIntervalRef.current = setInterval(async () => {
        try {
          const rustStats = await invoke('get_tracking_stats');
          setStats(rustStats);
          addLog(`Heartbeat: ${rustStats.activeWindow || 'Idle'} | KB:${rustStats.keyboardCount} Mouse:${rustStats.mouseCount}`);
        } catch (e) {
          addLog('Heartbeat read error: ' + e.message);
        }
      }, 10000);
    } else {
      clearInterval(statsIntervalRef.current);
    }
    return () => clearInterval(statsIntervalRef.current);
  }, [shiftActive, isPaused]);

  // Listen for Rust inactivity detection — force window visible, pause shift + show unclosable modal
  useEffect(() => {
    let unlistenApp;
    let unlistenWin;
    const setupListener = async () => {
      const handler = () => {
        setIsPaused(true);
        setShowReasonModal(true);
        addLog(`⚠ Inactivity detected. Window forced open — submit a reason to continue.`);
      };

      try {
        unlistenApp = await listen('inactivity-detected', handler);
      } catch (e) { console.error('Failed to listen to global inactivity-detected:', e); }

      try {
        const win = getCurrentWindow();
        unlistenWin = await win.listen('inactivity-detected', handler);
      } catch (e) { console.error('Failed to listen to window inactivity-detected:', e); }
    };

    setupListener();

    return () => {
      if (typeof unlistenApp === 'function') unlistenApp();
      if (typeof unlistenWin === 'function') unlistenWin();
    };
  }, []);



  const clockIn = async () => {
    try {
      await apiClient.post('/attendance/clock-in');
      setClockedIn(true);
      addLog('✔ Clock In recorded. Mandatory 8h shift started.');
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      addLog('✖ Clock In failed: ' + msg);
      throw e;
    }
  };

  const clockOut = async () => {
    try {
      if (shiftActive) await endShift('Clock Out');
      await apiClient.post('/attendance/clock-out');
      setClockedIn(false);
      addLog('✔ Clock Out recorded. Shift ended.');
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      addLog('✖ Clock Out failed: ' + msg);
      throw e;
    }
  };

  const startShift = async () => {
    try {
      // Fetch latest company config before starting
      const cfg = await fetchAgentConfig();
      const token = localStorage.getItem(LOCAL_STORAGE_JWT_KEY) || sessionStorage.getItem(LOCAL_STORAGE_JWT_KEY) || '';

      await apiClient.post('/work-sessions/start');
      await invoke('start_tracking_command', {
        token,
        screenshotInterval: cfg.screenshotInterval,
        idleThreshold: cfg.idleThreshold,
      });
      setShiftActive(true);
      setIsPaused(false);
      addLog('✔ Work session started. Background tracker active.');
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      addLog('✖ Start tracker failed: ' + msg);
      throw e;
    }
  };

  const pauseShift = async () => {
    try {
      await invoke('pause_tracking_command');
      setIsPaused(true);
      addLog('⏸ Tracker paused.');
    } catch (e) {
      addLog('✖ Pause failed: ' + e.message);
      throw e;
    }
  };

  const resumeShift = async () => {
    try {
      const token = localStorage.getItem(LOCAL_STORAGE_JWT_KEY) || sessionStorage.getItem(LOCAL_STORAGE_JWT_KEY) || '';
      await invoke('resume_tracking_command', {
        token,
        screenshotInterval: agentConfig.screenshotInterval,
        idleThreshold: agentConfig.idleThreshold,
      });
      setIsPaused(false);
      addLog('▶ Tracker resumed.');
    } catch (e) {
      addLog('✖ Resume failed: ' + e.message);
      throw e;
    }
  };

  const endShift = async (reason = 'Manual Stop') => {
    try {
      await apiClient.post('/work-sessions/stop', { stopReason: reason });
      await invoke('stop_tracking_command', { reason });
      setShiftActive(false);
      setIsPaused(false);
      addLog(`✔ Work session stopped. Reason: ${reason}`);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      addLog('✖ Stop tracker failed: ' + msg);
      throw e;
    }
  };

  const submitStopReason = async (reason) => {
    try {
      await apiClient.post('/work-sessions/update-reason', { stopReason: reason });
      setShowReasonModal(false);
      addLog(`✔ Inactivity reason logged: ${reason}. Resuming session...`);

      // Remove always-on-top and close/hide window after reason submitted
      try {
        const win = getCurrentWindow();
        await win.setAlwaysOnTop(false);
        await win.hide();
      } catch (_) { /* non-critical */ }

      // Auto-resume the session
      setIsPaused(false);
      await resumeShift();
    } catch (e) {
      addLog('✖ Reason submit failed: ' + e.message);
      throw e;
    }
  };

  const fetchTasks = async (companyId, employeeId, silent = false) => {
    try {
      const res = await apiClient.get('/tasks', {
        params: { companyId, employeeId }
      });
      let fetchedTasks = res.data?.data?.tasks || [];
      
      if (fetchedTasks.length === 0 && !silent) {
        addLog('No assigned tasks found. Seeding default tasks in backend database...');
        
        const projRes = await apiClient.get('/tasks/projects', {
          params: { companyId }
        });
        let projects = projRes.data?.data?.projects || [];
        let projectId;

        if (projects.length === 0) {
          const newProjRes = await apiClient.post('/tasks/projects', {
            name: 'Nexus Workforce OS',
            companyId
          });
          projectId = newProjRes.data?.data?.project?.id;
          addLog('✔ Created default project: Nexus Workforce OS');
        } else {
          projectId = projects[0].id;
        }

        if (projectId) {
          const tasksToSeed = [
            { title: 'PROJ-142: Implement Employee API', description: 'Backend optimization for workforce management module.', projectId, employeeId, priority: 'HIGH', status: 'IN_PROGRESS' },
            { title: 'PROJ-101: Fix Authentication Session bug', description: 'Resolve token expiry callback failures on desktop clients.', projectId, employeeId, priority: 'URGENT', status: 'TODO' },
            { title: 'PROJ-94: Design System styling audit', description: 'Verify dark/light theme tokens and layout consistency.', projectId, employeeId, priority: 'LOW', status: 'REVIEW' },
            { title: 'PROJ-85: Write Integration Tests', description: 'Add unit and integration tests for leave applications.', projectId, employeeId, priority: 'MEDIUM', status: 'DONE' }
          ];

          for (const t of tasksToSeed) {
            await apiClient.post('/tasks', t);
          }
          addLog('✔ Default tasks seeded successfully in database.');

          const reFetchRes = await apiClient.get('/tasks', {
            params: { companyId, employeeId }
          });
          fetchedTasks = reFetchRes.data?.data?.tasks || [];
        }
      }

      setTasks(fetchedTasks);
      
      // Auto-synchronize active task details if they changed on server
      setActiveTask((currentActive) => {
        if (!currentActive) return null;
        const matchingTask = fetchedTasks.find(t => t.id === currentActive.id);
        if (matchingTask) {
          if (matchingTask.status !== currentActive.status || matchingTask.priority !== currentActive.priority || matchingTask.title !== currentActive.title) {
            if (!silent) {
              addLog(`ℹ Active task "${matchingTask.title}" synced with database.`);
            }
            return matchingTask;
          }
        }
        return currentActive;
      });

      if (!silent) {
        addLog(`✔ Loaded ${fetchedTasks.length} tasks from database.`);
      }
      return fetchedTasks;
    } catch (e) {
      if (!silent) {
        addLog('✖ Error sync-fetching tasks: ' + e.message);
      }
      setTasks([]);
      return [];
    }
  };

  const selectTask = async (task) => {
    setActiveTask(task);
    if (task) {
      addLog(`▶ Working on task: ${task.title}`);
      if (task.status !== 'IN_PROGRESS') {
        await updateTaskStatus(task.id, 'IN_PROGRESS');
      }
    } else {
      addLog('Released active tracking task.');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
      addLog(`✔ Task status updated to ${newStatus}`);
      
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      
      setActiveTask((prev) =>
        prev && prev.id === taskId ? { ...prev, status: newStatus } : prev
      );
    } catch (e) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      setActiveTask((prev) =>
        prev && prev.id === taskId ? { ...prev, status: newStatus } : prev
      );
    }
  };

  useEffect(() => {
    if (user && user.companyId) {
      // Initial fetch
      fetchTasks(user.companyId, user.id);

      // Silent background polling every 15 seconds
      const pollInterval = setInterval(() => {
        fetchTasks(user.companyId, user.id, true);
      }, 15000);

      return () => clearInterval(pollInterval);
    } else {
      setTasks([]);
      setActiveTask(null);
    }
  }, [user]);

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
      agentConfig,
      logs,
      addLog,
      tasks,
      activeTask,
      fetchTasks: () => fetchTasks(user?.companyId, user?.id),
      selectTask,
      updateTaskStatus
    }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => useContext(TrackingContext);
