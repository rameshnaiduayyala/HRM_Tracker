import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Edit2, Eye, Trash2 } from 'lucide-react';
import Table from '../Table';
import Button from '../Button';
import Drawer from '../Drawer';
import Modal from '../Modal';
import EmployeeForm from '../EmployeeForm';
import { useReactToPrint } from 'react-to-print';

export default function EmployeesTab({ employees = [], onSubmitEmployee, onResetEmployee, onDeleteEmployee, loading }) {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewingDetailsEmployee, setViewingDetailsEmployee] = useState(null);
  const [timeframe, setTimeframe] = useState('week');

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleHireClick = () => {
    setSelectedEmployee(null);
    setIsDrawerOpen(true);
  };

  const handleEditClick = (emp) => {
    setSelectedEmployee(emp);
    setIsDrawerOpen(true);
  };

  const handleResetClick = (emp) => {
    if (window.confirm(`Are you sure you want to CLEAR ALL tracking data (attendance records, breaks, work sessions, screenshots, activities, and task time logs) for ${emp.user.firstName} ${emp.user.lastName}? This action is irreversible.`)) {
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

  const employeeColumns = [
    {
      id: 'employeeCard',
      header: 'Employee Card',
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#818cf8)', boxShadow: '0 0 10px rgba(99,102,241,0.25)' }}>
              {emp.user.firstName?.[0] || '?'}{emp.user.lastName?.[0] || '?'}
            </div>
            <div>
              <span className="block text-[13px] font-semibold text-white">{emp.user.firstName} {emp.user.lastName}</span>
              <span className="block text-[10px] font-mono" style={{ color: '#374151' }}>{emp.employeeNum}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'user.email',
      header: 'Email',
      cell: (info) => <span className="text-gray-400">{info.getValue()}</span>,
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: (info) => <span>{info.getValue() || 'N/A'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className={val === 'ACTIVE' ? 'badge badge-emerald' : 'badge badge-rose'}>
            <span className={`w-1.5 h-1.5 rounded-full ${val === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {val}
          </span>
        );
      },
    },
    {
      id: 'manager',
      header: 'Reporting Manager',
      cell: ({ row }) => {
        const emp = row.original;
        return emp.manager ? (
          <span>{emp.manager.user.firstName} {emp.manager.user.lastName}</span>
        ) : (
          <span className="text-gray-600 italic">None</span>
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
              icon: Eye,   title: 'View report',     color: '#6366f1',
              action: () => navigate('/dashboard/reports', { state: { selectedEmployeeId: emp.id } })
            },{
              icon: Edit2, title: 'Edit profile',    color: '#10b981',
              action: () => handleEditClick(emp)
            },{
              icon: Trash2,title: 'Delete employee', color: '#f43f5e',
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white uppercase">Staff Directory</h2>
          <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>Manage employee profiles, reporting lines, and system credentials.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="badge badge-indigo">{employees.length} hired</span>
          <Button onClick={handleHireClick}>
            <UserPlus className="w-3.5 h-3.5" /> Hire Employee
          </Button>
        </div>
      </div>

      <Table 
        data={employees} 
        columns={employeeColumns} 
        emptyMessage="No employees registered under this company workspace yet." 
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedEmployee ? 'Edit Employee Profile' : 'Hire New Employee'}
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
