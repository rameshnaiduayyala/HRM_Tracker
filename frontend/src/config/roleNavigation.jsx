import { 
  BarChart3, 
  Users, 
  Building, 
  Building2, 
  Briefcase, 
  CheckSquare, 
  Calendar, 
  Bell, 
  Clock, 
  FileText, 
  Settings, 
  LayoutGrid, 
} from 'lucide-react';
import { MODULE_KEYS } from './entitlements';

/**
 * Role-Based Navigation Configuration Matrix
 * Company Admin (ADMIN) has complete tenant-wide menu access.
 */
export const ROLE_NAV_CONFIG = {
  SUPER_ADMIN: {
    portalPath: '/dashboard',
    defaultTab: 'workspaces',
    sections: [
      {
        label: 'Platform Operations',
        items: [
          { id: 'workspaces', label: 'Registered Workspaces', icon: LayoutGrid, path: '/platform/organizations' },
          { id: 'plans', label: 'Billing Plans', icon: Building, path: '/platform/plans' },
          { id: 'system-ops', label: 'System Ops & Audit', icon: BarChart3, iconColor: '#a78bfa', path: '/platform/system/health' },
        ],
      },
      {
        label: 'Global Analytics',
        items: [
          { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3, path: '/platform/dashboard' },
        ],
      },
    ],
  },

  ADMIN: {
    portalPath: '/dashboard',
    defaultTab: 'analytics',
    sections: [
      {
        label: 'Executive Control',
        items: [
          { id: 'analytics', label: 'Executive Dashboard', icon: BarChart3, path: '/dashboard/analytics' },
          { id: 'hrm-dashboard', label: 'HRM Core Hub', icon: LayoutGrid, iconColor: '#818cf8', path: '/dashboard/hrm-dashboard' },
        ],
      },
      {
        label: 'Workforce & Structure',
        items: [
          { id: 'employees', label: 'Staff Directory', icon: Users, path: '/dashboard/employees' },
          { id: 'departments', label: 'Departments', icon: Building2, path: '/dashboard/departments' },
          { id: 'teams', label: 'Squad Teams', icon: Users, path: '/dashboard/teams' },
        ],
      },
      {
        label: 'Projects & Execution',
        items: [
          { id: 'projects', label: 'Project Boards', icon: Briefcase, module: MODULE_KEYS.PROJECTS, path: '/work/projects', alwaysShow: true },
          { id: 'tasks', label: 'Task Execution Board', icon: CheckSquare, module: MODULE_KEYS.TASKS, path: '/work/tasks', alwaysShow: true },
        ],
      },
      {
        label: 'HR & Operations',
        items: [
          { id: 'leaves', label: 'Leave Approvals', icon: Calendar, module: MODULE_KEYS.LEAVE, path: '/dashboard/leaves' },
          { id: 'notifications', label: 'Announcements', icon: Bell, path: '/dashboard/notifications' },
          { id: 'reports', label: 'Shift & Time Reports', icon: Clock, path: '/reports' },
          { id: 'timesheets', label: 'Timesheet Audit', icon: FileText, module: MODULE_KEYS.TIMESHEETS, path: '/work/timesheets' },
        ],
      },
      {
        label: 'Finance & Governance',
        items: [
          { id: 'payslips', label: 'Payroll & Payslips', icon: FileText, iconColor: '#a78bfa', module: MODULE_KEYS.PAYROLL, path: '/payroll/payslips' },
          { id: 'configurations', label: 'Workspace Divisions', icon: Building, path: '/admin/configurations' },
          { id: 'settings', label: 'Tenant Settings & Policies', icon: Settings, path: '/admin/settings' },
        ],
      },
    ],
  },

  MANAGER: {
    portalPath: '/dashboard',
    defaultTab: 'analytics',
    sections: [
      {
        label: 'Team Overview',
        items: [
          { id: 'analytics', label: 'Team Performance', icon: BarChart3, path: '/dashboard/analytics' },
        ],
      },
      {
        label: 'Team & Structure',
        items: [
          { id: 'employees', label: 'Team Members', icon: Users, path: '/dashboard/employees' },
          { id: 'departments', label: 'Departments', icon: Building2, path: '/dashboard/departments' },
          { id: 'teams', label: 'My Teams', icon: Users, path: '/dashboard/teams' },
        ],
      },
      {
        label: 'Work Execution',
        items: [
          { id: 'projects', label: 'Team Projects', icon: Briefcase, module: MODULE_KEYS.PROJECTS, path: '/work/projects', alwaysShow: true },
          { id: 'tasks', label: 'Task Allocations', icon: CheckSquare, module: MODULE_KEYS.TASKS, path: '/work/tasks', alwaysShow: true },
        ],
      },
      {
        label: 'Approvals & Governance',
        items: [
          { id: 'leaves', label: 'Team Leave Requests', icon: Calendar, module: MODULE_KEYS.LEAVE, path: '/dashboard/leaves' },
          { id: 'timesheets', label: 'Team Timesheets', icon: FileText, module: MODULE_KEYS.TIMESHEETS, path: '/work/timesheets' },
          { id: 'reports', label: 'Attendance Reports', icon: Clock, path: '/reports' },
          { id: 'notifications', label: 'Announcements', icon: Bell, path: '/dashboard/notifications' },
          { id: 'settings', label: 'Manager Settings', icon: Settings, path: '/admin/settings' },
        ],
      },
    ],
  },

  HR: {
    portalPath: '/hr',
    defaultTab: 'hrm-dashboard',
    sections: [
      {
        label: 'HR Operations Hub',
        items: [
          { id: 'hrm-dashboard', label: 'HRM Core Hub', icon: LayoutGrid, iconColor: '#818cf8', module: MODULE_KEYS.HRM, path: '/hr/dashboard' },
        ],
      },
      {
        label: 'Workforce & Structure',
        items: [
          { id: 'employees', label: 'Staff Directory', icon: Users, module: MODULE_KEYS.HRM, path: '/hr/people/employees' },
          { id: 'departments', label: 'Departments', icon: Building2, module: MODULE_KEYS.HRM, path: '/hr/people/departments' },
          { id: 'teams', label: 'Squad Teams', icon: Users, module: MODULE_KEYS.HRM, path: '/hr/people/teams' },
        ],
      },
      {
        label: 'Work & Projects',
        items: [
          { id: 'projects', label: 'Project Boards', icon: Briefcase, module: MODULE_KEYS.PROJECTS, path: '/work/projects', alwaysShow: true },
          { id: 'tasks', label: 'Task Execution Board', icon: CheckSquare, module: MODULE_KEYS.TASKS, path: '/work/tasks', alwaysShow: true },
        ],
      },
      {
        label: 'Leave & Attendance',
        items: [
          { id: 'leaves', label: 'Leave Management', icon: Calendar, module: MODULE_KEYS.LEAVE, path: '/hr/leave/requests' },
          { id: 'reports', label: 'Attendance Logs', icon: Clock, module: MODULE_KEYS.REPORTS, path: '/tracking/reports' },
          { id: 'timesheets', label: 'Timesheet Review', icon: FileText, module: MODULE_KEYS.TIMESHEETS, path: '/work/timesheets' },
        ],
      },
      {
        label: 'Compensation & Comms',
        items: [
          { id: 'payslips', label: 'Payslip Processing', icon: FileText, iconColor: '#a78bfa', module: MODULE_KEYS.PAYROLL, path: '/payroll/payslips' },
          { id: 'notifications', label: 'Company Announcements', icon: Bell, path: '/hr/notifications' },
        ],
      },
      {
        label: 'Administration',
        items: [
          { id: 'settings', label: 'HR Policies & Config', icon: Settings, path: '/hr/settings' },
        ],
      },
    ],
  },

  EMPLOYEE: {
    portalPath: '/employee',
    defaultTab: 'dashboard',
    sections: [
      {
        label: 'My Workspace',
        items: [
          { id: 'dashboard', label: 'Employee Dashboard', icon: LayoutGrid, path: '/employee/dashboard', alwaysShow: true },
          { id: 'attendance', label: 'Shift Attendance', icon: Clock, module: MODULE_KEYS.ATTENDANCE, path: '/employee/attendance', alwaysShow: true },
          { id: 'tasks', label: 'My Assigned Tasks', icon: CheckSquare, module: MODULE_KEYS.TASKS, path: '/employee/tasks', alwaysShow: true },
          { id: 'leaves', label: 'My Leave Requests', icon: Calendar, module: MODULE_KEYS.LEAVE, path: '/employee/leave', alwaysShow: true },
          { id: 'timesheets', label: 'My Timesheets', icon: Clock, module: MODULE_KEYS.TIMESHEETS, path: '/employee/timesheet', alwaysShow: true },
          { id: 'notifications', label: 'Announcements', icon: Bell, path: '/employee/notifications', alwaysShow: true },
        ],
      },
    ],
  },
};
