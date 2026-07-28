import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { hrmLifecycleService } from '../../services/hrmLifecycle.service';
import { UserMinus, CheckSquare, FileText, ExternalLink, ShieldCheck } from 'lucide-react';

export default function OffboardingTab({ companyId, employees = [] }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInitiateModal, setShowInitiateModal] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    resignationDate: new Date().toISOString().split('T')[0],
    lastWorkingDay: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    noticePeriodDays: 30,
    reason: '',
  });

  useEffect(() => {
    if (companyId) {
      loadRecords();
    }
  }, [companyId]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await hrmLifecycleService.getOffboardingRecords(companyId);
      if (res?.data?.records) {
        setRecords(res.data.records);
      }
    } catch (err) {
      toast.error('Failed to load offboarding records');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async (e) => {
    e.preventDefault();
    try {
      await hrmLifecycleService.initiateOffboarding({
        ...formData,
        companyId,
        noticePeriodDays: Number(formData.noticePeriodDays),
      });
      toast.success('Employee offboarding process initiated!');
      setShowInitiateModal(false);
      loadRecords();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to initiate offboarding');
    }
  };

  const handleToggleClearance = async (recordId, type, currentValue) => {
    try {
      const payload = { [type]: !currentValue };
      await hrmLifecycleService.updateClearance(recordId, payload);
      toast.success('Clearance status updated');
      loadRecords();
    } catch (err) {
      toast.error('Failed to update clearance');
    }
  };

  const handleCompleteOffboarding = async (recordId) => {
    try {
      await hrmLifecycleService.completeOffboarding(recordId);
      toast.success('Employee offboarded & account deactivated');
      loadRecords();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to complete offboarding');
    }
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', borderRadius: '16px', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <UserMinus size={24} color="#ef4444" /> Offboarding & Relieving Letters
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Manage employee exit clearances, IT/HR/Finance sign-offs, and generate Relieving & Experience Certificates.
          </p>
        </div>
        <button
          onClick={() => setShowInitiateModal(true)}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          + Initiate Resignation / Exit
        </button>
      </div>

      {/* Offboarding Records Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading offboarding records...</div>
      ) : records.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#1e293b', borderRadius: '12px', color: '#94a3b8' }}>
          No offboarding records found. Click "+ Initiate Resignation / Exit" to start an employee exit process.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#334155', color: '#cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Employee</th>
                <th style={{ padding: '12px 16px' }}>Resignation / Last Day</th>
                <th style={{ padding: '12px 16px' }}>Clearance Sign-offs</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => {
                const empUser = rec.employee?.user;
                return (
                  <tr key={rec.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>
                        {empUser ? `${empUser.firstName} ${empUser.lastName}` : 'Employee'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{rec.employee?.employeeNum}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#e2e8f0' }}>Last Day: {new Date(rec.lastWorkingDay).toLocaleDateString()}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Resigned: {new Date(rec.resignationDate).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleToggleClearance(rec.id, 'itClearance', rec.itClearance)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px solid #334155',
                            background: rec.itClearance ? '#059669' : '#0f172a',
                            color: rec.itClearance ? '#fff' : '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          IT Asset {rec.itClearance ? '✓' : '✗'}
                        </button>
                        <button
                          onClick={() => handleToggleClearance(rec.id, 'hrClearance', rec.hrClearance)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px solid #334155',
                            background: rec.hrClearance ? '#059669' : '#0f172a',
                            color: rec.hrClearance ? '#fff' : '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          HR Exit {rec.hrClearance ? '✓' : '✗'}
                        </button>
                        <button
                          onClick={() => handleToggleClearance(rec.id, 'financeClearance', rec.financeClearance)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px solid #334155',
                            background: rec.financeClearance ? '#059669' : '#0f172a',
                            color: rec.financeClearance ? '#fff' : '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          Finance {rec.financeClearance ? '✓' : '✗'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: rec.status === 'COMPLETED' ? '#4f46e5' : rec.status === 'APPROVED' ? '#059669' : '#d97706',
                        color: '#fff'
                      }}>
                        {rec.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <a
                          href={`http://localhost:5000/api/v1/offboarding/${rec.id}/relieving-letter`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ background: '#0284c7', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ExternalLink size={14} /> Relieving Letter
                        </a>

                        <a
                          href={`http://localhost:5000/api/v1/offboarding/${rec.id}/experience-letter`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ background: '#4f46e5', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FileText size={14} /> Experience Letter
                        </a>

                        {rec.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteOffboarding(rec.id)}
                            style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Finalize Exit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Initiate Exit Modal */}
      {showInitiateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '480px', padding: '28px', borderRadius: '16px', border: '1px solid #334155', color: '#fff' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Initiate Resignation & Offboarding</h3>
            <form onSubmit={handleInitiate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Select Employee</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                >
                  <option value="">Choose Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.firstName} {emp.user?.lastName} ({emp.employeeNum})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Resignation Date</label>
                  <input
                    required
                    type="date"
                    value={formData.resignationDate}
                    onChange={(e) => setFormData({ ...formData, resignationDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Last Working Day</label>
                  <input
                    required
                    type="date"
                    value={formData.lastWorkingDay}
                    onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Exit Reason / Remarks</label>
                <textarea
                  rows="3"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Career growth, relocation, personal reasons..."
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  style={{ padding: '10px 18px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Start Offboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
