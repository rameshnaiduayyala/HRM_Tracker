import React, { useState, useRef } from 'react';
import { UserPlus, Eye, Edit2 } from 'lucide-react';
import Table from '../Table';
import Input from '../Input';
import Button from '../Button';
import Select from '../Select';
import Drawer from '../Drawer';
import Modal from '../Modal';
import Toggle from '../Toggle';
import ConfirmModal from '../ConfirmModal';
import { useReactToPrint } from 'react-to-print';

export default function WorkspacesTab({ 
  workspaces = [], 
  plans = [], 
  onToggleStatus, 
  onCreateTenant, 
  onUpdateTenant, 
  loading 
}) {
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingDetailsWorkspace, setViewingDetailsWorkspace] = useState(null);
  const [confirmToggleStatusWorkspace, setConfirmToggleStatusWorkspace] = useState(null);

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Form states
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [planId, setPlanId] = useState('');

  const handleEditClick = (ws) => {
    setEditingWorkspace(ws);
    setNewCompanyName(ws.name);
    setNewSubdomain(ws.subdomain);
    setAdminEmail('');
    setAdminPassword('');
    setAdminFirstName('');
    setAdminLastName('');
    setIsFormOpen(true);
    // Find active subscription if exists
    const activeSub = ws.companies?.[0]?.subscriptions?.[0];
    setPlanId(activeSub?.planId || '');
  };

  const handleCancelEdit = () => {
    setEditingWorkspace(null);
    setNewCompanyName('');
    setNewSubdomain('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminFirstName('');
    setAdminLastName('');
    setPlanId('');
    setIsFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: newCompanyName,
      adminEmail: adminEmail || undefined,
      adminPassword: adminPassword || undefined,
      adminFirstName: adminFirstName || undefined,
      adminLastName: adminLastName || undefined,
      planId: planId || undefined,
    };

    if (editingWorkspace) {
      const success = await onUpdateTenant(editingWorkspace.id, payload);
      if (success) handleCancelEdit();
    } else {
      const success = await onCreateTenant({
        name: newCompanyName,
        subdomain: newSubdomain,
        ...payload
      });
      if (success) handleCancelEdit();
    }
  };

  const getWorkspaceStats = (ws) => {
    let totalEmployees = 0;
    let monthlyRevenue = 0;
    let planName = 'Free Tier';

    if (ws.companies && ws.companies.length > 0) {
      ws.companies.forEach((company) => {
        const empCount = company._count?.employees || 0;
        totalEmployees += empCount;

        const activeSub = company.subscriptions?.[0];
        if (activeSub && activeSub.plan) {
          planName = activeSub.plan.name;
          const planPrice = activeSub.plan.price;
          monthlyRevenue += empCount * planPrice;
        }
      });
    }

    return { totalEmployees, monthlyRevenue, planName };
  };

  const workspaceColumns = [
    {
      accessorKey: 'name',
      header: 'Company Workspace',
      cell: ({ row }) => {
        const ws = row.original;
        const { planName } = getWorkspaceStats(ws);
        return (
          <div>
            <span className="font-semibold text-white block">{ws.name}</span>
            <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-indigo-950/80 border border-indigo-800 text-indigo-400 px-1.5 py-0.5 rounded-md mt-1">
              Plan: {planName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'subdomain',
      header: 'Subdomain ID',
      cell: (info) => <span className="font-mono text-xs text-indigo-400">{info.getValue()}</span>,
    },
    {
      id: 'employeesCount',
      header: 'Active Seats',
      cell: ({ row }) => {
        const ws = row.original;
        const { totalEmployees } = getWorkspaceStats(ws);
        return (
          <span className="text-sm font-semibold text-gray-300">
            {totalEmployees} {totalEmployees === 1 ? 'Employee' : 'Employees'}
          </span>
        );
      },
    },
    {
      id: 'revenue',
      header: 'Monthly Revenue',
      cell: ({ row }) => {
        const ws = row.original;
        const { monthlyRevenue } = getWorkspaceStats(ws);
        return (
          <span className="text-sm font-black text-emerald-400 font-mono">
            ${monthlyRevenue.toFixed(2)} / mo
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Account Status',
      cell: ({ row }) => {
        const ws = row.original;
        const isActive = ws.status === 'ACTIVE';
        const isPending = ws.status === 'PENDING';
        
        if (isPending) {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleStatus(ws.id, 'PENDING')} // calls updateStatus to ACTIVE
                className="px-2.5 py-1 text-[10px] font-bold bg-emerald-650 hover:bg-emerald-700 text-white rounded-md uppercase tracking-wider transition"
              >
                Approve
              </button>
              <button
                onClick={() => onToggleStatus(ws.id, 'ACTIVE')} // calls updateStatus to INACTIVE
                className="px-2.5 py-1 text-[10px] font-bold bg-red-650 hover:bg-red-750 text-white rounded-md uppercase tracking-wider transition"
              >
                Reject
              </button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-3">
            <Toggle 
              checked={isActive}
              onChange={() => setConfirmToggleStatusWorkspace(ws)}
            />
            <span className={`text-xs px-2.5 py-1 rounded-md font-semibold uppercase tracking-wider ${isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
              {ws.status}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Access Controls</span>,
      cell: ({ row }) => {
        const ws = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setViewingDetailsWorkspace(ws)}
              className="p-2 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleEditClick(ws)}
              className="p-2 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center"
              title="Edit workspace"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workspaces List Card */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Registered Workspace Companies</h2>
            <p className="text-xs text-gray-500 mt-1">Audit, activate, or deactivate client tenant profiles globally.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-1 bg-gray-800 rounded-md">{workspaces.length} total</span>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="py-1.5 px-3 text-xs"
            >
              Add Workspace
            </Button>
          </div>
        </div>

        <Table 
          data={workspaces} 
          columns={workspaceColumns} 
          emptyMessage="No workspaces onboarded yet. Click 'Add Workspace' on the top-right to start." 
        />
      </div>

      {/* Onboarding or Edit Modal Drawer */}
      <Drawer
        isOpen={isFormOpen}
        onClose={handleCancelEdit}
        title={editingWorkspace ? 'Edit Workspace Profile' : 'Workspace Onboarding'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workspace Setup</h4>
          
          <Input
            label="Company Workspace Name"
            required
            placeholder="Acme Corporation"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
          />

          <Input
            label="Subdomain ID"
            required
            disabled={!!editingWorkspace}
            placeholder="acme"
            value={newSubdomain}
            onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          />

          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2 mb-2">Primary Company Admin</h4>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="First Name"
              required={!editingWorkspace}
              placeholder={editingWorkspace ? 'Leave blank to keep' : 'John'}
              value={adminFirstName}
              onChange={(e) => setAdminFirstName(e.target.value)}
            />
            <Input
              label="Last Name"
              required={!editingWorkspace}
              placeholder={editingWorkspace ? 'Leave blank to keep' : 'Doe'}
              value={adminLastName}
              onChange={(e) => setAdminLastName(e.target.value)}
            />
          </div>

          <Input
            label="Administrator Email"
            type="email"
            required={!editingWorkspace}
            placeholder={editingWorkspace ? 'Leave blank to keep' : 'admin@acme.com'}
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />

          <Input
            label="Administrator Password"
            type="password"
            required={!editingWorkspace}
            placeholder={editingWorkspace ? '•••••••• (Blank to keep)' : '••••••••'}
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />

          <Select
            label="Subscription Billing Plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
          >
            <option value="">-- Select Billing Plan --</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (${Number(p.price).toFixed(2)} / seat)
              </option>
            ))}
          </Select>

          <div className="flex gap-2 pt-4 border-t border-gray-800/80">
            <Button
              type="submit"
              loading={loading}
              className="flex-1 py-2.5"
            >
              <UserPlus className="w-4 h-4" /> {editingWorkspace ? 'Save Changes' : 'Provision Workspace'}
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleCancelEdit}
              className="py-2.5 px-4"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Workspace Details Modal */}
      <Modal
        isOpen={!!viewingDetailsWorkspace}
        onClose={() => setViewingDetailsWorkspace(null)}
        title="Workspace Details Report"
      >
        {viewingDetailsWorkspace && (() => {
          const stats = getWorkspaceStats(viewingDetailsWorkspace);
          const activeSub = viewingDetailsWorkspace.companies?.[0]?.subscriptions?.[0];
          const plan = activeSub?.plan;
          
          return (
            <div className="space-y-6">
              {/* Printable Wrapper */}
              <div 
                ref={printRef}
                id="print-section" 
                className="space-y-6 p-4 rounded-xl border border-gray-800 bg-gray-900/50 print:bg-white print:text-black print:border-none"
              >
                {/* Print Header */}
                <div className="hidden print:block border-b pb-4 mb-4 border-gray-200">
                  <h1 className="text-2xl font-bold">TASKTRACKY ENTERPRISE TENANT REPORT</h1>
                  <p className="text-xs text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                </div>

                {/* Company Title */}
                <div>
                  <h3 className="text-xl font-bold text-white print:text-black">{viewingDetailsWorkspace.name}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">Tenant ID: {viewingDetailsWorkspace.id}</p>
                  <p className="text-xs text-gray-500 font-mono">Subdomain: {viewingDetailsWorkspace.subdomain}.tasktracky.com</p>
                </div>

                {/* Subscription Details */}
                <div className="border-t border-gray-800 pt-4 print:border-gray-300">
                  <h4 className="text-sm font-semibold text-indigo-400 print:text-indigo-600 mb-2">Active Subscription Tiers</h4>
                  {plan ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400 print:text-gray-600">Plan Name:</span>
                        <span className="font-semibold text-white print:text-black">{plan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 print:text-gray-600">Price Per Seat:</span>
                        <span className="font-semibold text-white print:text-black">${Number(plan.price).toFixed(2)} / month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 print:text-gray-600">Billing Cycle:</span>
                        <span className="font-semibold text-white print:text-black">{plan.billingCycle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 print:text-gray-600">Maximum Capacity:</span>
                        <span className="font-semibold text-white print:text-black">{plan.employeeLimit} Seats</span>
                      </div>
                      <div className="mt-2">
                        <span className="block text-gray-400 print:text-gray-600 mb-1">Included Features:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {plan.features?.map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded print:border print:bg-white print:text-black text-[10px]">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No active subscription plan assigned.</p>
                  )}
                </div>

                {/* Seat Allocations & MRR */}
                <div className="border-t border-gray-800 pt-4 print:border-gray-300">
                  <h4 className="text-sm font-semibold text-indigo-400 print:text-indigo-600 mb-2">Metrics & Revenues</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400 print:text-gray-600">Active Seat Usage:</span>
                      <span className="font-semibold text-white print:text-black">{stats.totalEmployees} Employees</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 print:text-gray-600">Monthly Recurring Revenue (MRR):</span>
                      <span className="font-semibold text-emerald-400 print:text-emerald-700 font-mono">${stats.monthlyRevenue.toFixed(2)} / mo</span>
                    </div>
                  </div>
                </div>

                {/* Primary Administrator */}
                <div className="border-t border-gray-800 pt-4 print:border-gray-300">
                  <h4 className="text-sm font-semibold text-indigo-400 print:text-indigo-600 mb-2">Primary Company Admin</h4>
                  {viewingDetailsWorkspace.companies?.[0]?.employees?.[0]?.user ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400 print:text-gray-600">Full Name:</span>
                        <span className="font-semibold text-white print:text-black">
                          {viewingDetailsWorkspace.companies[0].employees[0].user.firstName} {viewingDetailsWorkspace.companies[0].employees[0].user.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 print:text-gray-600">Email Address:</span>
                        <span className="font-semibold text-white print:text-black">{viewingDetailsWorkspace.companies[0].employees[0].user.email}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No administrator details found.</p>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={handlePrint}
                  className="flex-1 py-2.5"
                >
                  Print Report
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setViewingDetailsWorkspace(null)}
                  className="py-2.5 px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Workspace Status Modification Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmToggleStatusWorkspace}
        onClose={() => setConfirmToggleStatusWorkspace(null)}
        onConfirm={async () => {
          if (confirmToggleStatusWorkspace) {
            await onToggleStatus(confirmToggleStatusWorkspace.id, confirmToggleStatusWorkspace.status);
            setConfirmToggleStatusWorkspace(null);
          }
        }}
        title={confirmToggleStatusWorkspace?.status === 'ACTIVE' ? 'Deactivate Workspace' : 'Activate Workspace'}
        message={confirmToggleStatusWorkspace?.status === 'ACTIVE' 
          ? `Are you sure you want to deactivate the workspace "${confirmToggleStatusWorkspace?.name}"? All employees under this workspace will immediately lose access.`
          : `Are you sure you want to activate the workspace "${confirmToggleStatusWorkspace?.name}"?`}
        confirmText={confirmToggleStatusWorkspace?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        variant={confirmToggleStatusWorkspace?.status === 'ACTIVE' ? 'danger' : 'primary'}
      />
    </div>
  );
}
