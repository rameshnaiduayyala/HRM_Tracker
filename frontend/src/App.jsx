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

// Route Guard Helpers
const GuardedRoute = ({ allowedRoles, module, children }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    {module ? <ModuleGuard module={module}>{children}</ModuleGuard> : children}
  </ProtectedRoute>
);

const CandidatePortal = lazy(() => import('./pages/CandidatePortal'));

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
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/candidate-portal/:token" element={<CandidatePortal />} />

              {/* Company Admin & Manager Routes */}
              <Route path="/dashboard/*" element={<GuardedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR']}><Dashboard /></GuardedRoute>} />
              <Route path="/work/*" element={<GuardedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR']}><Dashboard /></GuardedRoute>} />
              <Route path="/tracking/*" element={<GuardedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR']}><Dashboard /></GuardedRoute>} />
              <Route path="/payroll/*" element={<GuardedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR']}><Dashboard /></GuardedRoute>} />
              <Route path="/reports/*" element={<GuardedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR']}><Dashboard /></GuardedRoute>} />
              <Route path="/admin/*" element={<GuardedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><Dashboard /></GuardedRoute>} />

              {/* HR Portal Routes */}
              <Route path="/hr/*" element={<GuardedRoute allowedRoles={['HR']}><HRPortal /></GuardedRoute>} />

              {/* Super Admin Platform Routes */}
              <Route path="/platform/*" element={<GuardedRoute allowedRoles={['SUPER_ADMIN']}><Dashboard /></GuardedRoute>} />

              {/* Employee Portal Routes */}
              <Route path="/employee" element={<Navigate to="/employee/attendance" replace />} />
              <Route path="/employee/*" element={<GuardedRoute allowedRoles={['EMPLOYEE']}><EmployeePortal /></GuardedRoute>} />

              {/* Fallback Redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SocketProvider>
    </EntitlementProvider>
  );
}





