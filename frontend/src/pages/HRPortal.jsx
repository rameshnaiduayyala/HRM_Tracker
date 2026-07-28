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
import ProjectsTab from '../components/dashboard/ProjectsTab';
import TasksTab from '../components/dashboard/TasksTab';
import PrintPayslipView from '../components/dashboard/PrintPayslipView';
import TimesheetsTab from '../components/dashboard/TimesheetsTab';
import HRMDashboardTab from '../components/dashboard/HRMDashboardTab';
import EmployeeProfileView from '../components/dashboard/EmployeeProfileView';
import EmployeeReportView from '../components/dashboard/EmployeeReportView';
import OnboardingTab from '../components/dashboard/OnboardingTab';
import OffboardingTab from '../components/dashboard/OffboardingTab';
import VisualOfferBuilder from '../components/dashboard/VisualOfferBuilder';
import { Users, Calendar, Clock, DollarSign, ArrowUpRight, TrendingUp, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { HR_TAB_ROUTES, getTabRoute, resolveTabFromPath } from '../config/navigationRoutes';

export default function HRPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const validTabs = [
    'hrm-dashboard',
    'employees',
    'onboarding',
    'offer-template',
    'offboarding',
    'departments',
    'teams',
    'projects',
    'tasks',
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
  const activeTab = resolveTabFromPath(location.pathname, validTabs, 'hrm-dashboard');

  const setActiveTab = (tab) => {
    navigate(getTabRoute(HR_TAB_ROUTES, tab, '/hr'));
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

  const handleEmployeeSubmit = async (employee, payload) => {
    try {
      setLoading(true);
      const data = payload || employee;
      const targetId = employee?.id || data?.id;
      if (targetId) {
        // Edit Employee
        await employeeApi.update(targetId, {
          ...data,
          companyId: selectedCompanyId,
        });
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
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col md:flex-row font-sans">
      {/* HRM Navigation Sidebar on the Left */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        setSelectedCompanyId={setSelectedCompanyId}
      />

      {/* Main Right Content Shell with Header at top */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />

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

          {/* 2.1 Onboarding & Offer Letters Tab */}
          {activeTab === 'onboarding' && (
            <OnboardingTab
              companyId={selectedCompanyId}
              departments={[]}
              employees={employees}
              onEmployeeConverted={() => fetchCompanySpecificData(selectedCompanyId)}
            />
          )}

          {/* 2.15 Visual Drag & Drop Offer Template Builder Tab */}
          {activeTab === 'offer-template' && (
            <VisualOfferBuilder
              companyId={selectedCompanyId}
            />
          )}

          {/* 2.2 Offboarding & Exit Management Tab */}
          {activeTab === 'offboarding' && (
            <OffboardingTab
              companyId={selectedCompanyId}
              employees={employees}
            />
          )}

          {/* 2.2 Projects Management Tab */}
          {activeTab === 'projects' && (
            <ProjectsTab
              projects={[]}
              onCreateProject={() => { }}
              loading={loading}
            />
          )}

          {/* 2.5 Task Execution Board Tab */}
          {activeTab === 'tasks' && (
            <TasksTab
              companyId={selectedCompanyId}
              employees={employees}
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
          {activeTab === 'employee-profile' && (() => {
            const searchParams = new URLSearchParams(location.search);
            const empId = searchParams.get('employeeId');
            const selectedEmp = employees.find(e => e.id === empId) || employees[0];
            const currentCompany = companies.find(c => c.id === selectedCompanyId) || selectedEmp?.company;
            const updatedEmp = selectedEmp ? { ...selectedEmp, company: currentCompany || selectedEmp.company } : null;
            return (
              <EmployeeProfileView
                employee={updatedEmp}
                onBack={() => navigate('/hr/people/employees')}
                onEdit={(emp, payload) => handleEmployeeSubmit(emp, payload)}
                onReset={(emp) => handleEmployeeReset(emp.id)}
                onDelete={(emp) => handleEmployeeDelete(emp.id)}
                loading={loading}
              />
            );
          })()}

          {/* 8. Employee Activity & Attendance Report View */}
          {activeTab === 'employee-report' && (
            <EmployeeReportView />
          )}
        </main>
      </div>
    </div>
  );
}




