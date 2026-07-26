import React, { useState, useEffect } from 'react';
import { Users, Building2, Calendar, FileText, Clock, Plus, UserPlus, CheckCircle2, ShieldAlert, Award, TrendingUp } from 'lucide-react';
import { Heading, Text, Badge } from '../Typography';
import Table from '../Table';
import Button from '../Button';
import FilterBar from '../FilterBar';
import { attendanceApi, leaveApi, payslipApi } from '../../services/api';
import { toast } from 'react-hot-toast';

export default function HRMDashboardTab({ companyId, employees = [], departments = [], teams = [], onNavigateTab }) {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (companyId) {
      fetchHrmData();
    }
  }, [companyId]);

  const fetchHrmData = async () => {
    setLoading(true);
    try {
      const [attRes, leaveRes, payRes] = await Promise.allSettled([
        attendanceApi.getTodaySummary ? attendanceApi.getTodaySummary(companyId) : Promise.resolve({ data: [] }),
        leaveApi.getRequests ? leaveApi.getRequests(companyId) : Promise.resolve({ data: [] }),
        payslipApi.getByCompany ? payslipApi.getByCompany(companyId) : Promise.resolve({ data: [] }),
      ]);

      if (attRes.status === 'fulfilled') setAttendance(attRes.value?.data || attRes.value || []);
      if (leaveRes.status === 'fulfilled') setLeaves(leaveRes.value?.data || leaveRes.value || []);
      if (payRes.status === 'fulfilled') setPayslips(payRes.value?.data || payRes.value || []);
    } catch (err) {
      toast.error('Failed to load HRM metrics');
    } finally {
      setLoading(false);
    }
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
  const totalPayrollCost = payslips.reduce((acc, p) => acc + Number(p.netPay || 0), 0);

  const employeeColumns = [
    {
      accessorKey: 'employeeNum',
      header: 'Employee ID',
      cell: (info) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{info.getValue()}</span>,
    },
    {
      accessorKey: 'user',
      header: 'Staff Name',
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div>
            <span className="font-semibold text-xs block" style={{ color: 'var(--text-primary)' }}>
              {emp.user?.firstName} {emp.user?.lastName}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{emp.user?.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => (
        <Badge variant="indigo">{row.original.department?.name || 'Unassigned'}</Badge>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: (info) => <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{info.getValue() || 'Team Member'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => (
        <Badge variant={info.getValue() === 'ACTIVE' ? 'emerald' : 'rose'}>
          {info.getValue()}
        </Badge>
      ),
    },
  ];

  const filteredEmployees = employees.filter((emp) => {
    const name = `${emp.user?.firstName || ''} ${emp.user?.lastName || ''} ${emp.user?.email || ''}`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <Heading level={2}>Core Human Resource Management (HRM Hub)</Heading>
          <Text variant="muted" size="xs">
            Unified portal for staff directory, department structures, leave requests, attendance, and payroll payslips.
          </Text>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => onNavigateTab && onNavigateTab('employees')}>
            <UserPlus className="w-4 h-4" /> Directory & Onboarding
          </Button>
        </div>
      </div>

      {/* HRM Stat Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <Text variant="muted" size="xs" className="font-bold uppercase tracking-wider">Total Headcount</Text>
            <Heading level={2} className="mt-1">{totalEmployees}</Heading>
            <Text variant="secondary" size="xs" className="mt-1">{activeEmployees} active staff</Text>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <Text variant="muted" size="xs" className="font-bold uppercase tracking-wider">Departments</Text>
            <Heading level={2} className="mt-1">{departments.length}</Heading>
            <Text variant="secondary" size="xs" className="mt-1">{teams.length} teams active</Text>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <Text variant="muted" size="xs" className="font-bold uppercase tracking-wider">Pending Leaves</Text>
            <Heading level={2} className="mt-1 text-amber-600 dark:text-amber-400">{pendingLeaves}</Heading>
            <Text variant="secondary" size="xs" className="mt-1">Awaiting approval</Text>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <Text variant="muted" size="xs" className="font-bold uppercase tracking-wider">Monthly Payroll</Text>
            <Heading level={2} className="mt-1 text-emerald-600 dark:text-emerald-400">
              ₹{totalPayrollCost.toLocaleString('en-IN')}
            </Heading>
            <Text variant="secondary" size="xs" className="mt-1">{payslips.length} payslips issued</Text>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Access Modules Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab && onNavigateTab('departments')}
          className="p-4 bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl text-left hover:border-indigo-500 transition group shadow-md"
        >
          <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition" />
          <Heading level={5}>Departments</Heading>
          <Text variant="muted" size="xs">Organize org structure</Text>
        </button>

        <button
          onClick={() => onNavigateTab && onNavigateTab('teams')}
          className="p-4 bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl text-left hover:border-indigo-500 transition group shadow-md"
        >
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition" />
          <Heading level={5}>Teams</Heading>
          <Text variant="muted" size="xs">Manage functional squads</Text>
        </button>

        <button
          onClick={() => onNavigateTab && onNavigateTab('leaves')}
          className="p-4 bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl text-left hover:border-indigo-500 transition group shadow-md"
        >
          <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition" />
          <Heading level={5}>Leave Management</Heading>
          <Text variant="muted" size="xs">Review staff time off</Text>
        </button>

        <button
          onClick={() => onNavigateTab && onNavigateTab('payslips')}
          className="p-4 bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl text-left hover:border-indigo-500 transition group shadow-md"
        >
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition" />
          <Heading level={5}>Payroll & Payslips</Heading>
          <Text variant="muted" size="xs">Process INR salary slips</Text>
        </button>
      </div>

      {/* Staff Roster & Quick Directory */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Heading level={3}>Organization Staff Directory</Heading>
            <Text variant="muted" size="xs" className="mt-1">
              Active company workforce members across all departments.
            </Text>
          </div>
          <Badge variant="indigo">{filteredEmployees.length} Members</Badge>
        </div>

        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search staff by name or email..."
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={[
            { label: 'All Staff', value: 'ALL' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'On Leave', value: 'ON_LEAVE' },
          ]}
        />

        <Table
          data={filteredEmployees}
          columns={employeeColumns}
          emptyMessage="No employees found in directory."
        />
      </div>
    </div>
  );
}
