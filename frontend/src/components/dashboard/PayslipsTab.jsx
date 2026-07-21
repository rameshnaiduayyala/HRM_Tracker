import React, { useState, useEffect, useRef } from 'react';
import { payslipApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { DollarSign, Plus, Trash2, Printer, Eye, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Table from '../Table';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import Drawer from '../Drawer';
import Modal from '../Modal';

export default function PayslipsTab({ companyId, employees = [], onViewPayslip }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState('July 2026');
  const [baseSalary, setBaseSalary] = useState('');
  const [allowance, setAllowance] = useState('');
  const [deductions, setDeductions] = useState('');

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  useEffect(() => {
    fetchPayslips();
  }, [companyId]);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await payslipApi.list(companyId);
      setPayslips(res.data.payslips || []);
    } catch (err) {
      toast.error('Failed to load payslips.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayslip = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('Please select an employee.');
      return;
    }

    try {
      setLoading(true);
      await payslipApi.create({
        employeeId,
        month,
        baseSalary: Number(baseSalary),
        allowance: Number(allowance) || 0,
        deductions: Number(deductions) || 0,
      });

      toast.success('Payslip generated successfully!');
      setIsFormOpen(false);
      fetchPayslips();

      // Reset form
      setEmployeeId('');
      setBaseSalary('');
      setAllowance('');
      setDeductions('');
    } catch (err) {
      toast.error(err.message || 'Failed to generate payslip.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayslip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payslip record?')) return;
    try {
      setLoading(true);
      await payslipApi.delete(id);
      toast.success('Payslip deleted successfully.');
      fetchPayslips();
    } catch (err) {
      toast.error('Failed to delete payslip.');
    } finally {
      setLoading(false);
    }
  };

  const calculatedNetPay = (Number(baseSalary) || 0) + (Number(allowance) || 0) - (Number(deductions) || 0);

  const columns = [
    {
      accessorKey: 'employee',
      header: 'Employee Name',
      cell: ({ row }) => {
        const emp = row.original.employee;
        return (
          <span className="font-semibold text-white">
            {emp?.user?.firstName} {emp?.user?.lastName}
          </span>
        );
      },
    },
    {
      accessorKey: 'month',
      header: 'Pay Month',
      cell: (info) => <span className="text-[var(--text-primary)] font-medium">{info.getValue()}</span>,
    },
    {
      accessorKey: 'baseSalary',
      header: 'Base Salary',
      cell: (info) => <span className="font-mono text-[var(--text-primary)]">${Number(info.getValue()).toLocaleString()}</span>,
    },
    {
      accessorKey: 'allowance',
      header: 'Allowance',
      cell: (info) => <span className="font-mono text-emerald-400">+${Number(info.getValue()).toLocaleString()}</span>,
    },
    {
      accessorKey: 'deductions',
      header: 'Deductions',
      cell: (info) => <span className="font-mono text-red-400">-${Number(info.getValue()).toLocaleString()}</span>,
    },
    {
      accessorKey: 'netPay',
      header: 'Net Pay',
      cell: (info) => <span className="font-black text-indigo-400 font-mono">${Number(info.getValue()).toLocaleString()}</span>,
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Actions</span>,
      cell: ({ row }) => {
        const payslip = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (onViewPayslip) {
                  onViewPayslip(payslip);
                } else {
                  setSelectedPayslip(payslip);
                }
              }}
              className="p-2 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center"
              title="View payslip invoice"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDeletePayslip(payslip.id)}
              className="p-2 text-xs bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-lg flex items-center justify-center"
              title="Delete record"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-[var(--border-base)]/80 pb-5">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">Payslips & Payroll</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Generate and monitor monthly payroll receipts for employees</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 text-xs py-2 px-4 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Generate Payslip
        </Button>
      </div>

      {/* Payslips Table */}
      <div className="bg-[var(--bg-card)]/40 border border-[var(--border-base)]/80 rounded-2xl p-6 shadow-xl">
        {loading && payslips.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] italic">Loading payslips history...</div>
        ) : (
          <Table data={payslips} columns={columns} searchPlaceholder="Search by month or name..." />
        )}
      </div>

      {/* Generate Payslip Drawer */}
      <Drawer isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Generate New Payslip">
        <form onSubmit={handleCreatePayslip} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Select Employee</label>
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required className="w-full text-xs">
              <option value="">-- Pick Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user?.firstName} {emp.user?.lastName} ({emp.designation || 'Staff'})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Pay Month</label>
              <Input type="text" value={month} onChange={(e) => setMonth(e.target.value)} required placeholder="July 2026" className="w-full text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Base Salary ($)</label>
              <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} required placeholder="5000" className="w-full text-xs font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Allowance ($)</label>
              <Input type="number" value={allowance} onChange={(e) => setAllowance(e.target.value)} placeholder="500" className="w-full text-xs font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Deductions ($)</label>
              <Input type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} placeholder="200" className="w-full text-xs font-mono text-red-400" />
            </div>
          </div>

          {/* Computed Net Pay Card */}
          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4 flex items-center justify-between mt-6">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Estimated Net Pay</span>
              <span className="text-2xl font-black text-white font-mono mt-0.5 block">${calculatedNetPay.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-base)]">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} className="text-xs font-semibold uppercase tracking-wider">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="text-xs font-bold uppercase tracking-wider bg-indigo-650 hover:bg-indigo-755 text-white py-2.5 px-6 rounded-xl">
              {loading ? 'Generating...' : 'Confirm Generate'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* View Payslip Receipt Modal */}
      <Modal isOpen={!!selectedPayslip} onClose={() => setSelectedPayslip(null)}>
        {selectedPayslip && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--border-base)] pb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payslip Invoice Receipt</h3>
              <div className="flex items-center gap-2">
                <Button onClick={() => handlePrint()} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold uppercase">
                  <Printer className="w-4 h-4" /> Print
                </Button>
                <Button variant="secondary" onClick={() => setSelectedPayslip(null)} className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Printable Area */}
            <div ref={printRef} className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-8 space-y-6 text-[var(--text-primary)] text-left font-sans">
              <div className="flex justify-between border-b border-[var(--border-base)] pb-6">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Task<span className="text-indigo-500">Tracky</span></h2>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1">Enterprise Payroll System</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-850 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{selectedPayslip.status}</span>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">Statement Month: <strong>{selectedPayslip.month}</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Employee Details</span>
                  <strong className="text-white block text-sm">{selectedPayslip.employee?.user?.firstName} {selectedPayslip.employee?.user?.lastName}</strong>
                  <p className="text-[var(--text-secondary)]">Designation: {selectedPayslip.employee?.designation || 'Staff'}</p>
                  <p className="text-[var(--text-secondary)]">Employee ID: {selectedPayslip.employee?.employeeNum}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Transaction Info</span>
                  <p className="text-[var(--text-secondary)]">Date: {new Date(selectedPayslip.createdAt).toLocaleDateString()}</p>
                  <p className="text-[var(--text-secondary)]">Reference: {selectedPayslip.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="border-t border-[var(--border-base)] pt-6 space-y-3.5">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Salary Breakdown</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Base Salary</span>
                    <span className="font-mono text-white">${selectedPayslip.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Allowances</span>
                    <span className="font-mono text-emerald-400">+${selectedPayslip.allowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)] border-b border-[var(--border-base)] pb-3">
                    <span>Deductions</span>
                    <span className="font-mono text-red-400">-${selectedPayslip.deductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2">
                    <span>Net Take-home Pay</span>
                    <span className="font-mono text-indigo-400">${selectedPayslip.netPay.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border-base)]/80 pt-6 text-center text-[10px] text-[var(--text-muted)]">
                This statement is electronically generated. For inquiries, contact human resources.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}




