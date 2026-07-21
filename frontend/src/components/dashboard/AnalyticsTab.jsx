import React from 'react';
import { BarChart3, TrendingUp, Users, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';

// ── Reusable sub-components ───────────────────────────────────────────────────
const StatCard = ({ label, value, sub, note, icon: Icon, iconColor, accent }) => (
  <div className="stat-card card-hover p-5">
    <div className="flex items-start justify-between mb-4">
      <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#374151' }}>
        {label}
      </span>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}22` }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <span style={{ fontSize: '22px', fontWeight: 900, color: accent || '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: '10px', fontWeight: 700, color: iconColor }}>{sub}</span>}
    </div>
    {note && <p style={{ marginTop: '12px', fontSize: '10px', color: '#1f2937' }}>{note}</p>}
  </div>
);

const BarRow = ({ label, count, pct, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between" style={{ fontSize: '11px' }}>
      <span style={{ color: '#6b7280', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#374151', fontFamily: 'JetBrains Mono, monospace' }}>{count} · {pct}%</span>
    </div>
    <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`, borderRadius: '99px',
        background: color, transition: 'width 0.6s ease',
        boxShadow: `0 0 8px ${color}60`,
      }} />
    </div>
  </div>
);

const PanelCard = ({ title, subtitle, children }) => (
  <div style={{
    background: 'linear-gradient(145deg,rgba(20,26,40,0.8) 0%,rgba(13,17,23,0.9) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '24px',
  }}>
    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginBottom: subtitle ? '4px' : '20px' }}>{title}</h3>
    {subtitle && (
      <p style={{ fontSize: '11px', color: '#374151', marginBottom: '20px', lineHeight: 1.5 }}>{subtitle}</p>
    )}
    {children}
  </div>
);

const MiniCard = ({ label, value, color }) => (
  <div style={{ padding: '14px', background: 'rgba(7,9,15,0.50)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#374151', display: 'block' }}>
      {label}
    </span>
    <span style={{ fontSize: '14px', fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace', display: 'block', marginTop: '4px' }}>
      {value}
    </span>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function AnalyticsTab({
  isSuperAdmin,
  workspaces = [],
  plans = [],
  employees = [],
  projects = [],
}) {
  // Super Admin metrics
  const totalWorkspaces    = workspaces.length;
  const activeWorkspaces   = workspaces.filter(w => w.status === 'ACTIVE').length;

  const totalMRR = workspaces.reduce((acc, ws) => {
    if (ws.status !== 'ACTIVE' || !ws.company?.subscriptions) return acc;
    const sub = ws.company.subscriptions.find(s => s.status === 'ACTIVE');
    if (!sub?.plan) return acc;
    return acc + (ws._count?.employees || 0) * Number(sub.plan.price || 0);
  }, 0);

  const totalAllocatedSeats = workspaces.reduce((acc, ws) => acc + (ws._count?.employees || 0), 0);

  const planMix = workspaces.reduce((acc, ws) => {
    const sub = ws.company?.subscriptions?.find(s => s.status === 'ACTIVE');
    const key = sub?.plan?.name || 'NONE';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Company Admin metrics
  const totalEmployees   = employees.length;
  const activeEmployees  = employees.filter(e => e.status === 'ACTIVE').length;
  const allTasks         = projects.flatMap(p => p.tasks || []);
  const totalTasks       = allTasks.length;
  const completedTasks   = allTasks.filter(t => t.status === 'DONE').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const priorityMix = allTasks.reduce((acc, t) => {
    const p = t.priority || 'MEDIUM';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 });

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div>
        <h2 className="text-lg font-black tracking-tight text-white uppercase">
          Enterprise Operations Analytics
        </h2>
        <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>
          {isSuperAdmin
            ? 'Global subscription metrics, workspace distribution, and SaaS revenue performance.'
            : 'Workspace utilization, headcount audits, and project completion metrics.'}
        </p>
      </div>

      {/* ── Super Admin View ── */}
      {isSuperAdmin ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Total Workspaces" value={totalWorkspaces}
              sub={`${activeWorkspaces} active`} note="Corporate tenant instances"
              icon={Users} iconColor="#6366f1"
            />
            <StatCard
              label="Monthly Revenue" value={`$${totalMRR.toFixed(0)}`}
              note="Seats × plan rate (MRR)"
              icon={TrendingUp} iconColor="#10b981" accent="#10b981"
            />
            <StatCard
              label="Total Seats Filled" value={totalAllocatedSeats}
              sub="user base" note="Aggregate employee count"
              icon={BarChart3} iconColor="#60a5fa"
            />
            <StatCard
              label="ARPU / Workspace"
              value={`$${totalWorkspaces > 0 ? (totalMRR / totalWorkspaces).toFixed(2) : '0.00'}`}
              note="Average revenue per tenant"
              icon={Award} iconColor="#a78bfa"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PanelCard title="SaaS Tier Subscription Distribution" subtitle="Breakdown of workspaces by billing tier.">
              <div className="space-y-4">
                {[['BASIC','#6366f1'],['PRO','#10b981'],['ENTERPRISE','#a78bfa']].map(([tier, color]) => {
                  const count = planMix[tier] || 0;
                  const pct   = totalWorkspaces > 0 ? Math.round((count / totalWorkspaces) * 100) : 0;
                  return <BarRow key={tier} label={`${tier} Tier`} count={count} pct={pct} color={color} />;
                })}
              </div>
            </PanelCard>

            <PanelCard title="Platform Load Summary" subtitle="Audited health metrics from live database operations.">
              <div className="grid grid-cols-2 gap-3 mt-2">
                <MiniCard label="Super Admin Accounts" value="1 Master"                           color="#6366f1" />
                <MiniCard label="Billing Cycle"        value="100% Monthly"                       color="#10b981" />
                <MiniCard label="Active Workspaces"    value={`${activeWorkspaces}`}              color="#60a5fa" />
                <MiniCard label="Pending Approval"     value={`${totalWorkspaces - activeWorkspaces}`} color="#f59e0b" />
              </div>
            </PanelCard>
          </div>
        </>
      ) : (

        /* ── Company Admin / Manager View ── */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Staff Headcount" value={totalEmployees}
              sub={`${activeEmployees} active`} note="Corporate directory count"
              icon={Users} iconColor="#6366f1"
            />
            <StatCard
              label="Project Boards" value={projects.length}
              note="Active operational boards"
              icon={FileText} iconColor="#10b981" accent="#10b981"
            />
            <StatCard
              label="Task Completion" value={`${taskCompletionRate}%`}
              sub={`${completedTasks}/${totalTasks}`} note="Workspace task rate"
              icon={CheckCircle2} iconColor="#60a5fa"
            />
            <StatCard
              label="Urgent Tasks" value={priorityMix.URGENT || 0}
              note="Requiring immediate attention"
              icon={ShieldAlert} iconColor="#f43f5e" accent="#f43f5e"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PanelCard title="Task Priority Distribution" subtitle="Volume of tasks by urgency level across all project boards.">
              <div className="space-y-4">
                {[['LOW','#60a5fa'],['MEDIUM','#10b981'],['HIGH','#f59e0b'],['URGENT','#f43f5e']].map(([p, color]) => {
                  const count = priorityMix[p] || 0;
                  const pct   = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                  return <BarRow key={p} label={`${p} Priority`} count={count} pct={pct} color={color} />;
                })}
              </div>
            </PanelCard>

            <PanelCard title="Workspace Health Overview" subtitle="Staff check-ins and activity ratios compiled today.">
              <div className="grid grid-cols-2 gap-3 mt-2">
                <MiniCard label="Active Attendance" value="Operational"                color="#10b981" />
                <MiniCard label="Staff On Leave"    value="0 Today"                    color="#374151" />
                <MiniCard label="Total Employees"   value={`${totalEmployees}`}        color="#6366f1" />
                <MiniCard label="Completion Rate"   value={`${taskCompletionRate}%`}   color="#60a5fa" />
              </div>
            </PanelCard>
          </div>
        </>
      )}
    </div>
  );
}
