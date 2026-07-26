import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { EntitlementProvider } from './contexts/EntitlementContext';
import { SocketProvider } from './contexts/SocketContext';
import TeamChat from './components/TeamChat';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmployeePortal from './pages/EmployeePortal';
import HRPortal from './pages/HRPortal';

import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hr/*"
              element={
                <ProtectedRoute allowedRoles={['HR']}>
                  <HRPortal />
                </ProtectedRoute>
              }
            />
            
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
        </BrowserRouter>
      </SocketProvider>
    </EntitlementProvider>
  );
}





