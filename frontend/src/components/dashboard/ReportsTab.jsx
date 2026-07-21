import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useLocation } from 'react-router-dom';
import { Calendar, Clock, Activity, Printer, FileText, Coffee, Monitor } from 'lucide-react';
import Button from '../Button';
import Select from '../Select';

export default function ReportsTab({ employees = [] }) {
  const location = useLocation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    location.state?.selectedEmployeeId || ''
  );
  const [timeframe, setTimeframe] = useState('week'); // 'day', 'week', 'month', 'year'

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

  const totalBreakMs = Math.max(0, totalLoggedMs - totalWorkMs);
  const formatMs = (ms) => (ms / (1000 * 60 * 60)).toFixed(2) + ' hrs';

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#111827]/40 border border-gray-800/80 rounded-2xl backdrop-blur">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Employee Working Details & Shift Breaks
          </h2>
          <p className="text-xs text-gray-400">Select employee to view detailed timeline records, active time tracking, and breaks.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Employee selector */}
          <div className="w-64">
            <Select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full text-xs"
            >
              <option value="">-- Select Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user.firstName} {emp.user.lastName} ({emp.designation || 'Staff'})
                </option>
              ))}
            </Select>
          </div>

          {/* Timeframe switch */}
          {selectedEmployeeId && (
            <div className="flex gap-1 bg-gray-950 p-1 rounded-lg border border-gray-850">
              {['day', 'week', 'month', 'year'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md uppercase transition ${
                    timeframe === t
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'day' ? 'Last 24h' : t === 'week' ? 'Last 7d' : t === 'month' ? 'Last 30d' : 'Last 365d'}
                </button>
              ))}
            </div>
          )}

          {selectedEmployeeId && (
            <Button onClick={handlePrint} variant="secondary" className="flex items-center gap-2 px-4 py-2 text-xs">
              <Printer className="w-3.5 h-3.5" /> Print Sheet
            </Button>
          )}
        </div>
      </div>

      {!selectedEmployeeId ? (
        <div className="p-12 text-center border border-dashed border-gray-850 rounded-2xl bg-gray-900/10">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-300">No Employee Selected</h3>
          <p className="text-xs text-gray-500 mt-1">Please select a team member from the dropdown menu to compile the audit sheet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Printable Report Wrapper */}
          <div ref={printRef} id="print-section" className="space-y-6 bg-gray-900/10 p-1 print:bg-white print:text-black">
            
            {/* Print Header */}
            <div className="hidden print:block border-b pb-4 mb-4 border-gray-200">
              <h1 className="text-2xl font-bold">TASKTRACKY STAFF TRACKING AUDIT REPORT</h1>
              <p className="text-xs text-gray-500">Report Compiled On {new Date().toLocaleDateString()}</p>
            </div>

            {/* Employee Information Card */}
            <div className="p-6 bg-[#111827]/40 border border-gray-800 rounded-2xl print:bg-white print:border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white print:text-black">
                  {currentEmployee.user.firstName} {currentEmployee.user.lastName}
                </h3>
                <p className="text-xs text-indigo-400 font-semibold mt-0.5">{currentEmployee.designation || 'Staff Member'}</p>
              </div>
              <div className="text-xs text-gray-400 space-y-1 font-mono md:text-right print:text-black">
                <div>Employee Number: {currentEmployee.employeeNum}</div>
                <div>Contact Email: {currentEmployee.user.email}</div>
              </div>
            </div>

            {/* KPI Stats Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-[#111827]/40 border border-gray-800 rounded-2xl flex items-center gap-4 print:bg-white print:border-gray-200">
                <div className="p-3 bg-indigo-950/50 text-indigo-400 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Total Logged Hours</span>
                  <span className="text-xl font-bold text-white print:text-black font-mono">{formatMs(totalLoggedMs)}</span>
                </div>
              </div>

              <div className="p-6 bg-[#111827]/40 border border-gray-800 rounded-2xl flex items-center gap-4 print:bg-white print:border-gray-200">
                <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Active Tracker Hours</span>
                  <span className="text-xl font-bold text-emerald-400 print:text-emerald-600 font-mono">{formatMs(totalWorkMs)}</span>
                </div>
              </div>

              <div className="p-6 bg-[#111827]/40 border border-gray-800 rounded-2xl flex items-center gap-4 print:bg-white print:border-gray-200">
                <div className="p-3 bg-amber-950/50 text-amber-400 rounded-xl">
                  <Coffee className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Shift Breaks / Idle</span>
                  <span className="text-xl font-bold text-amber-400 print:text-amber-600 font-mono">{formatMs(totalBreakMs)}</span>
                </div>
              </div>
            </div>

            {/* Attendance and Breaks Sheet */}
            <div className="p-6 bg-[#111827]/30 border border-gray-800 rounded-2xl print:bg-white print:border-gray-200">
              <h4 className="text-sm font-semibold text-white print:text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Attendance & Breaks Breakdown
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-800 print:border-gray-300 text-gray-400 print:text-gray-600">
                      <th className="py-3">Login Time</th>
                      <th className="py-3">Logout Time</th>
                      <th className="py-3">Logged Duration</th>
                      <th className="py-3">Active Working</th>
                      <th className="py-3 text-right">Breaks Taken</th>
                    </tr>
                  </thead>
                  <tbody>
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
                        <tr key={att.id || idx} className="border-b border-gray-850/50 print:border-gray-200 text-gray-300 print:text-black">
                          <td className="py-3">{new Date(att.clockIn).toLocaleString()}</td>
                          <td className="py-3">
                            {att.clockOut ? new Date(att.clockOut).toLocaleString() : <span className="text-emerald-400 font-semibold">Active Clock-in</span>}
                          </td>
                          <td className="py-3 font-mono">{formatMs(shiftDuration)}</td>
                          <td className="py-3 text-emerald-400 print:text-emerald-600 font-mono">{formatMs(shiftWorkMs)}</td>
                          <td className="py-3 text-right text-amber-400 print:text-amber-600 font-mono">{formatMs(shiftBreakMs)}</td>
                        </tr>
                      );
                    })}
                    {filteredAtts.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-500 italic">
                          No attendance history recorded for the selected filter timeframe.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Session logs */}
            <div className="p-6 bg-[#111827]/30 border border-gray-800 rounded-2xl print:bg-white print:border-gray-200">
              <h4 className="text-sm font-semibold text-white print:text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" /> Active Session Intervals
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-800 print:border-gray-300 text-gray-400 print:text-gray-600">
                      <th className="py-3">Session Start</th>
                      <th className="py-3">Session End</th>
                      <th className="py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session, idx) => {
                      const startDate = new Date(session.start);
                      const endDate = session.end ? new Date(session.end) : null;

                      return (
                        <tr key={session.id || idx} className="border-b border-gray-850/50 print:border-gray-200 text-gray-300 print:text-black">
                          <td className="py-3">{startDate.toLocaleString()}</td>
                          <td className="py-3">
                            {endDate ? endDate.toLocaleString() : '-'}
                          </td>
                          <td className="py-3 text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              session.status === 'RUNNING' ? 'bg-emerald-950 text-emerald-400' : 'bg-gray-800 text-gray-400'
                            }`}>
                              {session.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSessions.length === 0 && (
                      <tr>
                        <td colSpan="3" className="py-4 text-center text-gray-500 italic">
                          No session activities logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monitored Background Heartbeats */}
            <div className="p-6 bg-[#111827]/30 border border-gray-800 rounded-2xl print:bg-white print:border-gray-200">
              <h4 className="text-sm font-semibold text-white print:text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-amber-400" /> Monitored Application Logs
              </h4>
              <div className="bg-[#0b0f19] border border-gray-850/60 rounded-xl p-4 max-h-60 overflow-y-auto font-mono text-[11px] text-gray-400 print:bg-white print:text-black print:border-gray-200 space-y-2">
                {filteredSessions.flatMap(s => s.activities || []).map((act, idx) => (
                  <div key={act.id || idx} className="flex justify-between border-b border-gray-900/50 pb-1.5">
                    <span>[{new Date(act.createdAt).toLocaleString()}] App: <strong>{act.app}</strong> - {act.windowTitle || 'N/A'}</span>
                    <span className="text-[10px] text-indigo-400 print:text-indigo-600 font-semibold">Active: {act.activeDuration}s / Idle: {act.idleDuration}s</span>
                  </div>
                ))}
                {filteredSessions.flatMap(s => s.activities || []).length === 0 && (
                  <div className="text-center text-gray-600 py-4 italic">
                    No active desktop application heartbeats recorded.
                  </div>
                )}
              </div>
            </div>

            {/* Captured Laptop Screenshots Timeline */}
            <div className="p-6 bg-[#111827]/30 border border-gray-800 rounded-2xl print:bg-white print:border-gray-200">
              <h4 className="text-sm font-semibold text-white print:text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-400" /> Laptop Captured Screens (Screenshot Timelines)
              </h4>
              <p className="text-xs text-gray-400 mb-4 print:hidden">Continuous background laptop screen capture reports generated during active tracker sessions.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {filteredSessions.flatMap(s => s.activities || []).map((act, idx) => {
                  const lowercaseApp = act.app.toLowerCase();
                  const isIdle = act.idleDuration >= 300;

                  return (
                    <div key={act.id || idx} className="group relative border border-gray-800 hover:border-indigo-500/50 rounded-xl bg-gray-950 p-2.5 transition duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-600/5 print:break-inside-avoid">
                      {/* Thumbnail Header */}
                      <div className="flex items-center justify-between gap-2 mb-2 text-[10px]">
                        <span className="font-bold text-gray-300 truncate max-w-[100px]">{act.app}</span>
                        <span className="text-gray-500 font-mono">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Mock Screen Content */}
                      {isIdle ? (
                        <div className="w-full h-24 bg-red-955/20 rounded border border-red-900/40 flex flex-col items-center justify-center text-center p-2 text-red-400">
                          <span className="text-xs">⚠️</span>
                          <span className="text-[8px] font-bold mt-1">IDLE AUTO-SUSPEND</span>
                          <span className="text-[7px] text-gray-400">No activity for 5m</span>
                        </div>
                      ) : lowercaseApp.includes('code') || lowercaseApp.includes('vs') || lowercaseApp.includes('editor') ? (
                        <div className="w-full h-24 bg-[#1e1e1e] rounded border border-gray-850 p-1 flex flex-col justify-between font-mono text-[5px] overflow-hidden select-none">
                          <div className="flex items-center gap-1 border-b border-[#2d2d2d] pb-0.5 mb-1 text-gray-500">
                            <span className="text-[#3c3c3c]">●</span>
                            <span className="text-gray-400 truncate max-w-[80px]">{act.windowTitle || 'App.jsx'}</span>
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-0.5"><span className="text-indigo-400">import</span> <span className="text-emerald-400">React</span> <span className="text-indigo-400">from</span> <span className="text-amber-400">'react'</span>;</div>
                            <div className="flex items-center gap-0.5 pl-1"><span className="text-purple-400">const</span> <span className="text-blue-400">App</span> <span className="text-gray-400">=</span> <span className="text-gray-400">()</span> <span className="text-purple-400">=&gt;</span> <span className="text-gray-400">{"{"}</span></div>
                            <div className="flex items-center gap-0.5 pl-2"><span className="text-indigo-400">return</span> <span className="text-gray-400">&lt;</span><span className="text-red-400">Dashboard</span> <span className="text-gray-400">/&gt;</span>;</div>
                            <div className="flex items-center pl-1"><span className="text-gray-400">{"}"}</span></div>
                          </div>
                          <div className="bg-[#007acc] text-white flex items-center justify-between px-1 text-[4px]">
                            <span>Ln 5, Col 12</span>
                            <span>UTF-8</span>
                          </div>
                        </div>
                      ) : lowercaseApp.includes('chrome') || lowercaseApp.includes('browser') || lowercaseApp.includes('safari') || lowercaseApp.includes('edge') ? (
                        <div className="w-full h-24 bg-white text-gray-800 rounded border border-gray-300 p-1 flex flex-col justify-between text-[5px] overflow-hidden select-none">
                          <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded mb-1 border-b border-gray-200">
                            <span className="text-[4px]">🔒</span>
                            <span className="text-gray-600 bg-white px-1 rounded flex-1 truncate">{act.windowTitle || 'https://google.com'}</span>
                          </div>
                          <div className="flex-1 space-y-0.5 p-0.5">
                            <div className="h-1 w-6 bg-indigo-500 rounded"></div>
                            <div className="grid grid-cols-3 gap-0.5">
                              <div className="h-8 bg-gray-150 rounded border border-gray-250"></div>
                              <div className="h-8 bg-gray-150 rounded border border-gray-250"></div>
                              <div className="h-8 bg-gray-150 rounded border border-gray-250"></div>
                            </div>
                          </div>
                        </div>
                      ) : lowercaseApp.includes('slack') || lowercaseApp.includes('teams') || lowercaseApp.includes('discord') || lowercaseApp.includes('chat') ? (
                        <div className="w-full h-24 bg-[#4a154b] text-white rounded border border-[#3f0e40] p-1 flex gap-1 text-[5px] overflow-hidden select-none">
                          <div className="w-6 border-r border-[#5b255c] pr-0.5 space-y-0.5 text-[4px]">
                            <span className="block font-bold text-[3px] text-[#bca3bc]">CHANNELS</span>
                            <span className="block text-[#e8912d]"># general</span>
                            <span className="block text-gray-300"># team</span>
                          </div>
                          <div className="flex-1 bg-white text-gray-800 p-0.5 rounded-sm flex flex-col justify-between">
                            <div className="space-y-0.5">
                              <div className="flex gap-0.5"><span className="font-bold text-[4px] text-indigo-600">Sarah:</span> <span className="text-[4px]">Pushed code</span></div>
                              <div className="flex gap-0.5"><span className="font-bold text-[4px] text-purple-600">John:</span> <span className="text-[4px]">Reviewing now</span></div>
                            </div>
                            <div className="border border-gray-200 p-0.5 rounded text-gray-400 bg-gray-50 text-[3px]">Message general...</div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-[#0c101b] rounded border border-gray-800 p-1 flex flex-col justify-between text-[4px] overflow-hidden select-none">
                          <div className="flex items-center justify-between border-b border-gray-850 pb-0.5 mb-1 text-gray-500">
                            <span className="font-semibold text-gray-400 truncate max-w-[70px]">{act.windowTitle || 'Desktop Workspace'}</span>
                            <span>✖</span>
                          </div>
                          <div className="flex-1 grid grid-cols-4 gap-0.5 p-1.5">
                            <div className="w-2 h-2 bg-indigo-500/20 rounded border border-indigo-500/40 flex items-center justify-center">📁</div>
                            <div className="w-2 h-2 bg-purple-500/20 rounded border border-purple-500/40 flex items-center justify-center">⚙</div>
                            <div className="w-2 h-2 bg-emerald-500/20 rounded border border-emerald-500/40 flex items-center justify-center">📊</div>
                          </div>
                          <div className="bg-[#111827] border-t border-gray-850 p-0.5 flex items-center justify-between text-gray-600">
                            <span>Start</span>
                            <span>Taskbar</span>
                          </div>
                        </div>
                      )}

                      {/* Active Ratios Overlay */}
                      <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                        <span className="text-emerald-400 font-semibold">{Math.round((act.activeDuration / (act.activeDuration + act.idleDuration || 1)) * 100)}% Active</span>
                        <span className="text-gray-500">{act.activeDuration}s / {act.idleDuration}s</span>
                      </div>
                    </div>
                  );
                })}
                {filteredSessions.flatMap(s => s.activities || []).length === 0 && (
                  <div className="col-span-full text-center text-gray-600 py-6 italic">
                    No captured screenshots compiled.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
