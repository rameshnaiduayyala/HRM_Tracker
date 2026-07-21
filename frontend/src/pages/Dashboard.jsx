import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { companyApi, employeeApi, taskApi, tenantApi, planApi, payslipApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import WorkspacesTab from '../components/dashboard/WorkspacesTab';
import EmployeesTab from '../components/dashboard/EmployeesTab';
import ProjectsTab from '../components/dashboard/ProjectsTab';
import ConfigurationsTab from '../components/dashboard/ConfigurationsTab';
import PlansTab from '../components/dashboard/PlansTab';
import AnalyticsTab from '../components/dashboard/AnalyticsTab';
import ReportsTab from '../components/dashboard/ReportsTab';
import DepartmentsTab from '../components/dashboard/DepartmentsTab';
import TeamsTab from '../components/dashboard/TeamsTab';
import LeavesTab from '../components/dashboard/LeavesTab';
import NotificationsTab from '../components/dashboard/NotificationsTab';
import TasksTab from '../components/dashboard/TasksTab';
import SettingsTab from '../components/dashboard/SettingsTab';
import AIAnalyticsTab from '../components/dashboard/AIAnalyticsTab';
import PayslipsTab from '../components/dashboard/PayslipsTab';
import PrintPayslipView from '../components/dashboard/PrintPayslipView';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Master Data States
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [plans, setPlans] = useState([]);

  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [previousTab, setPreviousTab] = useState('analytics');

  const handleViewPayslip = (payslip) => {
    setPreviousTab(activeTab);
    setViewingPayslip(payslip);
    setActiveTab('print-payslip');
  };

  const handleBackFromPrint = () => {
    setViewingPayslip(null);
    setActiveTab(previousTab || 'payslips');
  };

  const location = useLocation();
  const lastPathPart = location.pathname.split('/').pop();
  const validTabs = [
    'analytics',
    'ai-analytics',
    'workspaces',
    'plans',
    'employees',
    'departments',
    'teams',
    'projects',
    'tasks',
    'leaves',
    'notifications',
    'reports',
    'settings',
    'configurations',
  ];
  const activeTab = validTabs.includes(lastPathPart) ? lastPathPart : 'analytics';

  const setActiveTab = (tab) => {
    navigate(`/dashboard/${tab}`);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/dashboard/analytics', { replace: true });
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchPlans();
    if (isSuperAdmin) {
      fetchWorkspaces();
    } else {
      fetchCompanies();
    }
  }, []);

  useEffect(() => {
    if (selectedCompanyId && !isSuperAdmin) {
      fetchCompanyData(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const handleSelectPlan = async (planId) => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      await tenantApi.subscribe(selectedCompanyId, planId);
      toast.success('Subscription plan activated successfully!');
      fetchCompanies();
    } catch (err) {
      toast.error(err.message || 'Failed to activate plan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await tenantApi.list();
      setWorkspaces(res.data.tenants);
    } catch (err) {
      setError('Failed to fetch workspaces.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await planApi.list();
      setPlans(res.data.plans);
    } catch (err) {
      setError('Failed to fetch billing plans.');
    }
  };

  const fetchCompanies = async () => {
    if (isSuperAdmin) return;
    try {
      const res = await companyApi.list();
      setCompanies(res.data.companies);
      if (res.data.companies.length > 0) {
        setSelectedCompanyId(res.data.companies[0].id);
      }
    } catch (err) {
      setError('Failed to fetch companies.');
    }
  };

  const fetchCompanyData = async (companyId) => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, projRes] = await Promise.all([
        employeeApi.list(companyId),
        taskApi.listProjects(companyId),
      ]);
      setEmployees(empRes.data.employees);
      setProjects(projRes.data.projects);
    } catch (err) {
      setError('Failed to load company details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await tenantApi.updateStatus(id, nextStatus);
      toast.success('Workspace status updated!');
      fetchWorkspaces();
    } catch (err) {
      setError('Failed to update workspace status.');
    }
  };

  const handleCreateTenant = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await tenantApi.create(data);
      toast.success('Workspace & Company Admin onboarded successfully!');
      fetchWorkspaces();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to onboard workspace.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorkspace = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      await tenantApi.update(id, data);
      toast.success('Workspace & Admin credentials updated successfully!');
      fetchWorkspaces();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to update workspace.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (data) => {
    setLoading(true);
    try {
      await planApi.create(data);
      toast.success('Plan created successfully!');
      fetchPlans();
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to create plan.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (id, data) => {
    setLoading(true);
    try {
      await planApi.update(id, data);
      toast.success('Plan updated successfully!');
      fetchPlans();
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to update plan.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id) => {
    setLoading(true);
    try {
      await planApi.delete(id);
      toast.success('Plan deleted successfully!');
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to delete plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (name) => {
    setLoading(true);
    try {
      await companyApi.create(name);
      toast.success('Division registered successfully!');
      fetchCompanies();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectName) => {
    if (!selectedCompanyId) return false;
    setLoading(true);
    try {
      await taskApi.createProject(projectName, selectedCompanyId);
      toast.success('Project created successfully!');
      fetchCompanyData(selectedCompanyId);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (employee, payload) => {
    setLoading(true);
    setError(null);
    try {
      if (employee) {
        await employeeApi.update(employee.id, {
          ...payload,
          companyId: selectedCompanyId,
        });
        toast.success('Employee profile updated successfully!');
      } else {
        await employeeApi.create({
          ...payload,
          companyId: selectedCompanyId,
        });
        toast.success('Employee hired successfully!');
      }
      fetchCompanyData(selectedCompanyId);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to save employee profile.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeReset = async (employeeId) => {
    setLoading(true);
    setError(null);
    try {
      await employeeApi.reset(employeeId);
      toast.success('Employee tracking and attendance records reset successfully!');
      fetchCompanyData(selectedCompanyId);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to reset employee records.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeDelete = async (employeeId) => {
    setLoading(true);
    setError(null);
    try {
      await employeeApi.delete(employeeId, selectedCompanyId);
      toast.success('Employee and user account deleted successfully!');
      fetchCompanyData(selectedCompanyId);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete employee.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeCompany = companies.find((c) => c.id === selectedCompanyId);
  const activeSubscription = activeCompany?.subscriptions?.find((s) => s.status === 'ACTIVE');
  const hasNoSubscription = !isSuperAdmin && companies.length > 0 && !activeSubscription;

  return (
    <div className="min-h-screen text-gray-100 flex flex-col" style={{ background: 'var(--bg-canvas)', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <Header />

      {/* Subscription Activation Wall */}
      {hasNoSubscription ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#0b0f19] to-[#050811]">
          <div className="w-full max-w-4xl space-y-8 text-center">
            {user?.role === 'ADMIN' ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">Activate Your Company Workspace</h2>
                  <p className="text-sm text-gray-400 max-w-lg mx-auto">
                    Your workspace registration has been approved! Select a subscription billing plan below to initialize and activate your platform workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  {plans.map((p) => (
                    <div key={p.id} className="bg-[#111827] border border-gray-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl">
                      <div>
                        <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {p.billingCycle}
                        </span>
                        <h4 className="text-base font-extrabold text-white mt-3 uppercase tracking-wide">{p.name}</h4>
                        <div className="mt-4 flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-black text-white">${Number(p.price)}</span>
                          <span className="text-xs text-gray-500">/ month</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Up to {p.employeeLimit} employees allowed</p>
                        
                        <ul className="mt-6 space-y-2.5 text-left text-xs text-gray-400 border-t border-gray-800 pt-6">
                          {(p.features || []).map((feat, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleSelectPlan(p.id)}
                        disabled={loading}
                        className="w-full mt-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/10 uppercase tracking-wider"
                      >
                        Activate Plan
                      </button>
                    </div>
                  ))}
                  {plans.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-gray-500 italic">
                      No subscription plans configured. Please contact support.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="max-w-md mx-auto bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Workspace Awaiting Activation</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your workspace has been approved by the platform admin, but requires billing plan selection. Please contact your company administrator ({companies[0]?.name || 'Admin'}) to select a subscription plan and activate the portal.
                </p>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-800 hover:border-gray-700 text-xs font-semibold text-gray-400 hover:text-white rounded-lg transition"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row">
          <Sidebar
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
          />

        {/* Dynamic Tab Panel Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto" style={{ background: 'var(--bg-canvas)' }}>
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-400 rounded-xl text-sm flex justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-xs underline">Dismiss</button>
            </div>
          )}

          {/* Render Active View tab */}
          {activeTab === 'analytics' && (
            <AnalyticsTab
              isSuperAdmin={isSuperAdmin}
              workspaces={workspaces}
              plans={plans}
              employees={employees}
              projects={projects}
            />
          )}

          {!isSuperAdmin && activeTab === 'ai-analytics' && (
            <AIAnalyticsTab
              companyId={selectedCompanyId}
            />
          )}

          {isSuperAdmin && activeTab === 'workspaces' && (
            <WorkspacesTab
              workspaces={workspaces}
              plans={plans}
              onToggleStatus={handleToggleStatus}
              onCreateTenant={handleCreateTenant}
              onUpdateTenant={handleEditWorkspace}
              loading={loading}
            />
          )}

          {isSuperAdmin && activeTab === 'plans' && (
            <PlansTab
              plans={plans}
              onCreatePlan={handleCreatePlan}
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
              loading={loading}
            />
          )}

          {!isSuperAdmin && activeTab === 'employees' && (
            <EmployeesTab
              employees={employees}
              onSubmitEmployee={handleEmployeeSubmit}
              onResetEmployee={handleEmployeeReset}
              onDeleteEmployee={handleEmployeeDelete}
              loading={loading}
            />
          )}

          {!isSuperAdmin && activeTab === 'departments' && (
            <DepartmentsTab
              companyId={selectedCompanyId}
              employees={employees}
            />
          )}

          {!isSuperAdmin && activeTab === 'teams' && (
            <TeamsTab
              companyId={selectedCompanyId}
              employees={employees}
            />
          )}

          {!isSuperAdmin && activeTab === 'projects' && (
            <ProjectsTab
              projects={projects}
              onCreateProject={handleCreateProject}
              loading={loading}
            />
          )}

          {!isSuperAdmin && activeTab === 'tasks' && (
            <TasksTab
              companyId={selectedCompanyId}
              employees={employees}
            />
          )}

          {!isSuperAdmin && activeTab === 'leaves' && (
            <LeavesTab
              companyId={selectedCompanyId}
              employees={employees}
            />
          )}

          {!isSuperAdmin && activeTab === 'notifications' && (
            <NotificationsTab
              companyId={selectedCompanyId}
            />
          )}

          {!isSuperAdmin && activeTab === 'configurations' && (
            <ConfigurationsTab
              onCreateCompany={handleCreateCompany}
              loading={loading}
            />
          )}

          {!isSuperAdmin && activeTab === 'settings' && (
            <SettingsTab
              companyId={selectedCompanyId}
            />
          )}

          {!isSuperAdmin && activeTab === 'payslips' && (
            <PayslipsTab
              companyId={selectedCompanyId}
              employees={employees}
              onViewPayslip={handleViewPayslip}
            />
          )}

          {!isSuperAdmin && activeTab === 'print-payslip' && (
            <PrintPayslipView
              payslip={viewingPayslip}
              onBack={handleBackFromPrint}
            />
          )}

          {!isSuperAdmin && activeTab === 'reports' && (
            <ReportsTab
              employees={employees}
            />
          )}
        </main>
      </div>
      )}
    </div>
  );
}
