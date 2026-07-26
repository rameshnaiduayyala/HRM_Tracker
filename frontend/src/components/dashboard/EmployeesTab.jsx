import React, { useState } from 'react';
import { UserPlus, Edit2, Eye, Trash2, Search, RefreshCw } from 'lucide-react';
import Table from '../Table';
import Button from '../Button';
import Drawer from '../Drawer';
import EmployeeForm from '../EmployeeForm';
import FilterBar from '../FilterBar';

export default function EmployeesTab({ employees = [], onSubmitEmployee, onResetEmployee, onDeleteEmployee, onViewProfile, loading }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleHireClick = () => {
    setSelectedEmployee(null);
    setIsDrawerOpen(true);
  };

  const handleEditClick = (emp) => {
    setSelectedEmployee(emp);
    setIsDrawerOpen(true);
  };

  const handleResetClick = (emp) => {
    if (window.confirm(`Are you sure you want to CLEAR ALL tracking data for ${emp.user.firstName} ${emp.user.lastName}? This action is irreversible.`)) {
      onResetEmployee(emp.id);
    }
  };

  const handleDeleteClick = (emp) => {
    if (window.confirm(`Permanently DELETE employee ${emp.user.firstName} ${emp.user.lastName} and their user account? This cannot be undone.`)) {
      onDeleteEmployee(emp.id);
    }
  };

  const handleSubmit = async (payload) => {
    const success = await onSubmitEmployee(selectedEmployee, payload);
    if (success) {
      setIsDrawerOpen(false);
      setSelectedEmployee(null);
    }
  };

  // Get unique departments for the filter dropdown
  const departments = ['ALL', ...new Set(employees.map(e => e.department?.name || (typeof e.department === 'string' ? e.department : '')).filter(Boolean))];

  // Filter employees list based on search and selected options
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.toLowerCase();
    const email = (emp.user.email || '').toLowerCase();
    const empNum = (emp.employeeNum || '').toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          email.includes(searchQuery.toLowerCase()) || 
                          empNum.includes(searchQuery.toLowerCase());

    const empDept = emp.department?.name || (typeof emp.department === 'string' ? emp.department : '');
    const matchesDept = deptFilter === 'ALL' || empDept === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const getDeptBadgeClass = (dept) => {
    const deptStr = dept?.name || (typeof dept === 'string' ? dept : '') || '';
    const d = deptStr.toUpperCase();
    if (d.includes('ENG')) return 'px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40';
    if (d.includes('HR') || d.includes('PEOPLE')) return 'px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40';
    if (d.includes('SALES')) return 'px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40';
    if (d.includes('DES') || d.includes('PROD')) return 'px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40';
    return 'px-2 py-0.5 rounded text-[11px] font-bold border border-[var(--border-subtle)]' + ' style="background: var(--bg-card-alt); color: var(--text-primary);"';
  };

  const employeeColumns = [
    {
      id: 'employeeCard',
      header: 'Employee',
      cell: ({ row }) => {
        const emp = row.original;
        const initials = `${emp.user.firstName?.[0] || ''}${emp.user.lastName?.[0] || ''}`.toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#6063ee)', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.15)' }}>
              {initials || '?'}
            </div>
            <div>
              <span className="block text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
                {emp.user.firstName} {emp.user.lastName}
              </span>
              <span className="block text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {emp.user.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'employeeNum',
      header: 'ID',
      cell: (info) => <span className="font-mono text-[11px] tracking-tight">{info.getValue() || 'N/A'}</span>,
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: (info) => {
        const dept = info.getValue();
        const deptName = dept?.name || (typeof dept === 'string' ? dept : '') || 'Unassigned';
        return <span className={getDeptBadgeClass(dept)}>{deptName}</span>;
      },
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: (info) => <span style={{ color: 'var(--text-secondary)' }}>{info.getValue() || 'N/A'}</span>,
    },
    {
      id: 'manager',
      header: 'Manager',
      cell: ({ row }) => {
        const emp = row.original;
        if (!emp.manager) return <span className="italic text-[11px]" style={{ color: 'var(--text-muted)' }}>None</span>;
        const initials = `${emp.manager.user.firstName?.[0] || ''}${emp.manager.user.lastName?.[0] || ''}`.toUpperCase();
        return (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold" style={{ color: 'var(--text-secondary)' }}>
              {initials}
            </div>
            <span className="text-[12px]">{emp.manager.user.firstName} {emp.manager.user.lastName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const val = info.getValue() || 'ACTIVE';
        const isActive = val === 'ACTIVE';
        const isOnLeave = val === 'ON_LEAVE';
        
        let pillClass = 'badge-rose';
        let dotColor = 'bg-rose-500';
        if (isActive) {
          pillClass = 'badge-emerald';
          dotColor = 'bg-emerald-500';
        } else if (isOnLeave) {
          pillClass = 'badge-amber';
          dotColor = 'bg-amber-500';
        }

        return (
          <span className={`badge ${pillClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {val.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Actions</span>,
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {[{
              icon: Eye,   title: 'View profile details',     color: '#4f46e5',
              action: () => onViewProfile(emp)
            },{
              icon: Edit2, title: 'Edit details',    color: '#10b981',
              action: () => handleEditClick(emp)
            },{
              icon: RefreshCw, title: 'Reset employee data', color: '#f59e0b',
              action: () => handleResetClick(emp)
            },{
              icon: Trash2,title: 'Terminate contract', color: '#ba1a1a',
              action: () => handleDeleteClick(emp)
            }].map(({ icon: Icon, title, color, action }) => (
              <button key={title} title={title} onClick={action}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ background: `${color}12`, border: `1px solid ${color}22`, color }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = `${color}44`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}22`; }}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
            Staff Directory
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage employee roles, access credentials, reporting manager hierarchies, and contracts.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="badge badge-indigo">{employees.length} Members</span>
          <Button onClick={handleHireClick}>
            <UserPlus className="w-3.5 h-3.5" /> Onboard Employee
          </Button>
        </div>
      </div>

      {/* Reusable Filters Strip */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search name, email or employee ID..."
        filters={[
          {
            label: 'Dept',
            value: deptFilter,
            onChange: setDeptFilter,
            options: departments.map(d => ({ label: d === 'ALL' ? 'All Departments' : d, value: d })),
          },
        ]}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'All', value: 'ALL' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'On Leave', value: 'ON_LEAVE' },
        ]}
      />

      {/* Main Employee Table */}
      <Table 
        data={filteredEmployees} 
        columns={employeeColumns} 
        emptyMessage="No employees found matching the search criteria." 
      />

      {/* Hire/Edit Form Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedEmployee ? 'Update Profile Details' : 'Onboard New Staff Member'}
      >
        <EmployeeForm
          initialData={selectedEmployee}
          managersList={employees}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </Drawer>
    </div>
  );
}
