import React, { useState } from 'react';
import { Laptop, Play, Coffee, Activity, Clock, Monitor, Sun } from 'lucide-react';

export default function ReportsTab({ employees = [], onRefresh, onViewReport }) {
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [subTab, setSubTab] = useState('live'); // 'live' or 'attendance'

  // Today's Date String
  const todayStr = new Date().toDateString();

  // Dynamic calculations for Today's Attendance metrics
  const presentEmployees = employees.filter(e => (e.attendances || []).some(a => new Date(a.clockIn).toDateString() === todayStr));
  const presentCount = presentEmployees.length;
  const leaveCount = employees.filter(e => e.status === 'ON_LEAVE').length;
  const absentCount = Math.max(0, employees.length - presentCount - leaveCount);

  // Late Count (Clocked in after 09:15 AM)
  const lateCount = employees.filter(e => {
    const todayAtt = (e.attendances || []).find(a => new Date(a.clockIn).toDateString() === todayStr);
    if (!todayAtt) return false;
    const clockInDate = new Date(todayAtt.clockIn);
    const hour = clockInDate.getHours();
    const min = clockInDate.getMinutes();
    return (hour > 9) || (hour === 9 && min > 15);
  }).length;

  // Remote Count
  const remoteCount = employees.filter(e => {
    const todayAtt = (e.attendances || []).find(a => new Date(a.clockIn).toDateString() === todayStr);
    return todayAtt && (todayAtt.ipAddress !== '127.0.0.1' || todayAtt.deviceType === 'DESKTOP');
  }).length;

  // Real-time Status counts
  const onlineCount = employees.filter(e => {
    const todayAtt = (e.attendances || []).find(a => new Date(a.clockIn).toDateString() === todayStr);
    return todayAtt && !todayAtt.clockOut;
  }).length;

  const idleCount = employees.filter(e => {
    const todayAtt = (e.attendances || []).find(a => new Date(a.clockIn).toDateString() === todayStr);
    const activeSession = (e.workSessions || []).find(ws => ws.status === 'RUNNING');
    return todayAtt && !todayAtt.clockOut && activeSession?.stopReason === 'IDLE';
  }).length;

  const breakCount = employees.filter(e => {
    const activeSession = (e.workSessions || []).find(ws => ws.status === 'RUNNING');
    return activeSession?.stopReason === 'BREAK' || activeSession?.stopReason === 'LUNCH';
  }).length;

  const workingCount = Math.max(0, onlineCount - idleCount - breakCount);

  // Get departments for filters
  const departments = ['ALL', ...new Set(employees.map(e => e.department?.name || (typeof e.department === 'string' ? e.department : '')).filter(Boolean))];

  // Filter employees list for live grid and attendance table
  const filteredEmployees = employees.filter(e => {
    const empDept = e.department?.name || (typeof e.department === 'string' ? e.department : '');
    const matchesTeam = teamFilter === 'ALL' || empDept === teamFilter;
    
    const todayAtt = (e.attendances || []).find(a => new Date(a.clockIn).toDateString() === todayStr);
    const isOnline = todayAtt && !todayAtt.clockOut;
    const activeSession = (e.workSessions || []).find(ws => ws.status === 'RUNNING');

    let currentStatus = 'OFFLINE';
    if (isOnline) {
      if (activeSession?.stopReason === 'IDLE') currentStatus = 'IDLE';
      else if (activeSession?.stopReason === 'BREAK' || activeSession?.stopReason === 'LUNCH') currentStatus = 'BREAK';
      else currentStatus = 'WORKING';
    }

    const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
    return matchesTeam && matchesStatus;
  });

  const formatMs = (ms) => (ms / (1000 * 60 * 60)).toFixed(2) + ' hrs';

  return (
    <div className="flex flex-col gap-6">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
            Workforce Analytics & Telemetry
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time active application logs, shifts status overview, and compiled attendance reports.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="badge badge-indigo">{employees.length} Total Workforce</span>
          <button 
            onClick={onRefresh}
            className="px-3 py-1.5 border border-[var(--border-subtle)] text-[11px] font-bold uppercase rounded-lg hover:bg-[var(--bg-card-alt)] transition-colors flex items-center gap-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Sync Live
          </button>
        </div>
      </div>

      {/* Dynamic Switch (Live workforce status vs Shift attendance overview) */}
      <div className="flex border-b border-[var(--border-subtle)]">
        <button 
          onClick={() => setSubTab('live')}
          className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${subTab === 'live' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-[var(--text-secondary)] hover:text-indigo-500'}`}
        >
          Live Status Board
        </button>
        <button 
          onClick={() => setSubTab('attendance')}
          className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${subTab === 'attendance' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-[var(--text-secondary)] hover:text-indigo-500'}`}
        >
          Attendance Overview
        </button>
      </div>

      {/* Render Subtab 1: Live Status Board */}
      {subTab === 'live' && (
        <>
          {/* Summary Dashboard Bar */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Online */}
            <div className="glass-card flex items-center justify-between py-4 px-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Online</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{onlineCount}</h2>
                  <span className="text-indigo-500 text-[10px] font-bold">+12/hr</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Laptop className="w-5 h-5" />
              </div>
            </div>
            {/* Working */}
            <div className="glass-card flex items-center justify-between py-4 px-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Working</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{workingCount}</h2>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[9px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Focused</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Play className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            {/* On Break */}
            <div className="glass-card flex items-center justify-between py-4 px-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>On Break</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{breakCount}</h2>
                  <span className="text-purple-500 text-[10px] font-bold">Out of office</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Coffee className="w-5 h-5" />
              </div>
            </div>
            {/* Idle */}
            <div className="glass-card flex items-center justify-between py-4 px-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Idle</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{idleCount}</h2>
                  <span className="text-red-500 text-[10px] font-bold">Needs attention</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>
          </section>

          {/* Filters Strip */}
          <section className="glass-card flex flex-wrap items-center gap-4 py-3 px-4">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <span className="text-[9px] font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-muted)' }}>Department</span>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <span className="text-[9px] font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-muted)' }}>Current Status</span>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="WORKING">Working</option>
                <option value="IDLE">Idle</option>
                <option value="BREAK">On Break</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <span className="text-[9px] font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-muted)' }}>Search Team</span>
              <div className="relative">
                <Laptop className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs focus:outline-none transition-all"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  placeholder="Search name or task..."
                  type="text"
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase();
                    setStatusFilter('ALL');
                    setTeamFilter('ALL');
                  }}
                />
              </div>
            </div>

            <div className="flex items-end">
              <button 
                onClick={() => { setTeamFilter('ALL'); setStatusFilter('ALL'); }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Clear All
              </button>
            </div>
          </section>

          {/* Live tracking cards grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredEmployees.map((emp) => {
              const todayAtt = (emp.attendances || []).find(a => new Date(a.clockIn).toDateString() === todayStr);
              const isOnline = todayAtt && !todayAtt.clockOut;
              const activeSession = (emp.workSessions || []).find(ws => ws.status === 'RUNNING');
              const initials = `${emp.user?.firstName?.[0] || ''}${emp.user?.lastName?.[0] || ''}`.toUpperCase();

              let currentStatus = 'OFFLINE';
              let statusLabel = 'Offline';
              let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
              let indicatorColor = 'bg-slate-400';
              let borderClass = 'border-[var(--border-subtle)]';

              if (isOnline) {
                if (activeSession?.stopReason === 'IDLE') {
                  currentStatus = 'IDLE';
                  statusLabel = 'Idle';
                  badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300';
                  indicatorColor = 'bg-rose-500 animate-pulse';
                  borderClass = 'border-rose-500/50 hover:border-rose-500';
                } else if (activeSession?.stopReason === 'BREAK' || activeSession?.stopReason === 'LUNCH') {
                  currentStatus = 'BREAK';
                  statusLabel = 'On Break';
                  badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
                  indicatorColor = 'bg-amber-500';
                  borderClass = 'border-amber-500/50 hover:border-amber-500';
                } else {
                  currentStatus = 'WORKING';
                  statusLabel = 'Working';
                  badgeClass = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300';
                  indicatorColor = 'bg-indigo-500 animate-pulse';
                  borderClass = 'border-indigo-500/50 hover:border-indigo-600';
                }
              }

              const latestActivity = activeSession?.activities?.[activeSession.activities.length - 1];
              const appName = latestActivity?.app || 'Offline Mode';

              // Calculate duration in status
              const getStatusDuration = () => {
                if (!todayAtt || todayAtt.clockOut) return 'Offline';
                const startTime = activeSession ? new Date(activeSession.start).getTime() : new Date(todayAtt.clockIn).getTime();
                const diffMs = Date.now() - startTime;
                const diffMins = Math.round(diffMs / (1000 * 60));
                if (diffMins < 60) return `${diffMins}m`;
                return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
              };

              // Calculate Idle Duration alert text
              const getIdleAlertText = () => {
                if (!activeSession) return 'No activity detected';
                const idleSecs = latestActivity?.idleDuration || 0;
                const idleMins = Math.round(idleSecs / 60);
                return `No activity detected for ${idleMins || 25}m`;
              };

              return (
                <div 
                  key={emp.id} 
                  className={`glass-card p-5 border flex flex-col justify-between transition-all duration-200 ${borderClass}`}
                  style={{ background: 'var(--bg-card)' }}
                >
                  <div>
                    {/* Avatar & Title Block */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg,#4f46e5,#6063ee)' }}>
                            {initials || '?'}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-[#1a1936] rounded-full ${indicatorColor}`} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {emp.user?.firstName} {emp.user?.lastName}
                          </h4>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {emp.department?.name || (typeof emp.department === 'string' ? emp.department : '') || 'Staff'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* App logs & Active Task Box */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="truncate">{appName}</span>
                      </div>

                      {currentStatus === 'WORKING' && (
                        <div className="p-2.5 rounded-lg border text-[11px]" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                          <p className="text-[9px] font-bold text-indigo-500 uppercase mb-1">Active Task</p>
                          <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {latestActivity?.windowTitle || 'Developing portal view specs'}
                          </p>
                        </div>
                      )}

                      {currentStatus === 'IDLE' && (
                        <div className="p-2.5 rounded-lg border text-[11px] bg-rose-500/5 border-rose-500/20">
                          <p className="text-[9px] font-bold text-rose-500 uppercase mb-1">Inactive Alert</p>
                          <p className="font-semibold truncate text-rose-500">
                            {getIdleAlertText()}
                          </p>
                        </div>
                      )}

                      {currentStatus === 'BREAK' && (
                        <div className="p-2.5 rounded-lg border text-[11px] opacity-60" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                          <p className="text-[9px] font-bold text-amber-500 uppercase mb-1">Last Task</p>
                          <p className="font-semibold truncate" style={{ color: 'var(--text-muted)' }}>
                            {latestActivity?.windowTitle || 'Lunch / Offsite Break'}
                          </p>
                        </div>
                      )}

                      {currentStatus === 'OFFLINE' && (
                        <div className="p-2.5 rounded-lg border text-[11px] opacity-40" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                          <p className="text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Last Status</p>
                          <p className="font-semibold truncate" style={{ color: 'var(--text-muted)' }}>
                            Desktop agent disconnected
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Status Duration */}
                  <div className="mt-4 pt-3 border-t flex justify-between items-center text-[10px]" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      In status for: <strong style={{ color: 'var(--text-primary)' }}>{getStatusDuration()}</strong>
                    </span>
                    <button 
                      onClick={() => onViewReport(emp)}
                      className="text-indigo-500 hover:text-indigo-600 font-bold uppercase tracking-wider"
                    >
                      View Reports
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}

      {/* Render Subtab 2: Attendance Overview */}
      {subTab === 'attendance' && (
        <>
          {/* Summary Dashboard Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="glass-card py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Present</span>
                <span className="text-xs font-bold text-emerald-500">+4.2%</span>
              </div>
              <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{presentCount}</h3>
            </div>
            <div className="glass-card py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Absent</span>
                <span className="text-xs font-bold text-red-500">-2.1%</span>
              </div>
              <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{absentCount}</h3>
            </div>
            <div className="glass-card py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Late</span>
                <span className="text-xs font-bold text-amber-500">+1.2%</span>
              </div>
              <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{lateCount}</h3>
            </div>
            <div className="glass-card py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>On Leave</span>
                <span className="text-xs font-bold text-indigo-500">Steady</span>
              </div>
              <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{leaveCount}</h3>
            </div>
            <div className="glass-card py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Remote</span>
                <span className="text-xs font-bold text-indigo-400">+8.0%</span>
              </div>
              <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{remoteCount}</h3>
            </div>
          </section>

          {/* Data Table */}
          <div className="overflow-x-auto border border-[var(--border-base)] rounded-xl bg-[var(--bg-card)] shadow-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-card-alt)] text-[var(--text-secondary)] border-b border-[var(--border-base)] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Employee</th>
                  <th className="py-3.5 px-6">Shift Type</th>
                  <th className="py-3.5 px-6">Clock In</th>
                  <th className="py-3.5 px-6">Clock Out</th>
                  <th className="py-3.5 px-6">Worked Hours</th>
                  <th className="py-3.5 px-6">Attendance Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-base)]/30">
                {filteredEmployees.map((emp) => {
                  const todayAtt = (emp.attendances || []).find(a => new Date(a.clockIn).toDateString() === todayStr);
                  const isPresent = Boolean(todayAtt);
                  const isClockedIn = todayAtt && !todayAtt.clockOut;
                  const initials = `${emp.user?.firstName?.[0] || ''}${emp.user?.lastName?.[0] || ''}`.toUpperCase();

                  let isUserLate = false;
                  if (todayAtt) {
                    const clockInDate = new Date(todayAtt.clockIn);
                    isUserLate = clockInDate.getHours() > 9 || (clockInDate.getHours() === 9 && clockInDate.getMinutes() > 15);
                  }

                  let shiftDuration = 0;
                  if (todayAtt) {
                    const clockInTime = new Date(todayAtt.clockIn).getTime();
                    const clockOutTime = todayAtt.clockOut ? new Date(todayAtt.clockOut).getTime() : now.getTime();
                    shiftDuration = clockOutTime - clockInTime;
                  }

                  let statusBadge = 'Absent';
                  let badgeClass = 'badge-rose';
                  let dotColor = 'bg-rose-500';

                  if (emp.status === 'ON_LEAVE') {
                    statusBadge = 'On Leave';
                    badgeClass = 'badge-violet';
                    dotColor = 'bg-violet-500';
                  } else if (isClockedIn) {
                    if (isUserLate) {
                      statusBadge = 'Late';
                      badgeClass = 'badge-amber';
                      dotColor = 'bg-amber-500 animate-pulse';
                    } else {
                      statusBadge = 'Present';
                      badgeClass = 'badge-emerald';
                      dotColor = 'bg-emerald-500 animate-pulse';
                    }
                  } else if (isPresent) {
                    statusBadge = 'Clocked Out';
                    badgeClass = 'badge-indigo';
                    dotColor = 'bg-indigo-500';
                  }

                  return (
                    <tr key={emp.id} className="border-b border-[var(--border-base)]/30 hover:bg-[var(--bg-card-alt)]/40 transition duration-200">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                            style={{ background: 'linear-gradient(135deg,#4f46e5,#818cf8)' }}>
                            {initials}
                          </div>
                          <div>
                            <span className="block font-bold" style={{ color: 'var(--text-primary)' }}>{emp.user?.firstName} {emp.user?.lastName}</span>
                            <span className="block text-[10px]" style={{ color: 'var(--text-muted)' }}>{emp.designation || 'Staff'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-[var(--text-secondary)] font-semibold">
                        <span className="flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5 text-amber-500" /> Morning Shift
                        </span>
                      </td>
                      <td className="py-3 px-6 font-mono text-[var(--text-secondary)]">
                        {todayAtt ? new Date(todayAtt.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-6 font-mono text-[var(--text-secondary)]">
                        {todayAtt?.clockOut ? new Date(todayAtt.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : todayAtt ? <span className="text-emerald-400 font-semibold">Working</span> : '—'}
                      </td>
                      <td className="py-3 px-6 font-mono font-bold" style={{ color: todayAtt ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {todayAtt ? formatMs(shiftDuration) : '—'}
                      </td>
                      <td className="py-3 px-6">
                        <span className={`badge ${badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {statusBadge}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => onViewReport(emp)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-indigo-500 border border-[var(--border-subtle)] rounded-lg text-xs font-bold hover:text-indigo-600 transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
