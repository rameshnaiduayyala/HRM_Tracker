import React, { useState, useRef } from 'react';
import { PlusCircle, Edit2, Trash2, Eye } from 'lucide-react';
import Table from '../Table';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';
import Drawer from '../Drawer';
import Modal from '../Modal';
import ConfirmModal from '../ConfirmModal';
import { useReactToPrint } from 'react-to-print';

export default function PlansTab({ plans = [], onCreatePlan, onUpdatePlan, onDeletePlan, loading }) {
  const [editingPlan, setEditingPlan] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingDetailsPlan, setViewingDetailsPlan] = useState(null);
  const [confirmDeletePlanId, setConfirmDeletePlanId] = useState(null);

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [employeeLimit, setEmployeeLimit] = useState(10);
  const [featuresRaw, setFeaturesRaw] = useState('');

  const handleEditClick = (plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(Number(plan.price));
    setBillingCycle(plan.billingCycle);
    setEmployeeLimit(plan.employeeLimit);
    setFeaturesRaw(plan.features ? plan.features.join(', ') : '');
    setIsFormOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setName('');
    setPrice(0);
    setBillingCycle('MONTHLY');
    setEmployeeLimit(10);
    setFeaturesRaw('');
    setIsFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      price: Number(price),
      billingCycle,
      employeeLimit: Number(employeeLimit),
      features: featuresRaw.split(',').map((f) => f.trim()).filter((f) => f.length > 0),
    };

    if (editingPlan) {
      const success = await onUpdatePlan(editingPlan.id, payload);
      if (success) handleCancelEdit();
    } else {
      const success = await onCreatePlan(payload);
      if (success) handleCancelEdit();
    }
  };

  const planColumns = [
    {
      accessorKey: 'name',
      header: 'Plan Name',
      cell: (info) => (
        <span className="font-bold text-white uppercase tracking-wider text-xs px-2.5 py-1 bg-indigo-950/80 border border-indigo-800 text-indigo-400 rounded-md">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price per Seat',
      cell: (info) => <span className="font-bold font-mono text-emerald-400">${Number(info.getValue()).toFixed(2)}</span>,
    },
    {
      accessorKey: 'billingCycle',
      header: 'Billing Cycle',
      cell: (info) => <span className="text-[var(--text-secondary)] text-xs font-semibold">{info.getValue()}</span>,
    },
    {
      accessorKey: 'employeeLimit',
      header: 'Max Seat Limit',
      cell: (info) => <span className="text-[var(--text-primary)] font-semibold">{info.getValue()} users</span>,
    },
    {
      accessorKey: 'features',
      header: 'Included Features',
      cell: (info) => {
        const feats = info.getValue() || [];
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {feats.map((f, idx) => (
              <span key={idx} className="text-[10px] bg-gray-800 text-[var(--text-secondary)] px-1.5 py-0.5 rounded">
                {f}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Controls</span>,
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setViewingDetailsPlan(plan)}
              className="p-2 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleEditClick(plan)}
              className="p-2 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center"
              title="Edit plan"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="danger"
              onClick={() => setConfirmDeletePlanId(plan.id)}
              className="p-2 text-xs rounded-lg flex items-center justify-center"
              title="Delete plan"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Left Panel: Plans Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Monetization Plans</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">Configure pricing tiers, active features, and seat capacities for tenants.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsFormOpen(true)}
              className="py-1.5 px-3 text-xs"
            >
              Create Plan
            </Button>
          </div>
        </div>

        <Table 
          data={plans} 
          columns={planColumns} 
          emptyMessage="No billing plans registered yet. Click 'Create Plan' on the top-right to start." 
        />
      </div>

      {/* Right Panel: Create/Edit Plan Drawer */}
      <Drawer
        isOpen={isFormOpen}
        onClose={handleCancelEdit}
        title={editingPlan ? 'Edit Pricing Plan' : 'Create Pricing Plan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Plan Title"
            required
            placeholder="BASIC / PRO / ENTERPRISE"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Seat Price ($ / month)"
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="29.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <Select
            label="Billing Cycle"
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
          >
            <option value="MONTHLY">Monthly Billing</option>
            <option value="YEARLY">Yearly Billing</option>
          </Select>

          <Input
            label="Maximum Seats (Employees)"
            required
            type="number"
            min="1"
            placeholder="20"
            value={employeeLimit}
            onChange={(e) => setEmployeeLimit(e.target.value)}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">Included Features (comma separated)</label>
            <textarea
              placeholder="Screenshots, Work Logs, Attendance Tracking"
              value={featuresRaw}
              onChange={(e) => setFeaturesRaw(e.target.value)}
              className="w-full h-20 px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-base)] text-white text-xs rounded-xl focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t border-[var(--border-base)]/80">
            <Button
              type="submit"
              loading={loading}
              className="flex-1 py-2.5"
            >
              <PlusCircle className="w-4 h-4" /> {editingPlan ? 'Save Changes' : 'Create Plan'}
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

      {/* Plan Details Modal */}
      <Modal
        isOpen={!!viewingDetailsPlan}
        onClose={() => setViewingDetailsPlan(null)}
        title="Pricing Plan Configuration Report"
      >
        {viewingDetailsPlan && (
          <div className="space-y-6">
            {/* Printable Wrapper */}
            <div 
              ref={printRef}
              id="print-section" 
              className="space-y-6 p-4 rounded-xl border border-[var(--border-base)] bg-[var(--bg-card-alt)] print:bg-white print:text-black print:border-none"
            >
              {/* Print Header */}
              <div className="hidden print:block border-b pb-4 mb-4 border-gray-200">
                <h1 className="text-2xl font-bold">TASKTRACKY SUBSCRIPTION PLAN CONFIGURATION</h1>
                <p className="text-xs text-[var(--text-muted)]">Generated on {new Date().toLocaleDateString()}</p>
              </div>

              {/* Plan Title */}
              <div>
                <h3 className="text-xl font-bold text-white print:text-black">{viewingDetailsPlan.name} Tier</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-1">Plan ID: {viewingDetailsPlan.id}</p>
              </div>

              {/* Financial Metrics */}
              <div className="border-t border-[var(--border-base)] pt-4 print:border-gray-300">
                <h4 className="text-sm font-semibold text-indigo-400 print:text-indigo-600 mb-2">Plan Pricing & Cycles</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] print:text-[var(--text-muted)]">Price Rate (Seat / Month):</span>
                    <span className="font-semibold text-white print:text-black">${Number(viewingDetailsPlan.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] print:text-[var(--text-muted)]">Billing Cycle:</span>
                    <span className="font-semibold text-white print:text-black">{viewingDetailsPlan.billingCycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)] print:text-[var(--text-muted)]">Employee Seat Limit:</span>
                    <span className="font-semibold text-white print:text-black">{viewingDetailsPlan.employeeLimit} Seats</span>
                  </div>
                </div>
              </div>

              {/* Included functional list */}
              <div className="border-t border-[var(--border-base)] pt-4 print:border-gray-300">
                <h4 className="text-sm font-semibold text-indigo-400 print:text-indigo-600 mb-2">Capabilities & Features</h4>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {viewingDetailsPlan.features?.map((f, i) => (
                    <span key={i} className="px-2.5 py-1 bg-gray-800 text-[var(--text-primary)] rounded-md print:border print:bg-white print:text-black text-xs font-semibold">
                      {f}
                    </span>
                  ))}
                  {(!viewingDetailsPlan.features || viewingDetailsPlan.features.length === 0) && (
                    <span className="text-xs text-[var(--text-muted)]">No custom features listed in this plan tier.</span>
                  )}
                </div>
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
                onClick={() => setViewingDetailsPlan(null)}
                className="py-2.5 px-4"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Plan Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDeletePlanId}
        onClose={() => setConfirmDeletePlanId(null)}
        onConfirm={async () => {
          await onDeletePlan(confirmDeletePlanId);
          setConfirmDeletePlanId(null);
        }}
        title="Delete Pricing Tier"
        message="Are you sure you want to delete this subscription plan tier? Any workspaces on this plan will remain active but won't be able to re-subscribe to this tier."
        confirmText="Delete Tier"
        variant="danger"
      />
    </div>
  );
}




