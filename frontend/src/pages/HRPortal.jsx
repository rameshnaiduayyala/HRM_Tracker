import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { companyApi, employeeApi, planApi, leaveApi, payslipApi } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import EmployeesTab from '../components/dashboard/EmployeesTab';
import LeavesTab from '../components/dashboard/LeavesTab';
import PayslipsTab from '../components/dashboard/PayslipsTab';
import ReportsTab from '../components/dashboard/ReportsTab';
import SettingsTab from '../components/dashboard/SettingsTab';
import PrintPayslipView from '../components/dashboard/PrintPayslipView';
import { Users, Calendar, Clock, DollarSign, ArrowUpRight, TrendingUp, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function HRPortal() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('hrm-dashboard');
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [leavesCount, setLeavesCount] = useState(0);
  const [payslipsCount, setPayslipsCount] = useState(0);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [previousTab, setPreviousTab] = useState('hrm-dashboard');

  const handleViewPayslip = (payslip) => {
    setPreviousTab(activeTab);
    setViewingPayslip(payslip);
    setActiveTab('print-payslip');
  };

  const handleBackFromPrint = () => {
    setViewingPayslip(null);
    setActiveTab(previousTab || 'payslips');
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCompanySpecificData(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const res = await companyApi.list();
      setCompanies(res.data.companies || []);
      if (res.data.companies?.length > 0) {
        setSelectedCompanyId(res.data.companies[0].id);
      }
    } catch (err) {
      toast.error('Failed to load HRM workspaces.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySpecificData = async (compId) => {
    try {
      // 1. Fetch Employees
      const empRes = await employeeApi.list(compId);
      const empList = empRes.data?.employees || [];
      setEmployees(empList);

      // 2. Fetch Active Plan limits
      const company = companies.find(c => c.id === compId);
      const activeSub = company?.subscriptions?.find(s => s.status === 'ACTIVE');
      if (activeSub?.plan) {
        setActivePlan(activeSub.plan);
      }

      // 3. Fetch Leaves
      const leaveRes = await leaveApi.list(compId);
      const pendingLeaves = (leaveRes.data?.leaves || []).filter(l => l.status === 'PENDING').length;
      setLeavesCount(pendingLeaves);

      // 4. Fetch Payslips count
      const payslipRes = await payslipApi.list(compId);
      setPayslipsCount((payslipRes.data?.payslips || []).length);
    } catch (err) {
      console.error('HRM fetch error', err);
    }
  };

  const handleCreateEmployee = async (data) => {
    try {
      setLoading(true);
      await employeeApi.create({
        ...data,
        companyId: selectedCompanyId,
      });
      toast.success('Employee onboarded successfully.');
      fetchCompanySpecificData(selectedCompanyId);
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to onboard employee.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans">
      <Header />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* HRM Navigation Sidebar */}
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          setSelectedCompanyId={setSelectedCompanyId}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {/* 1. HRM Overview Analytics Dashboard */}
          {activeTab === 'hrm-dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">HRM Command Center</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Enterprise Human Resource Metrics and Monitoring Console</p>
              </div>

              {/* KPI metrics row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-[var(--bg-card)]/40 border border-[var(--border-base)]/80 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Staff Headcount</span>
                    <span className="text-2xl font-black text-white mt-1 block">
                      {employees.length} / <span className="text-[var(--text-muted)] text-base">{activePlan?.employeeLimit || 5}</span>
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" /> Subscription Limit Seats
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[var(--bg-card)]/40 border border-[var(--border-base)]/80 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Pending Leaves</span>
                    <span className="text-2xl font-black text-amber-400 mt-1 block">{leavesCount} Request{leavesCount === 1 ? '' : 's'}</span>
                    <span className="text-[9px] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                      Awaiting review status
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[var(--bg-card)]/40 border border-[var(--border-base)]/80 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Payroll Receipts</span>
                    <span className="text-2xl font-black text-purple-400 mt-1 block">{payslipsCount} Payslip{payslipsCount === 1 ? '' : 's'}</span>
                    <span className="text-[9px] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                      Generated payments this month
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[var(--bg-card)]/40 border border-[var(--border-base)]/80 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Active Shift Sessions</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1 block">Active</span>
                    <span className="text-[9px] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                      Employees clocked in today
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Alert card limit notice */}
              {employees.length >= (activePlan?.employeeLimit || 5) && (
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-5 flex items-start gap-4 shadow-lg">
                  <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Workspace Seat Limit Warning</h4>
                    <p className="text-xs text-gray-450 mt-1 leading-relaxed">
                      Your organization has reached the maximum employee count allowed by your subscription plan ({activePlan?.name || 'BASIC'}). Please contact your company administrator to upgrade the plan constraints.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick statistics checklist */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <div className="bg-[var(--bg-card)]/40 border border-[var(--border-base)]/80 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Workspace Details</h3>
                  <div className="space-y-3.5 text-xs text-[var(--text-secondary)]">
                    <div className="flex justify-between">
                      <span>Active Plan</span>
                      <strong className="text-white uppercase tracking-wider">{activePlan?.name || 'Basic Plan'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Workspace Price</span>
                      <strong className="text-indigo-400 font-mono">${activePlan?.price || 10} / month</strong>
                    </div>
                    <div className="flex justify-between border-t border-[var(--border-base)] pt-3">
                      <span>Configured Features</span>
                      <span className="text-right text-[10px] font-medium text-[var(--text-secondary)]">
                        {(activePlan?.features || ['Leaves Tracker', 'Timesheets', 'Taskboards']).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-card)]/40 border border-[var(--border-base)]/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Platform Activity Audit</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Track and analyze all employee attendance check-ins, leaves, and salary transactions directly from your HR control panel.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="w-full mt-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition uppercase tracking-wider flex items-center justify-center gap-1"
                  >
                    View Attendance Logs <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Staff Directory Tab */}
          {activeTab === 'employees' && (
            <EmployeesTab
              employees={employees}
              onCreateEmployee={handleCreateEmployee}
              loading={loading}
            />
          )}

          {/* 3. Shift Attendance Auditor Tab */}
          {activeTab === 'reports' && (
            <ReportsTab
              employees={employees}
            />
          )}

          {/* 4. Leaves & Policies Tab */}
          {activeTab === 'leaves' && (
            <LeavesTab
              companyId={selectedCompanyId}
              employees={employees}
            />
          )}

          {/* 5. Payroll & Payslips Tab */}
          {activeTab === 'payslips' && (
            <PayslipsTab
              companyId={selectedCompanyId}
              employees={employees}
              onViewPayslip={handleViewPayslip}
            />
          )}

          {/* 5.5 Print Payslip Full Page View */}
          {activeTab === 'print-payslip' && (
            <PrintPayslipView
              payslip={viewingPayslip}
              onBack={handleBackFromPrint}
            />
          )}

          {/* 6. Settings & Policies Tab */}
          {activeTab === 'settings' && (
            <SettingsTab
              companyId={selectedCompanyId}
            />
          )}
        </main>
      </div>
    </div>
  );
}




