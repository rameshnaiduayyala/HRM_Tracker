import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceApi } from '../services';
import { useAuthStore } from '../store/useAuthStore';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LeavesTab from '../components/dashboard/LeavesTab';
import TasksTab from '../components/dashboard/TasksTab';
import NotificationsTab from '../components/dashboard/NotificationsTab';
import { Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function EmployeePortal() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('attendance'); // attendance, tasks, leaves, notifications

  const [attendance, setAttendance] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    setLoading(true);
    try {
      const statusRes = await attendanceApi.status();
      setAttendance(statusRes.data.attendance);
      setClockedIn(statusRes.data.clockedIn);
      
      const profile = statusRes.data.employee;
      setEmployeeProfile(profile);

      if (profile) {
        // Create a single-element list of employees representing self for child components
        setEmployeesList([profile]);
      }
    } catch (err) {
      console.error('Failed to retrieve employee status', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      await attendanceApi.clockIn();
      toast.success('Shift started successfully!');
      fetchProfileAndData();
    } catch (err) {
      toast.error(err.message || 'Clock In failed');
    }
  };

  const handleClockOut = async () => {
    try {
      await attendanceApi.clockOut();
      toast.success('Shift ended successfully!');
      fetchProfileAndData();
    } catch (err) {
      toast.error(err.message || 'Clock Out failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar configured with Employee Portal active tab state */}
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        <main className="flex-1 overflow-y-auto p-8">
          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Shift Attendance</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Log your daily working hours and clock session status</p>
              </div>

              <div className="max-w-md bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-lg space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-base)]">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Daily Shift Controller</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Shift status updates dynamically in real-time</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[var(--bg-card-alt)] p-4 rounded-xl border border-[var(--border-base)]/80">
                  <span className="text-xs text-[var(--text-primary)]">Working State</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${clockedIn ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30' : 'bg-red-950 text-red-400 border border-red-800/30'}`}>
                    {clockedIn ? 'Clocked In' : 'Clocked Out'}
                  </span>
                </div>

                <div className="pt-2">
                  {!clockedIn ? (
                    <button
                      onClick={handleClockIn}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/10 uppercase tracking-wider"
                    >
                      Clock In Shift
                    </button>
                  ) : (
                    <button
                      onClick={handleClockOut}
                      className="w-full py-3 bg-red-650 hover:bg-red-750 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-600/10 uppercase tracking-wider"
                    >
                      Clock Out Shift
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && employeeProfile && (
            <TasksTab
              companyId={employeeProfile.companyId}
              employees={employeesList}
              employeeId={employeeProfile.id}
            />
          )}

          {/* Leaves Tab */}
          {activeTab === 'leaves' && employeeProfile && (
            <LeavesTab
              companyId={employeeProfile.companyId}
              employees={employeesList}
              employeeId={employeeProfile.id}
            />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && employeeProfile && (
            <NotificationsTab
              companyId={employeeProfile.companyId}
            />
          )}
        </main>
      </div>
    </div>
  );
}




