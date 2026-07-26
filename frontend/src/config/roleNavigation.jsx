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
  Sparkles,
  ShieldCheck
} from 'lucide-react';

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
          { id: 'workspaces', label: 'Registered Workspaces', icon: LayoutGrid },
          { id: 'plans', label: 'Billing Plans', icon: Building },
          { id: 'system-ops', label: 'System Ops & Audit', icon: BarChart3, iconColor: '#a78bfa' },
        ],
      },
      {
        label: 'Global Analytics',
        items: [
          { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3 },
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
          { id: 'analytics', label: 'Executive Dashboard', icon: BarChart3 },
          { id: 'hrm-dashboard', label: 'HRM Core Hub', icon: LayoutGrid, iconColor: '#818cf8' },
        ],
      },
      {
        label: 'Workforce & Structure',
        items: [
          { id: 'employees', label: 'Staff Directory', icon: Users },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'teams', label: 'Squad Teams', icon: Users },
        ],
      },
      {
        label: 'Projects & Execution',
        items: [
          { id: 'projects', label: 'Project Boards', icon: Briefcase },
          { id: 'tasks', label: 'Task Execution Board', icon: CheckSquare },
        ],
      },
      {
        label: 'HR & Operations',
        items: [
          { id: 'leaves', label: 'Leave Approvals', icon: Calendar },
          { id: 'notifications', label: 'Announcements', icon: Bell },
          { id: 'reports', label: 'Shift & Time Reports', icon: Clock },
          { id: 'timesheets', label: 'Timesheet Audit', icon: FileText },
        ],
      },
      {
        label: 'Finance & Governance',
        items: [
          { id: 'payslips', label: 'Payroll & Payslips', icon: FileText, iconColor: '#a78bfa' },
          { id: 'configurations', label: 'Workspace Divisions', icon: Building },
          { id: 'settings', label: 'Tenant Settings & Policies', icon: Settings },
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
          { id: 'analytics', label: 'Team Performance', icon: BarChart3 },
        ],
      },
      {
        label: 'Team & Structure',
        items: [
          { id: 'employees', label: 'Team Members', icon: Users },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'teams', label: 'My Teams', icon: Users },
        ],
      },
      {
        label: 'Work Execution',
        items: [
          { id: 'projects', label: 'Team Projects', icon: Briefcase },
          { id: 'tasks', label: 'Task Allocations', icon: CheckSquare },
        ],
      },
      {
        label: 'Approvals & Governance',
        items: [
          { id: 'leaves', label: 'Team Leave Requests', icon: Calendar },
          { id: 'timesheets', label: 'Team Timesheets', icon: FileText },
          { id: 'reports', label: 'Attendance Reports', icon: Clock },
          { id: 'notifications', label: 'Announcements', icon: Bell },
          { id: 'settings', label: 'Manager Settings', icon: Settings },
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
          { id: 'hrm-dashboard', label: 'HRM Core Hub', icon: LayoutGrid, iconColor: '#818cf8', module: 'hrm' },
        ],
      },
      {
        label: 'Workforce & Structure',
        items: [
          { id: 'employees', label: 'Staff Directory', icon: Users, module: 'hrm' },
          { id: 'departments', label: 'Departments', icon: Building2, module: 'hrm' },
          { id: 'teams', label: 'Squad Teams', icon: Users, module: 'hrm' },
        ],
      },
      {
        label: 'Work & Projects',
        items: [
          { id: 'projects', label: 'Project Boards', icon: Briefcase, module: 'projects' },
          { id: 'tasks', label: 'Task Execution Board', icon: CheckSquare, module: 'tasks' },
        ],
      },
      {
        label: 'Leave & Attendance',
        items: [
          { id: 'leaves', label: 'Leave Management', icon: Calendar, module: 'leave' },
          { id: 'reports', label: 'Attendance Logs', icon: Clock, module: 'reports' },
          { id: 'timesheets', label: 'Timesheet Review', icon: FileText, module: 'timesheets' },
        ],
      },
      {
        label: 'Compensation & Comms',
        items: [
          { id: 'payslips', label: 'Payslip Processing', icon: FileText, iconColor: '#a78bfa', module: 'hrm' },
          { id: 'notifications', label: 'Company Announcements', icon: Bell },
        ],
      },
      {
        label: 'Administration',
        items: [
          { id: 'settings', label: 'HR Policies & Config', icon: Settings },
        ],
      },
    ],
  },

  EMPLOYEE: {
    portalPath: '/employee',
    defaultTab: 'attendance',
    sections: [
      {
        label: 'My Workspace',
        items: [
          { id: 'attendance', label: 'Shift Attendance', icon: Clock, module: 'attendance' },
          { id: 'tasks', label: 'My Assigned Tasks', icon: CheckSquare, module: 'tasks' },
          { id: 'leaves', label: 'My Leave Requests', icon: Calendar, module: 'leave' },
          { id: 'timesheets', label: 'My Timesheets', icon: Clock, module: 'timesheets' },
          { id: 'notifications', label: 'Announcements', icon: Bell },
        ],
      },
    ],
  },
};
