import React from 'react';
import FocusTrackLogo from '../../assets/focustrack-logo.png';
import { Printer, Shield, QrCode, Edit2, Mail, Bookmark, Calendar, CheckCircle2, Monitor } from 'lucide-react';
import Button from '../Button';
import EnterpriseIDCard from './EnterpriseIDCard';

// Safe coercion: Prisma relations (department/team) come back as full objects.
const toStr = (val, fallback = '') =>
  val?.name ?? (typeof val === 'string' ? val : fallback);

export default function EmployeeProfileView({ employee, onBack, onEdit, onReset, onDelete, loading }) {
  if (!employee) return null;
  const initials = `${employee.user?.firstName?.[0] || ''}${employee.user?.lastName?.[0] || ''}`.toUpperCase();

  const companyLogo = employee.company?.logoUrl || employee.company?.logo
    ? (employee.company?.logoUrl || employee.company?.logo).startsWith('http') || (employee.company?.logoUrl || employee.company?.logo).startsWith('data:')
      ? (employee.company?.logoUrl || employee.company?.logo)
      : `http://localhost:5000${employee.company?.logoUrl || employee.company?.logo}`
    : FocusTrackLogo;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Breadcrumb / Back Button */}
      <div className="flex items-center justify-between no-print">
        <button 
          onClick={onBack}
          className="px-3 py-1.5 border border-[var(--border-subtle)] text-[12px] font-semibold rounded-lg hover:bg-[var(--bg-card-alt)] transition-colors"
        >
          ← Back to Staff Directory
        </button>
      </div>

      {/* Profile Header Block */}
      <div className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#6063ee)', boxShadow: '0 4px 10px rgba(79,70,229,0.2)' }}>
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
              {employee.user?.firstName} {employee.user?.lastName}
            </h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mt-0.5">
              {employee.designation || 'Staff Member'}
            </p>
            <span className={`badge ${employee.status === 'ACTIVE' ? 'badge-emerald' : employee.status === 'ON_LEAVE' ? 'badge-amber' : 'badge-rose'} mt-2`}>
              {employee.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => onEdit(employee)}>
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </Button>
          <button 
            onClick={() => onReset(employee)}
            className="px-4 py-2 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-bold rounded-xl hover:bg-yellow-500/10 transition-colors"
          >
            Reset Telemetry
          </button>
          <button 
            onClick={() => onDelete(employee)}
            className="px-4 py-2 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/10 transition-colors"
          >
            Terminate Contract
          </button>
        </div>
      </div>

      {/* Bento Grid Canvas */}
      <div className="bento-grid">
        
        {/* Contact & Bio (col-span-4) */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <div className="glass-card">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Mail className="w-4 h-4 text-indigo-500" /> Identity Contact
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <span className="block font-bold text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email Address</span>
                <span className="block mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{employee.user?.email}</span>
              </div>
              <div>
                <span className="block font-bold text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Workspace Status</span>
                <span className="block mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Registered Portal User</span>
              </div>
              <div>
                <span className="block font-bold text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Slack Username</span>
                <span className="block mt-1 font-medium text-indigo-500">@{employee.user?.firstName?.toLowerCase()}_{employee.user?.lastName?.toLowerCase()}</span>
              </div>
            </div>
          </div>

          {/* Employment Info Card */}
          <div className="glass-card">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Bookmark className="w-4 h-4 text-indigo-500" /> Employment Details
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Employee ID</span>
                <span className="font-bold font-mono" style={{ color: 'var(--text-secondary)' }}>{employee.employeeNum || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Department</span>
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {toStr(employee.department, 'General')}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Designation</span>
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{employee.designation || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Reporting Manager</span>
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {employee.manager ? `${employee.manager.user?.firstName} ${employee.manager.user?.lastName}` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Work & Attendance (col-span-5) */}
        <div className="col-span-12 md:col-span-5 space-y-6">
          <div className="glass-card">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Current Operations
            </h3>
            <div className="space-y-4">
              <div>
                <span className="block font-bold text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Active Status</span>
                <div className="p-3 rounded-xl border flex items-center justify-between" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Daily Telemetry</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Real-time desktop heartbeats</p>
                  </div>
                  <span className="badge badge-emerald">Connected</span>
                </div>
              </div>

              <div>
                <span className="block font-bold text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Task Progress</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Pending Jira-like issues</p>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: '65%' }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    <span>PROGRESS</span>
                    <span className="text-indigo-500">65%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="glass-card">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-4 h-4 text-indigo-500" /> Attendance Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-xl flex flex-col items-center text-center" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-2xl font-black text-indigo-500">22</span>
                <span className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Present Days</span>
              </div>
              <div className="p-3 border rounded-xl flex flex-col items-center text-center" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-2xl font-black text-emerald-500">14</span>
                <span className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Leave Balance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline (col-span-3) */}
        <div className="col-span-12 md:col-span-3">
          <div className="glass-card h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="border-l-2 pl-3 pb-2 relative" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-indigo-500" />
                  <p className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Agent Checked In</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sync desktop client logs</p>
                  <span className="text-[9px] font-bold" style={{ color: 'var(--text-tertiary)' }}>2h ago</span>
                </div>
                <div className="border-l-2 pl-3 pb-2 relative" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Clocked In</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Registered shift time card</p>
                  <span className="text-[9px] font-bold" style={{ color: 'var(--text-tertiary)' }}>9:00 AM</span>
                </div>
                <div className="border-l-2 pl-3 pb-2 relative" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-400" />
                  <p className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Completed Task</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Reusable Enterprise ID Card */}
      <EnterpriseIDCard employee={employee} companyLogo={companyLogo} />
    </div>
  );
}
