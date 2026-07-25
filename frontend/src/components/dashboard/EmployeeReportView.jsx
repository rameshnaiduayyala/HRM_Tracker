import React, { useState } from 'react';
import {
  ArrowLeft, Laptop, Play, Coffee, Activity, Clock,
  Monitor, Download, MessageSquare, Verified,
  BarChart2, HelpCircle, Calendar, Network, Users,
  LogIn, LogOut, Timer, TrendingUp, Zap, CheckCircle,
  AlertCircle, ChevronRight, Eye
} from 'lucide-react';
import { employeeApi } from '../../services/employee.service';

// ── Safe coercion for Prisma relation objects ──────────────────────────────
const toStr = (val, fallback = '') =>
  val?.name ?? (typeof val === 'string' ? val : fallback);

// ── Milliseconds → "Xh Ym" ─────────────────────────────────────────────────
const fmtMs = (ms) => {
  const totalMins = Math.floor(Math.max(0, ms) / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
};

// ── Format timestamp → "10:45 AM" ─────────────────────────────────────────
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ── Format timestamp → "Jul 26, 10:45 AM" ─────────────────────────────────
const fmtDateTime = (d) =>
  new Date(d).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const APP_COLORS = [
  'bg-indigo-500', 'bg-pink-500', 'bg-sky-500',
  'bg-orange-400', 'bg-purple-500', 'bg-teal-500',
];

export default function EmployeeReportView({ employee, onBack, onRefresh }) {
  const [timeframe, setTimeframe] = useState('week');
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  if (!employee) return null;

  // ── Initials ──────────────────────────────────────────────────────────────
  const initials = `${employee.user?.firstName?.[0] || ''}${employee.user?.lastName?.[0] || ''}`.toUpperCase();
  const fullName = `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim();

  // ── Date cutoff for timeframe ─────────────────────────────────────────────
  const getCutoff = () => {
    const c = new Date();
    if (timeframe === 'day') c.setDate(c.getDate() - 1);
    else if (timeframe === 'week') c.setDate(c.getDate() - 7);
    else c.setMonth(c.getMonth() - 1);
    return c;
  };
  const cutoff = getCutoff();

  const filteredAtts = (employee.attendances || []).filter(
    (a) => new Date(a.clockIn) >= cutoff
  );
  const filteredSessions = (employee.workSessions || []).filter(
    (ws) => new Date(ws.start) >= cutoff
  );

  // ── Today's clock-in/out ──────────────────────────────────────────────────
  const todayStr = new Date().toDateString();
  const todayAtt = (employee.attendances || []).find(
    (a) => new Date(a.clockIn).toDateString() === todayStr
  );
  const isClockedIn = todayAtt && !todayAtt.clockOut;
  const todayLoggedMs = todayAtt
    ? (todayAtt.clockOut
        ? new Date(todayAtt.clockOut) - new Date(todayAtt.clockIn)
        : Date.now() - new Date(todayAtt.clockIn))
    : 0;
  const stdShift = 8 * 3600000;
  const shiftPct = Math.min(100, Math.round((todayLoggedMs / stdShift) * 100));

  // ── Period totals ─────────────────────────────────────────────────────────
  const now = Date.now();
  let totalLoggedMs = 0;
  filteredAtts.forEach((a) => {
    totalLoggedMs += (a.clockOut ? new Date(a.clockOut) : now) - new Date(a.clockIn);
  });
  let totalWorkMs = 0;
  filteredSessions.forEach((ws) => {
    totalWorkMs += (ws.end ? new Date(ws.end) : now) - new Date(ws.start);
  });
  const totalBreakMs = Math.max(0, totalLoggedMs - totalWorkMs);
  const productivityScore = totalLoggedMs > 0
    ? Math.min(100, Math.round((totalWorkMs / totalLoggedMs) * 100))
    : 85;

  // ── App usage aggregation ─────────────────────────────────────────────────
  const appStats = {};
  let totalAppMs = 0;
  filteredSessions.forEach((s) => {
    (s.activities || []).forEach((act) => {
      const name = act.app || 'Unknown';
      appStats[name] = (appStats[name] || 0) + (act.activeDuration || 0);
      totalAppMs += act.activeDuration || 0;
    });
  });
  const sortedApps = Object.entries(appStats)
    .sort(([, a], [, b]) => b - a)
    .map(([app, ms]) => ({
      app,
      ms,
      pct: totalAppMs > 0 ? Math.round((ms / totalAppMs) * 100) : 0,
    }));

  // ── Timeline items ────────────────────────────────────────────────────────
  const timelineItems = (() => {
    const acts = [];
    filteredSessions.forEach((s) => {
      (s.activities || []).forEach((act) => {
        acts.push({
          ts: new Date(act.createdAt),
          app: act.app || 'Active Session',
          title: act.windowTitle || 'Workstation activity',
          active: act.activeDuration || 0,
          idle: act.idleDuration || 0,
        });
      });
    });
    acts.sort((a, b) => b.ts - a.ts);
    if (acts.length === 0) {
      return [{ ts: new Date(), app: 'Shift Started', title: 'Login via WorkforcePro Agent', active: 0, idle: 0 }];
    }
    return acts;
  })();

  // ── Screenshots ───────────────────────────────────────────────────────────
  const screenshots = filteredSessions
    .flatMap((s) => s.screenshots || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ── Network info ──────────────────────────────────────────────────────────
  const clientIP = todayAtt?.ipAddress || '—';
  const clientDevice = todayAtt?.deviceType || '—';

  // ── Reset handler ─────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!window.confirm(`Reset all telemetry for ${fullName}?`)) return;
    try {
      setIsResetting(true);
      await employeeApi.reset(employee.id);
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset');
    } finally {
      setIsResetting(false);
    }
  };

  const imgUrl = (sc) =>
    sc.storagePath?.startsWith('http')
      ? sc.storagePath
      : `http://localhost:5000${sc.storagePath?.startsWith('/uploads') ? '' : '/uploads'}${sc.storagePath}`;

  // ── Badge helper ──────────────────────────────────────────────────────────
  const actBadge = (app = '', idle = 0, active = 0) => {
    const a = app.toLowerCase();
    if (a.includes('slack') || a.includes('teams') || a.includes('discord'))
      return { label: 'Comms', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    if (a.includes('figma') || a.includes('photoshop') || a.includes('design'))
      return { label: 'Design', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    if (idle > active)
      return { label: 'Idle', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    return { label: 'Productive', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  };

  return (
    <div className="space-y-5 animate-fade-up max-w-[1440px] mx-auto pb-12">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center hover:bg-[var(--bg-card-alt)] transition text-[var(--text-secondary)]">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <span>People</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-400">Activity Report</span>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Timeframe selector */}
          <div className="flex gap-0.5 p-0.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-card)]">
            {[['day','24h'],['week','7d'],['month','30d']].map(([k,l]) => (
              <button key={k} onClick={() => setTimeframe(k)}
                className={`px-3 py-1 text-[9px] font-extrabold rounded uppercase tracking-widest transition ${
                  timeframe === k
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}>{l}</button>
            ))}
          </div>
          <button onClick={handleReset} disabled={isResetting}
            className="px-3 py-1.5 text-[10px] font-bold border border-red-500/20 bg-red-950/10 text-red-400 hover:bg-red-950/30 rounded-lg transition">
            {isResetting ? 'Resetting…' : 'Reset Telemetry'}
          </button>
          <button className="px-3.5 py-1.5 text-[10px] font-bold border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-alt)] transition flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── Employee Hero Card ─────────────────────────────────────────────── */}
      <section className="glass-card !p-0 overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)' }} />
        <div className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Avatar + Identity */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-white text-xl"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
                {initials}
              </div>
              {/* Live status dot */}
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--bg-card)] ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{fullName}</h1>
                <span className="badge badge-indigo">{toStr(employee.department, 'Engineering')}</span>
                {toStr(employee.team) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Users className="w-3 h-3" />{toStr(employee.team)}
                  </span>
                )}
                <span className={`badge ${isClockedIn ? 'badge-emerald' : 'badge-rose'}`}>
                  {isClockedIn ? '● Online' : '○ Offline'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                <span className="font-mono font-bold text-[var(--text-primary)]">{employee.employeeNum || 'N/A'}</span>
                {' · '}{employee.designation || 'Staff'}
                {' · '}<span className="text-indigo-400 font-bold font-mono uppercase">{toStr(employee.user?.role, 'EMPLOYEE')}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] font-semibold text-[var(--text-muted)]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Verified className="w-3 h-3" /> Transparency Policy Active
                </span>
                {clientIP !== '—' && (
                  <span className="flex items-center gap-1">
                    <Network className="w-3 h-3 text-indigo-400" /> {clientIP}
                  </span>
                )}
                {clientDevice !== '—' && (
                  <span className="flex items-center gap-1">
                    <Laptop className="w-3 h-3 text-indigo-400" /> {clientDevice}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Shift progress + actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 shrink-0">
            <div className="min-w-[180px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">Today's Shift</span>
                <span className="text-[9px] font-bold text-[var(--text-secondary)]">{shiftPct}%</span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-black font-mono text-indigo-400">{fmtMs(todayLoggedMs)}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">/ 8h</span>
              </div>
              <div className="h-2 w-full bg-[var(--bg-card-alt)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${shiftPct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Clock In / Clock Out Panel ────────────────────────────────────── */}
      <section className="glass-card !p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card-alt)]/20">
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock className="w-4 h-4 text-indigo-400" /> Attendance Log — Clock In / Clock Out
          </h2>
          <span className="badge badge-indigo">{filteredAtts.length} Records</span>
        </div>

        {filteredAtts.length === 0 ? (
          <div className="py-10 text-center text-xs text-[var(--text-muted)] italic">No attendance records for this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[var(--bg-card-alt)] border-b border-[var(--border-base)] text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">
                    <span className="flex items-center gap-1.5"><LogIn className="w-3 h-3 text-emerald-400" /> Clock In</span>
                  </th>
                  <th className="py-3 px-5">
                    <span className="flex items-center gap-1.5"><LogOut className="w-3 h-3 text-rose-400" /> Clock Out</span>
                  </th>
                  <th className="py-3 px-5">
                    <span className="flex items-center gap-1.5"><Timer className="w-3 h-3 text-indigo-400" /> Duration</span>
                  </th>
                  <th className="py-3 px-5">Location / IP</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-base)]/30">
                {filteredAtts.map((att, idx) => {
                  const cIn = new Date(att.clockIn);
                  const cOut = att.clockOut ? new Date(att.clockOut) : null;
                  const durMs = (cOut ? cOut : new Date()) - cIn;
                  const isToday = cIn.toDateString() === todayStr;
                  const isLate = cIn.getHours() > 9 || (cIn.getHours() === 9 && cIn.getMinutes() > 15);

                  let statusLabel = cOut ? 'Completed' : 'Active';
                  let statusCls = cOut ? 'badge-slate' : 'badge-emerald';

                  return (
                    <tr key={att.id || idx} className="hover:bg-[var(--bg-card-alt)]/30 transition">
                      {/* Date */}
                      <td className="py-3 px-5">
                        <div className="flex flex-col">
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            {cIn.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          {isToday && (
                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Today</span>
                          )}
                        </div>
                      </td>
                      {/* Clock In */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <LogIn className="w-3 h-3 text-emerald-400" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-emerald-400 text-[12px]">{fmtTime(cIn)}</span>
                            {isLate && (
                              <span className="ml-1.5 text-[8px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded">LATE</span>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Clock Out */}
                      <td className="py-3 px-5">
                        {cOut ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                              <LogOut className="w-3 h-3 text-rose-400" />
                            </div>
                            <span className="font-mono font-bold text-rose-400 text-[12px]">{fmtTime(cOut)}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            Working…
                          </span>
                        )}
                      </td>
                      {/* Duration */}
                      <td className="py-3 px-5">
                        <span className="font-mono font-bold text-indigo-400">{fmtMs(durMs)}</span>
                        {/* mini progress */}
                        <div className="mt-1 h-1 w-24 bg-[var(--bg-card-alt)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-500/60"
                            style={{ width: `${Math.min(100, Math.round((durMs / stdShift) * 100))}%` }} />
                        </div>
                      </td>
                      {/* IP */}
                      <td className="py-3 px-5 font-mono text-[10px] text-[var(--text-secondary)]">
                        {att.ipAddress || '—'}
                      </td>
                      {/* Status */}
                      <td className="py-3 px-5 text-right">
                        <span className={`badge ${statusCls}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── KPI Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Time */}
        {[
          {
            label: 'Active Time', value: fmtMs(totalWorkMs),
            sub: `${filteredAtts.length} sessions`, icon: TrendingUp,
            accent: '#10b981', glow: 'rgba(16,185,129,0.12)',
            badge: '+12%', badgeCls: 'text-emerald-400 bg-emerald-500/10',
          },
          {
            label: 'Idle / Break', value: fmtMs(totalBreakMs),
            sub: 'Away from desk', icon: Coffee,
            accent: '#f59e0b', glow: 'rgba(245,158,11,0.12)',
            badge: '-5%', badgeCls: 'text-amber-400 bg-amber-500/10',
          },
          {
            label: 'Productivity', value: `${productivityScore}%`,
            sub: 'Efficiency rating', icon: Zap,
            accent: '#6366f1', glow: 'rgba(99,102,241,0.15)',
            badge: productivityScore >= 70 ? 'Good' : 'Low',
            badgeCls: productivityScore >= 70 ? 'text-indigo-400 bg-indigo-500/10' : 'text-rose-400 bg-rose-500/10',
          },
          {
            label: 'Days Clocked In', value: `${new Set(filteredAtts.map(a => new Date(a.clockIn).toDateString())).size}`,
            sub: `of ${timeframe === 'day' ? 1 : timeframe === 'week' ? 5 : 22} work days`,
            icon: CheckCircle,
            accent: '#8b5cf6', glow: 'rgba(139,92,246,0.12)',
            badge: 'Period', badgeCls: 'text-violet-400 bg-violet-500/10',
          },
        ].map(({ label, value, sub, icon: Icon, accent, glow, badge, badgeCls }) => (
          <div key={label} className="glass-card relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
            {/* Glow blob */}
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-60 transition-opacity group-hover:opacity-100"
              style={{ background: glow }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: glow, border: `1px solid ${accent}30` }}>
                  <Icon className="w-4 h-4" style={{ color: accent }} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black" style={{ color: accent }}>{value}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mb-0.5 ${badgeCls}`}>{badge}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Activity Timeline + App Usage ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* Timeline — 2 cols */}
        <div className="lg:col-span-2">
          <section className="glass-card !p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card-alt)]/20">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Activity className="w-4 h-4 text-indigo-400" /> Activity Timeline
              </h2>
              <span className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-subtle)] px-2 py-1 rounded">
                {timelineItems.length} events
              </span>
            </div>
            <div className="p-5 max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <div className="relative space-y-0 before:absolute before:left-[13px] before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-indigo-500/40 before:via-[var(--border-subtle)] before:to-transparent">
                {timelineItems.map((item, idx) => {
                  const { label, cls } = actBadge(item.app, item.idle, item.active);
                  const isIdle = item.idle > item.active;
                  return (
                    <div key={idx} className="relative flex gap-4 pl-8 py-3 group hover:bg-indigo-500/[0.03] rounded-xl transition -mx-1 px-2">
                      {/* Timeline dot */}
                      <div className={`absolute left-[5px] top-4 w-5 h-5 rounded-full flex items-center justify-center z-10 border-2 border-[var(--bg-card)] transition-transform group-hover:scale-110 ${isIdle ? 'bg-rose-500/80' : 'bg-indigo-600'}`}>
                        {isIdle
                          ? <Coffee className="w-2.5 h-2.5 text-white" />
                          : <Laptop className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-[9px] font-mono font-bold text-indigo-400 block">
                              {fmtDateTime(item.ts)}
                            </span>
                            <p className="text-xs font-bold mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
                              {item.app}
                            </p>
                            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                              {item.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.active > 0 && (
                              <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">
                                {fmtMs(item.active * 1000)}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${cls}`}>
                              {label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* App Usage — 1 col */}
        <div className="space-y-4">
          <section className="glass-card !p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card-alt)]/20">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <BarChart2 className="w-4 h-4 text-indigo-400" /> App Usage
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {sortedApps.length === 0 ? (
                <p className="text-xs text-center italic text-[var(--text-muted)] py-4">No activity logged.</p>
              ) : sortedApps.slice(0, 8).map(({ app, pct }, idx) => (
                <div key={app}>
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span className="flex items-center gap-2 truncate" style={{ color: 'var(--text-primary)' }}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${APP_COLORS[idx % APP_COLORS.length]}`} />
                      {app}
                    </span>
                    <span className="font-mono font-bold shrink-0" style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--bg-card-alt)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${APP_COLORS[idx % APP_COLORS.length]}`}
                      style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Tracker Sessions Table ─────────────────────────────────────────── */}
      <section className="glass-card !p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card-alt)]/20">
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar className="w-4 h-4 text-indigo-400" /> Desktop Tracker Sessions
          </h2>
          <span className="badge badge-indigo">{filteredSessions.length} Sessions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[var(--bg-card-alt)] border-b border-[var(--border-base)] text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                <th className="py-3 px-5">Start</th>
                <th className="py-3 px-5">End</th>
                <th className="py-3 px-5">Duration</th>
                <th className="py-3 px-5">Activities</th>
                <th className="py-3 px-5">Stop Reason</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-base)]/20">
              {filteredSessions.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center italic text-[var(--text-muted)]">No tracker sessions in this period.</td></tr>
              ) : filteredSessions.map((s, idx) => {
                const start = new Date(s.start);
                const end = s.end ? new Date(s.end) : null;
                const dur = (end || new Date()) - start;
                const isRunning = s.status === 'RUNNING';
                return (
                  <tr key={s.id || idx} className="hover:bg-[var(--bg-card-alt)]/25 transition">
                    <td className="py-3 px-5 font-medium" style={{ color: 'var(--text-primary)' }}>{fmtDateTime(start)}</td>
                    <td className="py-3 px-5">
                      {end
                        ? <span style={{ color: 'var(--text-primary)' }}>{fmtDateTime(end)}</span>
                        : <span className="text-emerald-400 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Live</span>
                      }
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-indigo-400">{fmtMs(dur)}</td>
                    <td className="py-3 px-5 text-[var(--text-secondary)]">{(s.activities || []).length} events</td>
                    <td className="py-3 px-5">
                      {s.stopReason ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-amber-500/20 bg-amber-500/10 text-amber-400 uppercase tracking-wider">
                          {s.stopReason}
                        </span>
                      ) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span className={`badge ${isRunning ? 'badge-emerald' : 'badge-slate'}`}>{s.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Screenshots ───────────────────────────────────────────────────── */}
      <section className="glass-card !p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card-alt)]/20">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Monitor className="w-4 h-4 text-indigo-400" /> Workstation Screenshots
            </h2>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Captured every 5 minutes during active tracker sessions.</p>
          </div>
          <span className="badge badge-emerald">{screenshots.length} Captures</span>
        </div>
        <div className="p-5">
          {screenshots.length === 0 ? (
            <div className="py-10 text-center text-xs italic text-[var(--text-muted)]">No screenshots captured for this period.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {screenshots.map((sc, idx) => {
                const url = imgUrl(sc);
                return (
                  <div key={sc.id || idx} onClick={() => setActiveLightboxImg(url)}
                    className="group relative rounded-xl overflow-hidden aspect-video border border-[var(--border-base)] cursor-zoom-in hover:scale-105 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                    <img src={url} alt={`Capture ${idx + 1}`} className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML =
                          '<div class="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 text-[8px] text-slate-500 gap-1"><span>🔒</span><span>Encrypted</span></div>';
                      }} />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 flex-col">
                      <Eye className="w-4 h-4 text-white" />
                      <span className="text-white text-[8px] font-mono">{fmtTime(sc.createdAt)}</span>
                      <span className="text-slate-300 text-[7px] font-mono">
                        {new Date(sc.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="pt-4 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <AlertCircle className="w-3.5 h-3.5" />
          Activity is monitored under Workspace Transparency Policy.
          <a className="text-indigo-400 hover:underline" href="#">View Policy</a>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-secondary)]">
          <button className="hover:text-indigo-400 transition">Contact HR</button>
          <button className="hover:text-indigo-400 transition">Request Correction</button>
          <button className="hover:text-indigo-400 transition">Download Data</button>
        </div>
      </footer>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {activeLightboxImg && (
        <div className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setActiveLightboxImg(null)}>
          <button onClick={() => setActiveLightboxImg(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-red-500/30 transition text-lg">
            ✕
          </button>
          <div className="max-w-5xl max-h-[88vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={activeLightboxImg} alt="Fullscreen Capture" className="max-w-full max-h-[88vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
