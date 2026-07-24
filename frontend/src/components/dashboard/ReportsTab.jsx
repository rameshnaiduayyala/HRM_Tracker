import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Activity, Printer, FileText, Coffee, Monitor, Users, Eye, ArrowLeft, RefreshCw, RotateCcw, ChevronDown } from 'lucide-react';
import Button from '../Button';
import Select from '../Select';
import { employeeApi } from '../../services/employee.service';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

import Accordion from '../Accordion';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-lg shadow-xl text-[11px] font-mono">
        <p className="font-bold text-white mb-1">{data.name}</p>
        <p className="text-emerald-400">⏱️ Active: {data.value}m</p>
        <p className="text-indigo-400">📊 Share: {data.percentage}%</p>
      </div>
    );
  }
  return null;
};

export default function ReportsTab({ employees = [], onRefresh }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const employeeIdFromUrl = searchParams.get('employeeId');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    employeeIdFromUrl || location.state?.selectedEmployeeId || ''
  );
  const [timeframe, setTimeframe] = useState('week'); // 'day', 'week', 'month', 'year'

  // Synchronize state if URL search query changes
  useEffect(() => {
    if (employeeIdFromUrl !== null && employeeIdFromUrl !== selectedEmployeeId) {
      setSelectedEmployeeId(employeeIdFromUrl);
    }
  }, [employeeIdFromUrl]);

  const handleSelectEmployee = (id) => {
    setSelectedEmployeeId(id);
    if (id) {
      navigate(`/dashboard/reports?employeeId=${id}`, { replace: true });
    } else {
      navigate('/dashboard/reports', { replace: true });
    }
  };

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Find selected employee and their details
  const currentEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  // Timeframe calculation helper
  const getFilteredData = () => {
    if (!currentEmployee) return { attendances: [], workSessions: [] };
    const now = new Date();
    let cutoff = new Date();
    if (timeframe === 'day') cutoff.setDate(now.getDate() - 1);
    else if (timeframe === 'week') cutoff.setDate(now.getDate() - 7);
    else if (timeframe === 'month') cutoff.setMonth(now.getMonth() - 1);
    else if (timeframe === 'year') cutoff.setFullYear(now.getFullYear() - 1);

    const attendances = (currentEmployee.attendances || []).filter(
      (att) => new Date(att.clockIn) >= cutoff
    );
    const workSessions = (currentEmployee.workSessions || []).filter(
      (ws) => new Date(ws.start) >= cutoff
    );
    return { attendances, workSessions };
  };

  const { attendances: filteredAtts, workSessions: filteredSessions } = getFilteredData();

  // Aggregate statistics
  const now = new Date();
  let totalLoggedMs = 0;
  filteredAtts.forEach(att => {
    const start = new Date(att.clockIn).getTime();
    const end = att.clockOut ? new Date(att.clockOut).getTime() : now.getTime();
    totalLoggedMs += (end - start);
  });

  let totalWorkMs = 0;
  filteredSessions.forEach(ws => {
    const start = new Date(ws.start).getTime();
    const end = ws.end ? new Date(ws.end).getTime() : now.getTime();
    totalWorkMs += (end - start);
  });

  // Aggregate application usage statistics
  const appStats = {};
  let totalSessionActiveTime = 0;
  
  filteredSessions.forEach(session => {
    (session.activities || []).forEach(act => {
      const appName = act.app || 'Unknown';
      if (!appStats[appName]) {
        appStats[appName] = {
          app: appName,
          activeDuration: 0,
          idleDuration: 0,
          totalDuration: 0,
          windows: new Set()
        };
      }
      appStats[appName].activeDuration += act.activeDuration;
      appStats[appName].idleDuration += act.idleDuration;
      appStats[appName].totalDuration += (act.activeDuration + act.idleDuration);
      if (act.windowTitle) {
        appStats[appName].windows.add(act.windowTitle);
      }
      totalSessionActiveTime += act.activeDuration;
    });
  });

  const sortedAppStats = Object.values(appStats)
    .sort((a, b) => b.activeDuration - a.activeDuration)
    .map(stat => {
      const pct = totalSessionActiveTime > 0 
        ? ((stat.activeDuration / totalSessionActiveTime) * 100) 
        : 0;
      return {
        ...stat,
        percentage: Math.round(pct),
        uniqueWindows: stat.windows.size
      };
    });

  const appColors = [
    '#6366F1', // Indigo (VS Code / Editors)
    '#10B981', // Emerald (Browsers)
    '#F59E0B', // Amber (Slack / Chat)
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#14B8A6', // Teal
  ];
  const getAppColor = (idx) => appColors[idx % appColors.length];

  const totalBreakMs = Math.max(0, totalLoggedMs - totalWorkMs);
  const formatMs = (ms) => (ms / (1000 * 60 * 60)).toFixed(2) + ' hrs';

  const [isResetting, setIsResetting] = useState(false);
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);
  const [showRawLogs, setShowRawLogs] = useState(false);

  const handleResetData = async () => {
    if (!selectedEmployeeId) return;
    const confirmReset = window.confirm(`Are you sure you want to reset all tracked session, attendance, screenshot, and activity log data for ${currentEmployee?.user?.firstName || 'this employee'}?`);
    if (!confirmReset) return;

    try {
      setIsResetting(true);
      await employeeApi.reset(selectedEmployeeId);
      if (onRefresh) await onRefresh();
      alert('Employee tracking logs and activity history reset successfully.');
    } catch (err) {
      console.error('Failed to reset employee data:', err);
      alert(err.response?.data?.message || 'Failed to reset employee data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">


      {!selectedEmployeeId || !currentEmployee ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Employees & Today's Attendance Summary
            </h3>
            <span className="badge badge-indigo">{employees.length} Employees</span>
          </div>

          <div className="overflow-x-auto border border-[var(--border-base)] rounded-xl bg-[var(--bg-card-alt)]/10 shadow-lg">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[var(--bg-card-alt)] text-[var(--text-secondary)] border-b border-[var(--border-base)] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Today's Attendance</th>
                  <th className="py-3 px-4">Clock In Time</th>
                  <th className="py-3 px-4">Clock Out Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-base)]/30">
                {employees.map((emp) => {
                  const todayStr = new Date().toDateString();
                  const todayAtt = (emp.attendances || []).find(
                    (att) => new Date(att.clockIn).toDateString() === todayStr
                  );
                  const isPresent = Boolean(todayAtt);
                  const isClockedIn = todayAtt && !todayAtt.clockOut;

                  return (
                    <tr key={emp.id} className="border-b border-[var(--border-base)]/30 hover:bg-[var(--bg-card-alt)]/40 transition duration-200">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                            style={{ background: 'linear-gradient(135deg,#4f46e5,#818cf8)' }}>
                            {emp.user?.firstName?.[0] || '?'}{emp.user?.lastName?.[0] || '?'}
                          </div>
                          <div>
                            <span className="block font-semibold text-[var(--text-primary)]">{emp.user?.firstName} {emp.user?.lastName}</span>
                            <span className="block text-[10px] text-[var(--text-muted)] font-mono">{emp.employeeNum}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{emp.designation || 'Staff Member'}</td>
                      <td className="py-3 px-4">
                        {isClockedIn ? (
                          <span className="badge badge-emerald">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Clocked In (Active)
                          </span>
                        ) : isPresent ? (
                          <span className="badge badge-indigo">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            Present (Clocked Out)
                          </span>
                        ) : (
                          <span className="badge badge-rose">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Absent / Not Logged
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                        {todayAtt ? new Date(todayAtt.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                        {todayAtt?.clockOut ? new Date(todayAtt.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : todayAtt ? <span className="text-emerald-400 font-semibold">Active Now</span> : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSelectEmployee(emp.id)}
                            className="text-xs px-3 py-1 flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              const confirmReset = window.confirm(`Reset all time tracking & activity logs for ${emp.user?.firstName} ${emp.user?.lastName}?`);
                              if (!confirmReset) return;
                              try {
                                await employeeApi.reset(emp.id);
                                if (onRefresh) await onRefresh();
                                alert(`Reset tracking data for ${emp.user?.firstName} successfully.`);
                              } catch (err) {
                                alert(err.response?.data?.message || 'Failed to reset employee data');
                              }
                            }}
                            className="text-xs p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800/40"
                            title="Reset Tracking Data"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-[var(--text-muted)] italic">
                      No employees registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div ref={printRef} id="print-section" className="flex flex-col gap-4 print:bg-white print:text-black">
            
            {/* Print Header */}
            <div className="hidden print:block border-b pb-4 mb-4 border-gray-200">
              <h1 className="text-2xl font-bold">TASKTRACKY STAFF TRACKING AUDIT REPORT</h1>
              <p className="text-xs text-[var(--text-muted)]">Report Compiled On {new Date().toLocaleDateString()}</p>
            </div>

            {/* Unified Dashboard Header Card */}
            <div className="p-4 px-5 bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-card-alt)]/30 border border-[var(--border-base)] rounded-2xl print:bg-white print:border-gray-200 space-y-4 shadow-xl">
              
              {/* Row 1: Employee Details & Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-base)]/40">
                <div className="flex items-center gap-3.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectEmployee('')}
                    className="print:hidden text-[10px] font-bold flex items-center gap-1 px-2.5 py-1.5 border-[var(--border-base)] hover:border-indigo-500/30 shrink-0 uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </Button>
                  
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 shadow-lg border border-indigo-500/20"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                    {currentEmployee?.user?.firstName?.[0] || '?'}{currentEmployee?.user?.lastName?.[0] || '?'}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2">
                      {currentEmployee?.user?.firstName} {currentEmployee?.user?.lastName}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-mono bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-semibold print:hidden">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Live
                      </span>
                    </h3>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                      <span className="text-indigo-400 font-semibold">{currentEmployee?.designation || 'Staff Member'}</span>
                      <span className="text-[var(--text-muted)] mx-1 font-normal">|</span>
                      <span className="font-mono text-[var(--text-muted)]">{currentEmployee?.employeeNum}</span>
                    </p>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2.5 print:hidden">
                  <div className="flex gap-0.5 bg-[var(--bg-card)] p-0.5 rounded-lg border border-[var(--border-base)]">
                    {['day', 'week', 'month', 'year'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-2.5 py-1 text-[9px] font-extrabold rounded-md uppercase tracking-wider transition duration-150 ${
                          timeframe === t
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {t === 'day' ? '24h' : t === 'week' ? '7d' : t === 'month' ? '30d' : '365d'}
                      </button>
                    ))}
                  </div>

                  <Button onClick={handlePrint} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border-[var(--border-base)] hover:border-indigo-500/25">
                    <Printer className="w-3 h-3 text-indigo-400" /> Print
                  </Button>

                  <Button 
                    onClick={handleResetData} 
                    disabled={isResetting}
                    variant="secondary" 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800/30"
                  >
                    <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} /> Reset
                  </Button>
                </div>
              </div>

              {/* Row 2: KPI Stats Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-[var(--bg-card-alt)]/25 border border-[var(--border-base)]/40 rounded-xl flex items-center gap-4 transition duration-300 hover:border-indigo-500/20">
                  <div className="w-9 h-9 flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Total Hours</span>
                    <span className="text-base font-bold text-white print:text-black font-mono tracking-tight">{formatMs(totalLoggedMs)}</span>
                    <span className="text-[8px] text-[var(--text-muted)] font-mono block mt-0.5 leading-none">Shift attendance logged</span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg-card-alt)]/25 border border-[var(--border-base)]/40 rounded-xl flex items-center gap-4 transition duration-300 hover:border-emerald-500/20">
                  <div className="w-9 h-9 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Active Hours</span>
                    <span className="text-base font-bold text-emerald-400 print:text-emerald-600 font-mono tracking-tight">{formatMs(totalWorkMs)}</span>
                    <span className="text-[8px] text-emerald-400 font-mono block mt-0.5 leading-none">
                       Efficiency: {totalLoggedMs > 0 ? Math.round((totalWorkMs / totalLoggedMs) * 100) : 0}%
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg-card-alt)]/25 border border-[var(--border-base)]/40 rounded-xl flex items-center gap-4 transition duration-300 hover:border-amber-500/20">
                  <div className="w-9 h-9 flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg shrink-0">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Break & Idle</span>
                    <span className="text-base font-bold text-amber-400 print:text-amber-600 font-mono tracking-tight">{formatMs(totalBreakMs)}</span>
                    <span className="text-[8px] text-amber-400 font-mono block mt-0.5 leading-none">
                      Idle Share: {totalLoggedMs > 0 ? Math.round((totalBreakMs / totalLoggedMs) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance and Breaks Sheet */}
            <Accordion title="Attendance & Breaks Breakdown" icon={<Clock className="w-4 h-4 text-indigo-400" />} badge={filteredAtts.length}>
              <div className="overflow-x-auto border border-[var(--border-base)] rounded-xl bg-[var(--bg-card-alt)]/10">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[var(--bg-card-alt)] text-[var(--text-secondary)] border-b border-[var(--border-base)] font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Login Time</th>
                      <th className="py-3 px-4">Logout Time</th>
                      <th className="py-3 px-4">Logged Duration</th>
                      <th className="py-3 px-4">Active Working</th>
                      <th className="py-3 px-4 text-right">Breaks Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-base)]/30">
                    {filteredAtts.map((att, idx) => {
                      const clockInTime = new Date(att.clockIn).getTime();
                      const clockOutTime = att.clockOut ? new Date(att.clockOut).getTime() : now.getTime();
                      const shiftDuration = clockOutTime - clockInTime;

                      // Extract work sessions during this shift
                      const sessionsInShift = (currentEmployee.workSessions || []).filter(ws => {
                        const wsStart = new Date(ws.start).getTime();
                        return wsStart >= clockInTime && wsStart <= clockOutTime;
                      });

                      let shiftWorkMs = 0;
                      sessionsInShift.forEach(ws => {
                        const start = new Date(ws.start).getTime();
                        const end = ws.end ? new Date(ws.end).getTime() : now.getTime();
                        shiftWorkMs += (end - start);
                      });

                      const shiftBreakMs = Math.max(0, shiftDuration - shiftWorkMs);

                      return (
                        <tr key={att.id || idx} className="border-b border-[var(--border-base)]/30 hover:bg-[var(--bg-card-alt)]/40 transition duration-200">
                          <td className="py-3 px-4 text-[var(--text-primary)]">{new Date(att.clockIn).toLocaleString()}</td>
                          <td className="py-3 px-4 text-[var(--text-primary)]">
                            {att.clockOut ? new Date(att.clockOut).toLocaleString() : <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/30">🟢 Active Shift</span>}
                          </td>
                          <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{formatMs(shiftDuration)}</td>
                          <td className="py-3 px-4 text-emerald-400 font-mono font-bold">{formatMs(shiftWorkMs)}</td>
                          <td className="py-3 px-4 text-right text-amber-400 font-mono font-bold">{formatMs(shiftBreakMs)}</td>
                        </tr>
                      );
                    })}
                    {filteredAtts.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-[var(--text-muted)] italic">
                          No attendance history recorded for the selected filter timeframe.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Accordion>

            {/* Active Session logs */}
            <Accordion title="Active Session Intervals" icon={<Activity className="w-4 h-4 text-purple-400" />} badge={filteredSessions.length}>
              <div className="overflow-x-auto border border-[var(--border-base)] rounded-xl bg-[var(--bg-card-alt)]/10">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[var(--bg-card-alt)] text-[var(--text-secondary)] border-b border-[var(--border-base)] font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Session Start</th>
                      <th className="py-3 px-4">Session End</th>
                      <th className="py-3 px-4">Stop Reason</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-base)]/30">
                    {filteredSessions.map((session, idx) => {
                      const startDate = new Date(session.start);
                      const endDate = session.end ? new Date(session.end) : null;

                      return (
                        <tr key={session.id || idx} className="border-b border-[var(--border-base)]/30 hover:bg-[var(--bg-card-alt)]/40 transition duration-200">
                          <td className="py-3 px-4 text-[var(--text-primary)]">{startDate.toLocaleString()}</td>
                          <td className="py-3 px-4 text-[var(--text-primary)]">
                            {endDate ? endDate.toLocaleString() : <span className="text-[var(--text-muted)]">—</span>}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                            {session.stopReason ? (
                              <span className="px-2 py-0.5 rounded bg-amber-950/20 text-amber-400 border border-amber-800/20 text-[10px] font-semibold">{session.stopReason}</span>
                            ) : (
                              <span className="text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                              session.status === 'RUNNING' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/30' : 'bg-gray-800/80 text-[var(--text-secondary)] border-[var(--border-base)]'
                            }`}>
                              {session.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSessions.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-[var(--text-muted)] italic">
                          No session activities logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Accordion>

            {/* Monitored Background Heartbeats */}
            <Accordion title="Monitored Application Usage" icon={<Monitor className="w-4 h-4 text-amber-400" />} badge={sortedAppStats.length}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">Smart visual breakdown of time spent across workstation software application sessions.</p>
                </div>
                
                <button
                  onClick={() => setShowRawLogs(!showRawLogs)}
                  className="px-3 py-1.5 text-[10px] font-semibold font-mono border border-[var(--border-base)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-indigo-500/50 hover:bg-[var(--bg-card-alt)] transition self-start md:self-auto"
                >
                  {showRawLogs ? '📊 Show Smart Graph' : '📋 View Raw Telemetry Logs'}
                </button>
              </div>

              {!showRawLogs ? (
                <div>
                  <div className="flex flex-col lg:flex-row items-center gap-6 mb-6">
                    {/* Donut Chart Visualizer */}
                    <div className="w-full lg:w-1/2 h-64 flex items-center justify-center bg-gray-950/20 border border-[var(--border-base)]/50 rounded-2xl p-4">
                      {sortedAppStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sortedAppStats.map((stat, idx) => ({
                                name: stat.app,
                                value: Math.round(stat.activeDuration / 60),
                                percentage: stat.percentage,
                                color: getAppColor(idx)
                              }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {sortedAppStats.map((stat, idx) => (
                                <Cell key={`cell-${idx}`} fill={getAppColor(idx)} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36} 
                              iconType="circle"
                              iconSize={8}
                              formatter={(value) => <span className="text-[10px] text-[var(--text-secondary)] font-mono">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-xs text-[var(--text-muted)] font-mono italic">
                          No active application log telemetry found to plot
                        </div>
                      )}
                    </div>

                    {/* Quick Stats Summary List */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-3">
                      <div className="bg-[var(--bg-card-alt)]/25 border border-[var(--border-base)]/40 p-4 rounded-xl">
                        <span className="text-[10px] text-[var(--text-muted)] font-mono block">TOP ACTIVE APPLICATION</span>
                        <span className="text-sm font-bold text-[var(--text-primary)] mt-1 block">
                          {sortedAppStats[0]?.app || 'None'}
                        </span>
                        {sortedAppStats[0] && (
                          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                            Active for {(sortedAppStats[0].activeDuration / 60).toFixed(1)} mins today ({sortedAppStats[0].percentage}%)
                          </span>
                        )}
                      </div>
                      <div className="bg-[var(--bg-card-alt)]/25 border border-[var(--border-base)]/40 p-4 rounded-xl">
                        <span className="text-[10px] text-[var(--text-muted)] font-mono block">MONITORED PROCESSES</span>
                        <span className="text-sm font-bold text-[var(--text-primary)] mt-1 block">
                          {sortedAppStats.length} Unique App{sortedAppStats.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">
                          Actively gathering workstation processes telemetry.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* App Breakdown Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedAppStats.map((stat, idx) => {
                      const color = getAppColor(idx);
                      const activeMins = (stat.activeDuration / 60).toFixed(1);
                      const idleMins = (stat.idleDuration / 60).toFixed(1);
                      return (
                        <div 
                          key={stat.app} 
                          className="p-4 bg-[var(--bg-card-alt)]/40 border border-[var(--border-base)] rounded-xl flex flex-col justify-between hover:border-indigo-500/30 transition duration-300 group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="font-bold text-[var(--text-primary)] text-xs truncate">{stat.app}</span>
                              </div>
                              <span className="font-mono text-xs font-bold shrink-0" style={{ color: color }}>{stat.percentage}%</span>
                            </div>
                            
                            <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden mb-3">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stat.percentage}%`, backgroundColor: color }} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] mt-1 border-t border-[var(--border-base)]/20 pt-2">
                            <span>💻 Active: <strong className="text-emerald-400">{activeMins}m</strong></span>
                            <span>☕ Idle: <strong className="text-amber-400">{idleMins}m</strong></span>
                            <span>📂 Window Logs: <strong className="text-purple-400">{stat.uniqueWindows}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {sortedAppStats.length === 0 && (
                    <div className="text-center py-8 text-[var(--text-muted)] italic text-xs">
                      No application usage recorded. Start the desktop client to sync telemetry.
                    </div>
                  )}
                </div>
              ) : (
                /* Raw Telemetry Logs Table */
                <div className="overflow-x-auto max-h-80 overflow-y-auto border border-[var(--border-base)] rounded-xl bg-[var(--bg-card-alt)]/10">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-[var(--bg-card-alt)] text-[var(--text-secondary)] border-b border-[var(--border-base)] font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Application</th>
                        <th className="py-3 px-4">Window Title</th>
                        <th className="py-3 px-4 text-right">Active / Idle Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-base)]/30 font-mono text-[11px]">
                      {filteredSessions.flatMap(s => s.activities || []).map((act, idx) => (
                        <tr key={act.id || idx} className="hover:bg-[var(--bg-card-alt)]/40 text-[var(--text-primary)] transition duration-150">
                          <td className="py-2.5 px-4 text-[var(--text-secondary)] shrink-0 whitespace-nowrap">
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-4 text-indigo-400 font-bold whitespace-nowrap">{act.app}</td>
                          <td className="py-2.5 px-4 text-[var(--text-primary)] truncate max-w-xs">{act.windowTitle || <span className="text-[var(--text-muted)]">N/A</span>}</td>
                          <td className="py-2.5 px-4 text-right font-semibold whitespace-nowrap">
                            <span className="text-emerald-400">{act.activeDuration}s active</span>
                            <span className="text-[var(--text-muted)] mx-1">/</span>
                            <span className="text-amber-400">{act.idleDuration}s idle</span>
                          </td>
                        </tr>
                      ))}
                      {filteredSessions.flatMap(s => s.activities || []).length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-[var(--text-muted)] italic">
                            No active desktop application heartbeats recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Accordion>

            {/* Captured Laptop Screenshots Timeline */}
            <Accordion title="Captured Screenshots" icon={<Monitor className="w-4 h-4 text-emerald-400" />} badge={filteredSessions.flatMap(s => s.screenshots || []).length}>
              <p className="text-xs text-[var(--text-secondary)] mb-4 print:hidden">Continuous background laptop screen capture reports generated during active tracker sessions.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const allScreenshots = filteredSessions.flatMap(s => s.screenshots || []);
                  const allActivities = filteredSessions.flatMap(s => s.activities || []);

                  if (allScreenshots.length > 0) {
                    return allScreenshots.map((sc, idx) => {
                      const imgUrl = sc.storagePath?.startsWith('http')
                        ? sc.storagePath
                        : sc.storagePath?.startsWith('/uploads')
                        ? `http://localhost:5000${sc.storagePath}`
                        : `http://localhost:5000/uploads/${sc.storagePath}`;

                      return (
                        <div key={sc.id || idx} className="group relative border border-[var(--border-base)] hover:border-indigo-500/50 rounded-xl bg-[var(--bg-card-alt)] p-2.5 transition duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-600/5 print:break-inside-avoid">
                          <div className="flex items-center justify-between gap-2 mb-2 text-[10px]">
                            <span className="font-bold text-[var(--text-primary)] truncate">Screenshot #{idx + 1}</span>
                            <span className="text-[var(--text-muted)] font-mono">{new Date(sc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div 
                            onClick={() => setActiveLightboxImg(imgUrl)}
                            className="w-full h-32 bg-black/40 rounded border border-[var(--border-base)] overflow-hidden flex items-center justify-center relative cursor-zoom-in group/img"
                          >
                            <img
                              src={imgUrl}
                              alt={`Screenshot ${idx + 1}`}
                              className="w-full h-full object-cover rounded hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="text-[9px] text-[var(--text-muted)] p-2 text-center flex flex-col items-center justify-center h-full"><span>🖼️ Image File Syncing</span><span class="text-[8px] text-[var(--text-secondary)] mt-1">Saved on Agent Local Storage</span></div>';
                              }}
                            />
                            {/* Hover Zoom Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white font-medium select-none">
                              <span>🔍</span> Click to Expand
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                            <span className="text-emerald-400 font-semibold">Captured Screen</span>
                            <span className="text-[var(--text-muted)]">{new Date(sc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    });
                  }
                  return (
                    <div className="col-span-full text-center text-[var(--text-muted)] py-12 border border-dashed border-[var(--border-muted)] rounded-2xl bg-[var(--bg-card-alt)]/20">
                      <Monitor className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No screenshots captured for this timeframe yet.</p>
                    </div>
                  );
                })()}
                {filteredSessions.flatMap(s => (s.screenshots || []).concat(s.activities || [])).length === 0 && (
                  <div className="col-span-full text-center text-[var(--text-muted)] py-6 italic">
                    No captured screenshots compiled.
                  </div>
                )}
              </div>
            </Accordion>

          </div>
      )}

      {/* Lightbox Fullscreen Modal */}
      {activeLightboxImg && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setActiveLightboxImg(null)}
        >
          {/* Close button */}
          <button 
            onClick={() => setActiveLightboxImg(null)}
            className="absolute top-4 right-4 bg-gray-900/80 border border-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-gray-850 hover:text-red-400 transition"
          >
            ✕
          </button>
          
          {/* Enlarged Image Container */}
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center bg-black/50 p-2 rounded-xl border border-gray-850 shadow-2xl">
            <img 
              src={activeLightboxImg} 
              alt="Fullscreen Screen Capture" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()} // Prevent modal closure when clicking image
            />
          </div>
          
          <div className="mt-4 text-xs text-gray-400 font-mono select-none">
            Click anywhere to close full screen
          </div>
        </div>
      )}
    </div>
  );
}




