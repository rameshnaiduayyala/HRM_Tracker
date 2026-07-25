import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { TrackingProvider } from './contexts/TrackingContext';
import TeamChat from './components/TeamChat';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';

export const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <TeamChat />
        <TrackingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TrackingProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
