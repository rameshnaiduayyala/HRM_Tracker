import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EntitlementProvider } from './contexts/EntitlementContext';
import { SocketProvider } from './contexts/SocketContext';
import TeamChat from './components/TeamChat';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import ModuleGuard from './guards/ModuleGuard';
import { MODULE_KEYS } from './config/entitlements';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EmployeePortal = lazy(() => import('./pages/EmployeePortal'));
const HRPortal = lazy(() => import('./pages/HRPortal'));

const LoadingRoute = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 font-sans" style={{ background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
    <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-2xl animate-pulse">
      <div className="w-4 h-4 rounded-lg bg-indigo-500 animate-spin" />
    </div>
    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] animate-pulse">Loading Workspace...</span>
  </div>
);

const TenantDashboardRoute = ({ children, module }) => (
  <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR']}>
    <ModuleGuard module={module}>
      {children || <Dashboard />}
    </ModuleGuard>
  </ProtectedRoute>
);

const PlatformRoute = () => (
  <ProtectedRoute allowedRoles={['SUPER_ADMIN']} fallbackPath="/dashboard">
    <Dashboard />
  </ProtectedRoute>
);

export default function App() {
  return (
    <EntitlementProvider>
      <SocketProvider>
        <TeamChat />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-base)',
            },
          }}
        />
        <BrowserRouter>
          <Suspense fallback={<LoadingRoute />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            
              <Route path="/dashboard/*" element={<TenantDashboardRoute />} />

              <Route
                path="/hr/*"
                element={
                  <ProtectedRoute allowedRoles={['HR']}>
                    <HRPortal />
                  </ProtectedRoute>
                }
              />

              <Route path="/work" element={<Navigate to="/work/projects" replace />} />
              <Route path="/work/projects" element={<TenantDashboardRoute module={MODULE_KEYS.PROJECTS} />} />
              <Route path="/work/tasks" element={<TenantDashboardRoute module={MODULE_KEYS.TASKS} />} />
              <Route path="/work/timesheets" element={<TenantDashboardRoute module={MODULE_KEYS.TIMESHEETS} />} />

              <Route path="/tracking" element={<Navigate to="/tracking/reports" replace />} />
              <Route path="/tracking/reports" element={<TenantDashboardRoute module={MODULE_KEYS.TRACKING} />} />

              <Route path="/payroll" element={<Navigate to="/payroll/payslips" replace />} />
              <Route path="/payroll/payslips" element={<TenantDashboardRoute module={MODULE_KEYS.PAYROLL} />} />

              <Route path="/reports" element={<TenantDashboardRoute />} />
              <Route path="/admin/settings" element={<TenantDashboardRoute />} />
              <Route path="/admin/configurations" element={<TenantDashboardRoute />} />

              <Route path="/platform" element={<Navigate to="/platform/organizations" replace />} />
              <Route path="/platform/dashboard" element={<PlatformRoute />} />
              <Route path="/platform/organizations" element={<PlatformRoute />} />
              <Route path="/platform/plans" element={<PlatformRoute />} />
              <Route path="/platform/system/health" element={<PlatformRoute />} />
              <Route path="/platform/audit-logs" element={<PlatformRoute />} />
            
              <Route
                path="/employee/*"
                element={
                  <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                    <EmployeePortal />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SocketProvider>
    </EntitlementProvider>
  );
}





