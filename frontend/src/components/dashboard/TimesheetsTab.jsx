import React, { useState, useEffect } from 'react';
import { timesheetApi } from '../../services/timesheet.service';
import { useAuthStore } from '../../store/useAuthStore';
import { useEntitlements } from '../../contexts/EntitlementContext';
import { Calendar, FileText, CheckCircle, XCircle, Clock, Send, Eye, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TimesheetsTab() {
  const { user } = useAuthStore();
  const { canUse } = useEntitlements();
  const isEmployee = user?.role === 'EMPLOYEE';
  const isReviewer = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR'].includes(user?.role || '');

  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Submit Modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review Modal state
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timesheetApi.list();
      setTimesheets(res.data?.timesheets || res.timesheets || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTimesheet = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }

    setSubmitting(true);
    try {
      // API expects ISO strings
      const startIso = new Date(startDate).toISOString();
      const endIso = new Date(endDate).toISOString();
      await timesheetApi.submit(startIso, endIso);
      toast.success('Timesheet submitted successfully!');
      setShowSubmitModal(false);
      fetchTimesheets();
    } catch (err) {
      toast.error(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewTimesheet = async (status) => {
    if (!selectedTimesheet) return;

    setReviewing(true);
    try {
      await timesheetApi.review(selectedTimesheet.id, status, reviewComment);
      toast.success(`Timesheet ${status.toLowerCase()} successfully.`);
      setSelectedTimesheet(null);
      setReviewComment('');
      fetchTimesheets();
    } catch (err) {
      toast.error(err.message || 'Review execution failed.');
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge bg-success-subtle text-success border border-success/30 px-3 py-2 rounded-pill';
      case 'REJECTED': return 'badge bg-danger-subtle text-danger border border-danger/30 px-3 py-2 rounded-pill';
      default: return 'badge bg-warning-subtle text-warning border border-warning/30 px-3 py-2 rounded-pill';
    }
  };

  const formatHours = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // Helper to calculate total time in a timesheet
  const getTimesheetTotalMinutes = (ts) => {
    return ts.timeLogs?.reduce((sum, log) => sum + (log.minutes || 0), 0) || 0;
  };

  return (
    <div className="container-fluid p-4" style={{ color: 'var(--text-primary)' }}>
      {/* Header Panel */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0" style={{ letterSpacing: '-0.5px' }}>
            <Clock className="w-6 h-6 me-2 text-indigo-400 inline" />
            Timesheet & Hours Management
          </h4>
          <p className="text-muted text-[12px] m-0 mt-1">
            {isEmployee 
              ? 'Submit and track your weekly/monthly logged project time.' 
              : 'Review and approve staff timesheets and total logged hours.'
            }
          </p>
        </div>
        {isEmployee && (
          <button 
            className="btn btn-indigo d-flex align-items-center gap-2 rounded-xl text-[12px] px-3 py-2 shadow-sm"
            onClick={() => {
              // Pre-fill previous week
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 7);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
              setShowSubmitModal(true);
            }}
          >
            <Send className="w-4 h-4" />
            Submit New Timesheet
          </button>
        )}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="d-flex justify-content-center p-5">
          <div className="spinner-border text-indigo" role="status" />
        </div>
      ) : error ? (
        <div className="alert alert-danger border-danger/20 rounded-2xl d-flex align-items-center gap-2">
          <XCircle className="w-5 h-5 text-danger" />
          <span className="text-[12px]">{error}</span>
        </div>
      ) : timesheets.length === 0 ? (
        <div className="text-center p-5 border border-dashed rounded-3xl" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
          <FileText className="w-12 h-12 text-indigo-400/40 mb-3 mx-auto" />
          <p className="text-muted text-[13px]">No timesheets found.</p>
        </div>
      ) : (
        <div className="card border-subtle rounded-3xl overflow-hidden shadow-sm" style={{ background: 'var(--bg-card)' }}>
          <div className="table-responsive">
            <table className="table align-middle m-0 text-[12px]" style={{ color: 'var(--text-primary)' }}>
              <thead className="table-dark" style={{ background: 'var(--bg-canvas)' }}>
                <tr>
                  {!isEmployee && <th className="px-4 py-3">Employee</th>}
                  <th className="px-4 py-3">Reporting Period</th>
                  <th className="px-4 py-3 text-center">Logs Count</th>
                  <th className="px-4 py-3 text-end">Total Logged Time</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((ts) => (
                  <tr key={ts.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {!isEmployee && (
                      <td className="px-4 py-3 font-semibold">
                        {ts.employee?.user?.firstName} {ts.employee?.user?.lastName}
                        <span className="block text-[10px] text-muted">{ts.employee?.user?.email}</span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Calendar className="w-3.5 h-3.5 inline text-indigo-400 me-1.5 align-middle" />
                      {new Date(ts.startDate).toLocaleDateString()} - {new Date(ts.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">{ts.timeLogs?.length || 0} tasks logged</td>
                    <td className="px-4 py-3 text-end fw-bold text-indigo-400">
                      {formatHours(getTimesheetTotalMinutes(ts))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={getStatusBadgeClass(ts.status)}>
                        {ts.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        className="btn btn-sm btn-dark border-subtle rounded-lg px-2.5 py-1 text-[11px]"
                        onClick={() => setSelectedTimesheet(ts)}
                      >
                        <Eye className="w-3.5 h-3.5 me-1 inline align-middle" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Timesheet Modal */}
      {showSubmitModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-subtle rounded-3xl" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              <div className="modal-header border-subtle px-4">
                <h5 className="modal-title fw-bold">Submit Weekly/Monthly Hours</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSubmitModal(false)} />
              </div>
              <form onSubmit={handleSubmitTimesheet}>
                <div className="modal-body p-4 space-y-4">
                  <div>
                    <label className="form-label text-[11px] uppercase tracking-wider text-muted">Start Date</label>
                    <input 
                      type="date" 
                      className="form-control rounded-xl text-[12px]" 
                      style={{ background: 'var(--bg-canvas)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label text-[11px] uppercase tracking-wider text-muted">End Date</label>
                    <input 
                      type="date" 
                      className="form-control rounded-xl text-[12px]" 
                      style={{ background: 'var(--bg-canvas)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="alert bg-indigo-500/10 text-indigo-300 text-[11px] rounded-xl border border-indigo-500/20">
                    Submission links all unsubmitted task logs inside the specified start and end date range to this timesheet.
                  </div>
                </div>
                <div className="modal-footer border-subtle px-4">
                  <button type="button" className="btn btn-sm btn-dark rounded-xl text-[11px]" onClick={() => setShowSubmitModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-indigo rounded-xl text-[11px] px-3" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit to Manager'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Inspect/Review Modal */}
      {selectedTimesheet && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-subtle rounded-3xl" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              <div className="modal-header border-subtle px-4">
                <h5 className="modal-title fw-bold">Timesheet details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTimesheet(null)} />
              </div>
              <div className="modal-body p-4">
                {/* Meta details */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <span className="block text-[10px] text-muted uppercase tracking-wider">Employee</span>
                    <span className="fw-semibold text-[13px]">
                      {selectedTimesheet.employee?.user?.firstName} {selectedTimesheet.employee?.user?.lastName}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <span className="block text-[10px] text-muted uppercase tracking-wider">Reporting Period</span>
                    <span className="fw-semibold text-[13px]">
                      {new Date(selectedTimesheet.startDate).toLocaleDateString()} - {new Date(selectedTimesheet.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <span className="block text-[10px] text-muted uppercase tracking-wider">Status</span>
                    <span className={`fw-semibold text-[13px] ${getStatusBadgeClass(selectedTimesheet.status)}`}>
                      {selectedTimesheet.status}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <span className="block text-[10px] text-muted uppercase tracking-wider">Total Time</span>
                    <span className="fw-bold text-[13px] text-indigo-400">
                      {formatHours(getTimesheetTotalMinutes(selectedTimesheet))}
                    </span>
                  </div>
                </div>

                {/* Logs List */}
                <h6 className="fw-bold text-[11px] uppercase text-muted mb-2.5">Associated Tasks & Time Logs</h6>
                {selectedTimesheet.timeLogs?.length === 0 ? (
                  <p className="text-muted text-center text-[12px] py-3">No logs associated.</p>
                ) : (
                  <div className="border border-subtle rounded-2xl overflow-hidden mb-4 max-h-60 overflow-y-auto">
                    <table className="table align-middle m-0 text-[11px]" style={{ color: 'var(--text-primary)' }}>
                      <thead style={{ background: 'var(--bg-canvas)' }}>
                        <tr>
                          <th className="px-3 py-2">Project</th>
                          <th className="px-3 py-2">Task</th>
                          <th className="px-3 py-2 text-end">Duration</th>
                          <th className="px-3 py-2">Logged On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTimesheet.timeLogs.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td className="px-3 py-2 text-muted">{log.task?.project?.name}</td>
                            <td className="px-3 py-2 fw-semibold">{log.task?.title}</td>
                            <td className="px-3 py-2 text-end text-indigo-400 fw-bold">{formatHours(log.minutes)}</td>
                            <td className="px-3 py-2 text-muted">{new Date(log.loggedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Review logs / Comment history */}
                {selectedTimesheet.comments && (
                  <div className="p-3 bg-dark-subtle/20 border border-subtle rounded-2xl mb-4 text-[12px]">
                    <span className="fw-semibold block text-indigo-400">Review Notes:</span>
                    <p className="m-0 mt-1 italic text-muted">"{selectedTimesheet.comments}"</p>
                  </div>
                )}

                {/* Approver inputs */}
                {isReviewer && selectedTimesheet.status === 'PENDING' && (
                  <div className="space-y-3 mt-4 border-t border-subtle pt-4">
                    <div>
                      <label className="form-label text-[11px] uppercase tracking-wider text-muted">Review Notes / Comments</label>
                      <textarea
                        className="form-control rounded-xl text-[12px]"
                        style={{ background: 'var(--bg-canvas)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                        rows="3"
                        placeholder="Add review feedback..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>
                    <div className="d-flex gap-2 justify-content-end">
                      <button 
                        className="btn btn-sm btn-danger d-flex align-items-center gap-1.5 rounded-xl text-[11px] px-3 py-2"
                        onClick={() => handleReviewTimesheet('REJECTED')}
                        disabled={reviewing}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Timesheet
                      </button>
                      <button 
                        className="btn btn-sm btn-success d-flex align-items-center gap-1.5 rounded-xl text-[11px] px-3 py-2"
                        onClick={() => handleReviewTimesheet('APPROVED')}
                        disabled={reviewing}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Timesheet
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-subtle px-4">
                <button type="button" className="btn btn-sm btn-dark rounded-xl text-[11px]" onClick={() => setSelectedTimesheet(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
