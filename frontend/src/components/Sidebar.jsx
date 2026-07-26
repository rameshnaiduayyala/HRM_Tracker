import React from 'react';
import { Building, Users, Briefcase, Settings, LayoutGrid, BarChart3, Clock, FileText, Building2, Calendar, Bell, CheckSquare, Sparkles, ChevronRight } from 'lucide-react';
import Select from './Select';
import { useEntitlements } from '../contexts/EntitlementContext';

const NavItem = ({ icon: Icon, label, active, onClick, iconColor }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-150 nav-item ${active ? 'nav-item-active' : ''}`}
    style={{ color: active ? '#a5b4fc' : 'var(--text-secondary)' }}
  >
    <Icon className="w-4 h-4 shrink-0" style={{ color: active ? '#818cf8' : iconColor || 'var(--text-muted)' }} />
    <span className="flex-1 text-left">{label}</span>
    {active && <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />}
  </button>
);

const NavSection = ({ label, children }) => (
  <div className="space-y-0.5">
    <span className="block text-[9px] font-bold uppercase tracking-widest px-3 mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label}
    </span>
    {children}
  </div>
);

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  companies = [],
  selectedCompanyId = '',
  setSelectedCompanyId
}) {
  const isSuperAdmin   = user?.role === 'SUPER_ADMIN';
  const isCompanyAdmin = ['ADMIN', 'MANAGER', 'HR'].includes(user?.role);
  const isStaff        = user?.role === 'EMPLOYEE';
  const isHR           = user?.role === 'HR';
  const { canUse }     = useEntitlements();

  return (
    <aside
      className="w-full md:w-60 flex-shrink-0 flex flex-col gap-5 p-4 h-auto md:h-screen md:sticky md:top-0"
      style={{
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Active Workspace selector */}
      {isCompanyAdmin && (
        <div className="space-y-2">
          <label className="block text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>
            Active Workspace
          </label>
          {companies.length === 0 ? (
            <div className="text-[11px] italic px-3 py-2 rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--bg-card-alt)' }}>
              No workspace assigned
            </div>
          ) : (
            <Select
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
              className="w-full text-[12px]"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          )}
          <hr className="divider mt-3" />
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="space-y-5 flex-1 overflow-y-auto pr-1">

        {/* Admin overview */}
        {!isStaff && (
          <NavSection label="Overview">
            {isHR ? (
              canUse('hrm') && <NavItem icon={LayoutGrid} label="HRM Core Hub" active={activeTab === 'hrm-dashboard'} onClick={() => setActiveTab('hrm-dashboard')} iconColor="#818cf8" />
            ) : (
              <NavItem icon={BarChart3} label="Overview Dashboard" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
            )}

            {!isSuperAdmin && !isHR && canUse('tracking') && (
              <NavItem icon={Sparkles} label="AI Copilot" active={activeTab === 'ai-analytics'} onClick={() => setActiveTab('ai-analytics')} iconColor="#a78bfa" />
            )}
          </NavSection>
        )}

        {/* Super Admin only */}
        {isSuperAdmin && (
          <NavSection label="Platform">
            <NavItem icon={LayoutGrid}  label="Registered Workspaces" active={activeTab === 'workspaces'} onClick={() => setActiveTab('workspaces')} />
            <NavItem icon={Building}    label="Billing Plans"          active={activeTab === 'plans'}      onClick={() => setActiveTab('plans')} />
            <NavItem icon={BarChart3}   label="System Ops & Audit"     active={activeTab === 'system-ops'} onClick={() => setActiveTab('system-ops')} iconColor="#a78bfa" />
          </NavSection>
        )}

        {/* Company Admin / HR */}
        {isCompanyAdmin && (
          <>
            {canUse('hrm') && (
              <NavSection label="People">
                <NavItem icon={Users} label="Staff Directory" active={activeTab === 'employees'} onClick={() => setActiveTab('employees')} />

                {!isHR && (
                  <>
                    <NavItem icon={Building2}   label="Departments"     active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} />
                    <NavItem icon={Users}        label="Teams"           active={activeTab === 'teams'}       onClick={() => setActiveTab('teams')} />
                  </>
                )}
              </NavSection>
            )}

            {!isHR && canUse('projects') && (
              <NavSection label="Work">
                <NavItem icon={Briefcase}   label="Projects & Boards" active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
                <NavItem icon={CheckSquare} label="Task Board"        active={activeTab === 'tasks'}    onClick={() => setActiveTab('tasks')} />
              </NavSection>
            )}

            <NavSection label="HR & Payroll">
              {canUse('leave') && <NavItem icon={Calendar}  label="Leave Management"   active={activeTab === 'leaves'}        onClick={() => setActiveTab('leaves')} />}
              <NavItem icon={Bell}      label="Communications"     active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
              {canUse('reports') && <NavItem icon={Clock}     label="Time Reports"       active={activeTab === 'reports'}       onClick={() => setActiveTab('reports')} />}
              {canUse('timesheets') && <NavItem icon={FileText} label="Timesheet Review"   active={activeTab === 'timesheets'}    onClick={() => setActiveTab('timesheets')} />}
              {canUse('hrm') && (user?.role === 'ADMIN' || isHR) && (
                <NavItem icon={FileText} label="Payslip Management" active={activeTab === 'payslips' || activeTab === 'print-payslip'} onClick={() => setActiveTab('payslips')} iconColor="#a78bfa" />
              )}
            </NavSection>

            {(user?.role === 'ADMIN' || isHR) && (
              <NavSection label="System">
                <NavItem icon={Settings} label="Settings & Policies" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
              </NavSection>
            )}
          </>
        )}

        {/* Staff (Employee) */}
        {isStaff && (
          <NavSection label="My Workspace">
            {canUse('attendance') && <NavItem icon={Clock}       label="Shift Attendance" active={activeTab === 'attendance'}   onClick={() => setActiveTab('attendance')} />}
            {canUse('projects') && <NavItem icon={CheckSquare} label="My Tasks"         active={activeTab === 'tasks'}        onClick={() => setActiveTab('tasks')} />}
            {canUse('leave') && <NavItem icon={Calendar}    label="My Leaves"        active={activeTab === 'leaves'}       onClick={() => setActiveTab('leaves')} />}
            {canUse('timesheets') && <NavItem icon={Clock}     label="My Timesheets"     active={activeTab === 'timesheets'}   onClick={() => setActiveTab('timesheets')} />}
            <NavItem icon={Bell}        label="Communications"   active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
          </NavSection>
        )}
      </nav>

      {/* Bottom version tag */}
      <div className="px-3 pb-1">
        <span className="block text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>TaskTracky v2.0 · Enterprise</span>
      </div>
    </aside>
  );
}
