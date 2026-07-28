export const DASHBOARD_TAB_ROUTES = {
  analytics: '/dashboard/analytics',
  'ai-analytics': '/dashboard/ai-analytics',
  workspaces: '/platform/organizations',
  plans: '/platform/plans',
  employees: '/dashboard/employees',
  departments: '/dashboard/departments',
  teams: '/dashboard/teams',
  projects: '/work/projects',
  tasks: '/work/tasks',
  leaves: '/dashboard/leaves',
  notifications: '/dashboard/notifications',
  reports: '/reports',
  settings: '/admin/settings',
  configurations: '/admin/configurations',
  payslips: '/payroll/payslips',
  timesheets: '/work/timesheets',
  'system-ops': '/platform/system/health',
  'hrm-dashboard': '/dashboard/hrm-dashboard',
};

export const HR_TAB_ROUTES = {
  'hrm-dashboard': '/hr/dashboard',
  employees: '/hr/people/employees',
  departments: '/hr/people/departments',
  teams: '/hr/people/teams',
  projects: '/work/projects',
  tasks: '/work/tasks',
  leaves: '/hr/leave/requests',
  notifications: '/hr/notifications',
  payslips: '/payroll/payslips',
  reports: '/tracking/reports',
  timesheets: '/work/timesheets',
  settings: '/hr/settings',
};

export const EMPLOYEE_TAB_ROUTES = {
  attendance: '/employee/attendance',
  tasks: '/employee/tasks',
  leaves: '/employee/leave',
  idcard: '/employee/idcard',
  timesheets: '/employee/timesheet',
  notifications: '/employee/notifications',
};

export const ROUTE_TAB_ALIASES = {
  organizations: 'workspaces',
  health: 'system-ops',
  requests: 'leaves',
  leave: 'leaves',
  timesheet: 'timesheets',
};

export function resolveTabFromPath(pathname, validTabs, defaultTab) {
  const lastPathPart = pathname.split('/').filter(Boolean).pop();
  const isHrDashboard = pathname.startsWith('/hr/') && lastPathPart === 'dashboard';
  const isPlatformDashboard = pathname.startsWith('/platform/') && lastPathPart === 'dashboard';
  const aliasedTab = isHrDashboard
    ? 'hrm-dashboard'
    : isPlatformDashboard
      ? 'analytics'
      : ROUTE_TAB_ALIASES[lastPathPart] || lastPathPart;

  return validTabs.includes(aliasedTab) ? aliasedTab : defaultTab;
}

export function getTabRoute(routeMap, tab, fallbackBasePath) {
  return routeMap[tab] || `${fallbackBasePath}/${tab}`;
}
