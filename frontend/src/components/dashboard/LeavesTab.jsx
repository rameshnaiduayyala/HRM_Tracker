import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Check, X, Clock, AlertCircle, Trash2, Shield, CalendarDays, Award, BookOpen, CheckCircle, Edit3 } from 'lucide-react';
import { leaveApi } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function LeavesTab({ companyId, employees = [], employeeId }) {
  const { user } = useAuthStore();
  
  // Find current user's employee record
  const currentUserEmployee = employees.find((e) => e.userId === user?.id);

  const [activeTab, setActiveTab] = useState('requests'); // requests, policies, holidays, balances
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [balances, setBalances] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(null); // { id, status }
  const [reviewNote, setReviewNote] = useState('');

  // Editing states
  const [editingType, setEditingType] = useState(null);

  const [reqForm, setReqForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [typeForm, setTypeForm] = useState({
    name: '',
    allowedDays: 12,
    isPaid: true,
  });

  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
  });

  // Automatically set employeeId when currentUserEmployee loads
  useEffect(() => {
    if (currentUserEmployee) {
      setReqForm((f) => ({ ...f, employeeId: currentUserEmployee.id }));
    }
  }, [currentUserEmployee]);

  useEffect(() => {
    if (companyId) {
      fetchLeaveData();
    }
  }, [companyId]);

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      const [reqRes, typeRes, holRes] = await Promise.all([
        leaveApi.listRequests({ companyId, employeeId }),
        leaveApi.listTypes(companyId),
        leaveApi.listHolidays(companyId),
      ]);
      setRequests(reqRes.data?.requests || reqRes.requests || []);
      setLeaveTypes(typeRes.data?.leaveTypes || typeRes.leaveTypes || []);
      setHolidays(holRes.data?.holidays || holRes.holidays || []);

      // If we have employees, fetch balances for the first employee
      if (employees.length > 0) {
        fetchEmployeeBalances(employees[0].id);
      }
    } catch (err) {
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeBalances = async (empId) => {
    try {
      const res = await leaveApi.listBalances(empId);
      setBalances(res.data?.balances || res.balances || []);
    } catch {
      // ignore
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (new Date(reqForm.startDate) > new Date(reqForm.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }
    try {
      await leaveApi.createRequest({
        ...reqForm,
        startDate: new Date(reqForm.startDate).toISOString(),
        endDate: new Date(reqForm.endDate).toISOString(),
      });
      toast.success('Leave request submitted!');
      setShowRequestModal(false);
      fetchLeaveData();
    } catch (err) {
      toast.error(err.message || 'Failed to create leave request');
    }
  };

  const handleCreateOrUpdateType = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await leaveApi.updateType(editingType.id, {
          name: typeForm.name,
          allowedDays: Number(typeForm.allowedDays),
          isPaid: typeForm.isPaid,
        });
        toast.success('Leave policy updated!');
      } else {
        await leaveApi.createType({
          name: typeForm.name,
          companyId,
          allowedDays: Number(typeForm.allowedDays),
          isPaid: typeForm.isPaid,
        });
        toast.success('Leave policy type added!');
      }
      setShowTypeModal(false);
      setEditingType(null);
      fetchLeaveData();
    } catch (err) {
      toast.error(err.message || 'Failed to save leave type');
    }
  };

  const openEditType = (type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      allowedDays: type.allowedDays,
      isPaid: type.isPaid,
    });
    setShowTypeModal(true);
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm('Delete this leave type policy?')) return;
    try {
      await leaveApi.deleteType(id, companyId);
      toast.success('Leave type removed');
      fetchLeaveData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete leave type');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!showReviewModal) return;
    try {
      await leaveApi.reviewRequest(showReviewModal.id, {
        status: showReviewModal.status,
        reviewNote: reviewNote || undefined,
      });
      toast.success(`Leave request ${showReviewModal.status.toLowerCase()}!`);
      setShowReviewModal(null);
      setReviewNote('');
      fetchLeaveData();
    } catch (err) {
      toast.error(err.message || 'Failed to update leave status');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Delete this leave request?')) return;
    try {
      await leaveApi.deleteRequest(id, companyId);
      toast.success('Leave request deleted');
      fetchLeaveData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete leave request');
    }
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    try {
      await leaveApi.createHoliday({
        name: holidayForm.name,
        date: new Date(holidayForm.date).toISOString(),
        companyId,
      });
      toast.success('Public holiday registered!');
      setShowHolidayModal(false);
      setHolidayForm({ name: '', date: '' });
      fetchLeaveData();
    } catch (err) {
      toast.error(err.message || 'Failed to add public holiday');
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Delete this public holiday?')) return;
    try {
      await leaveApi.deleteHoliday(id, companyId);
      toast.success('Holiday deleted');
      fetchLeaveData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete holiday');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Leave Management & Policies</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage employee leave balances, approval workflows, and time-off types</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingType(null);
              setTypeForm({ name: '', allowedDays: 12, isPaid: true });
              setShowTypeModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl transition border border-[var(--border-muted)]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Policy Type
          </button>
          <button
            onClick={() => setShowHolidayModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl transition border border-[var(--border-muted)]"
          >
            <CalendarDays className="w-3.5 h-3.5" /> Add Holiday
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Apply Leave
          </button>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-[var(--border-base)] gap-4">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'requests' ? 'border-indigo-500 text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Applications ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'policies' ? 'border-indigo-500 text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Leave Policies ({leaveTypes.length})
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'holidays' ? 'border-indigo-500 text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Public Holidays ({holidays.length})
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'balances' ? 'border-indigo-500 text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Accruals & Balances
        </button>
      </div>

      {/* Tab: Requests */}
      {activeTab === 'requests' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl overflow-hidden shadow-lg">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-xs">Loading leave requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-muted)] text-xs">No leave applications recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--text-primary)]">
                <thead className="bg-[var(--bg-card-alt)] text-[var(--text-secondary)] uppercase font-semibold text-[10px] tracking-wider border-b border-[var(--border-base)]">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Leave Type</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Review Notes</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {requests.map((req) => {
                    const empUser = req.employee?.user;
                    const empName = empUser
                      ? `${empUser.firstName} ${empUser.lastName}`
                      : employees.find((e) => e.id === req.employeeId)?.user
                        ? `${employees.find((e) => e.id === req.employeeId).user.firstName} ${employees.find((e) => e.id === req.employeeId).user.lastName}`
                        : 'Unknown Staff';
                    const lt = req.leaveType || leaveTypes.find((t) => t.id === req.leaveTypeId);
                    return (
                      <tr key={req.id} className="hover:bg-[var(--bg-card-alt)]/40 transition">
                        <td className="px-6 py-4 font-medium text-white">{empName}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[var(--text-primary)]">{lt?.name || 'Leave'}</span>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                          {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-[var(--text-secondary)] max-w-xs truncate">{req.reason || 'N/A'}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)] italic max-w-xs truncate">{req.reviewNote || '—'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30'
                                : req.status === 'REJECTED'
                                ? 'bg-red-950 text-red-400 border border-red-800/30'
                                : 'bg-amber-950 text-amber-400 border border-amber-800/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {req.status === 'PENDING' && req.employeeId !== currentUserEmployee?.id && (
                            <>
                              <button
                                onClick={() => setShowReviewModal({ id: req.id, status: 'APPROVED' })}
                                className="p-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded-lg border border-emerald-800/40 transition"
                                title="Approve with note"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setShowReviewModal({ id: req.id, status: 'REJECTED' })}
                                className="p-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg border border-red-800/40 transition"
                                title="Reject with note"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 bg-gray-800 hover:bg-red-950 text-[var(--text-muted)] hover:text-red-400 rounded-lg border border-[var(--border-muted)] hover:border-red-800/40 transition"
                            title="Delete request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Policies */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {leaveTypes.map((lt) => (
            <div key={lt.id} className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-5 flex flex-col justify-between group relative shadow-md">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => openEditType(lt)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white"
                  title="Edit policy"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteType(lt.id)}
                  className="p-1.5 rounded-lg hover:bg-red-950 text-[var(--text-secondary)] hover:text-red-400"
                  title="Delete policy"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Policy Model</span>
                <h4 className="text-base font-bold text-white mt-1">{lt.name}</h4>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-[var(--text-muted)]" />
                  <strong>{lt.allowedDays} days</strong> / year
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${lt.isPaid ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30' : 'bg-gray-800 text-[var(--text-secondary)]'}`}>
                  {lt.isPaid ? 'PAID LEAVE' : 'UNPAID LEAVE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Holidays */}
      {activeTab === 'holidays' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-base)]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Corporate Standard Holidays</h3>
          </div>
          {holidays.length === 0 ? (
            <p className="p-8 text-center text-[var(--text-muted)] text-xs">No standard public holidays registered yet.</p>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {holidays.map((h) => (
                <div key={h.id} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-card-alt)]/30 transition">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{h.name}</h4>
                      <p className="text-xs text-[var(--text-muted)]">{new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="p-2 bg-gray-800 hover:bg-red-950/40 text-[var(--text-secondary)] hover:text-red-400 rounded-xl transition border border-[var(--border-muted)] hover:border-red-950"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Balances */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Employee Accrual Ledger</h3>
                <p className="text-xs text-[var(--text-muted)]">Select employee to display current available leave balances</p>
              </div>
            </div>
            <select
              onChange={(e) => fetchEmployeeBalances(e.target.value)}
              className="px-3 py-1.5 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-xs rounded-xl focus:outline-none"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.user?.firstName || emp.firstName} {emp.user?.lastName || emp.lastName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {balances.length === 0 ? (
              <div className="md:col-span-3 py-12 text-center text-[var(--text-muted)] text-xs">No active leave type balances tracked for this employee.</div>
            ) : (
              balances.map((bal) => (
                <div key={bal.id} className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">{bal.leaveType?.name || 'Balance'}</span>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">{bal.remainingDays}</span>
                    <span className="text-xs text-[var(--text-muted)]">days available</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[var(--border-base)]/60 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Used: {bal.usedDays} days</span>
                    <span>Allowed: {bal.allowedDays} days</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Policy Type */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-white">{editingType ? 'Edit Leave Policy' : 'Create Leave Policy Type'}</h3>
              <button onClick={() => setShowTypeModal(false)} className="text-[var(--text-secondary)] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateOrUpdateType} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Leave Policy Name</label>
                <input
                  required
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  placeholder="e.g. Annual Vacation"
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Allocated Days / Year</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={typeForm.allowedDays}
                  onChange={(e) => setTypeForm({ ...typeForm, allowedDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="paidCheck"
                  checked={typeForm.isPaid}
                  onChange={(e) => setTypeForm({ ...typeForm, isPaid: e.target.checked })}
                  className="rounded border-[var(--border-muted)] text-indigo-600 bg-[var(--bg-card-alt)]"
                />
                <label htmlFor="paidCheck" className="text-xs text-[var(--text-primary)]">Paid Leave Type</label>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowTypeModal(false)} className="flex-1 py-2 border border-[var(--border-muted)] text-[var(--text-primary)] text-sm rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg font-bold">Save Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Apply Leave Request */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-white">Apply Leave Application</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-[var(--text-secondary)] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Leave Applicant</label>
                {currentUserEmployee ? (
                  <input
                    type="text"
                    readOnly
                    value={`${user.firstName} ${user.lastName}`}
                    className="w-full px-3 py-2 bg-gray-800 border border-[var(--border-muted)] text-[var(--text-secondary)] text-sm rounded-lg cursor-not-allowed"
                  />
                ) : (
                  <select
                    required
                    value={reqForm.employeeId}
                    onChange={(e) => setReqForm({ ...reqForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                  >
                    <option value="">Select Staff Member</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.user?.firstName || emp.firstName} {emp.user?.lastName || emp.lastName}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Leave Policy Category</label>
                <select
                  required
                  value={reqForm.leaveTypeId}
                  onChange={(e) => setReqForm({ ...reqForm, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                >
                  <option value="">Select Leave Category</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Start Date</label>
                  <input
                    type="date"
                    required
                    value={reqForm.startDate}
                    onChange={(e) => setReqForm({ ...reqForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">End Date</label>
                  <input
                    type="date"
                    required
                    value={reqForm.endDate}
                    onChange={(e) => setReqForm({ ...reqForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Reason</label>
                <textarea
                  rows={3}
                  value={reqForm.reason}
                  onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                  placeholder="Provide details..."
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg resize-none"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-2 border border-[var(--border-muted)] text-[var(--text-primary)] text-sm rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg font-bold">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review Dialog */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Review Leave Application</h3>
              <button onClick={() => setShowReviewModal(null)} className="text-[var(--text-secondary)] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Review Note / Decision Reason</label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Optional review reason (e.g., covered by team members)..."
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg resize-none focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(null)}
                  className="flex-1 py-2 border border-[var(--border-muted)] text-[var(--text-primary)] text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-white text-xs font-bold rounded-lg ${
                    showReviewModal.status === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {showReviewModal.status}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Public Holiday */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Register Corporate Holiday</h3>
              <button onClick={() => setShowHolidayModal(false)} className="text-[var(--text-secondary)] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Holiday Name</label>
                <input
                  required
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  placeholder="e.g. New Year's Day"
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Date</label>
                <input
                  type="date"
                  required
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowHolidayModal(false)} className="flex-1 py-2 border border-[var(--border-muted)] text-[var(--text-primary)] text-xs rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




