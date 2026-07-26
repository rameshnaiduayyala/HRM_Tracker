import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import TimesheetsTab from '../components/dashboard/TimesheetsTab';
import HRMDashboardTab from '../components/dashboard/HRMDashboardTab';
import EmployeeProfileView from '../components/dashboard/EmployeeProfileView';
import EmployeeReportView from '../components/dashboard/EmployeeReportView';
import { Users, Calendar, Clock, DollarSign, ArrowUpRight, TrendingUp, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function HRPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const lastPathPart = location.pathname.split('/').pop();
  const validTabs = [
    'hrm-dashboard',
    'employees',
    'leaves',
    'notifications',
    'payslips',
    'reports',
    'timesheets',
    'settings',
    'print-payslip',
    'employee-profile',
    'employee-report',
  ];
  const activeTab = validTabs.includes(lastPathPart) ? lastPathPart : 'hrm-dashboard';

  const setActiveTab = (tab) => {
    navigate(`/hr/${tab}`);
  };
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

  const handleEmployeeSubmit = async (data) => {
    try {
      setLoading(true);
      if (data.id) {
        // Edit Employee
        await employeeApi.update(data.id, data);
        toast.success('Employee record updated successfully.');
      } else {
        // Onboard New Employee
        await employeeApi.create({
          ...data,
          companyId: selectedCompanyId,
        });
        toast.success('Employee onboarded successfully.');
      }
      fetchCompanySpecificData(selectedCompanyId);
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to save employee details.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeDelete = async (id) => {
    try {
      setLoading(true);
      await employeeApi.delete(id, selectedCompanyId);
      toast.success('Employee offboarded successfully.');
      fetchCompanySpecificData(selectedCompanyId);
    } catch (err) {
      toast.error(err.message || 'Failed to offboard employee.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeReset = async (id) => {
    try {
      setLoading(true);
      await employeeApi.reset(id);
      toast.success('Employee login credentials reset successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to reset employee credentials.');
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
          {/* 1. Core HRM Hub Dashboard Tab */}
          {activeTab === 'hrm-dashboard' && (
            <HRMDashboardTab
              companyId={selectedCompanyId}
              employees={employees}
              departments={[]}
              teams={[]}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* 2. Staff Directory Tab */}
          {activeTab === 'employees' && (
            <EmployeesTab
              employees={employees}
              onSubmitEmployee={handleEmployeeSubmit}
              onResetEmployee={handleEmployeeReset}
              onDeleteEmployee={handleEmployeeDelete}
              onViewProfile={(emp) => navigate(`/hr/employee-profile?employeeId=${emp.id}`)}
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

          {/* 6.5 Timesheets Tab */}
          {activeTab === 'timesheets' && (
            <TimesheetsTab />
          )}

          {/* 7. Employee Profile View */}
          {activeTab === 'employee-profile' && (
            <EmployeeProfileView />
          )}

          {/* 8. Employee Activity & Attendance Report View */}
          {activeTab === 'employee-report' && (
            <EmployeeReportView />
          )}
        </main>
      </div>
    </div>
  );
}




