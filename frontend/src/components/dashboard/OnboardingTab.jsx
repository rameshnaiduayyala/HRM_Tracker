import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { hrmLifecycleService } from '../../services/hrmLifecycle.service';
import { UserPlus, CheckCircle, Clock, ExternalLink, Send, ArrowRight } from 'lucide-react';

export default function OnboardingTab({ companyId, departments = [], employees = [], onEmployeeConverted }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [selectedCandidateForJoining, setSelectedCandidateForJoining] = useState(null);
  const [convertingId, setConvertingId] = useState(null);
  const [joiningForm, setJoiningForm] = useState({
    employeeNum: '',
    designation: '',
    joiningDate: '',
    roleName: 'EMPLOYEE',
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    departmentId: '',
    ctc: 600000,
    expectedJoiningDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  useEffect(() => {
    if (companyId) {
      loadCandidates();
    }
  }, [companyId]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const res = await hrmLifecycleService.getCandidates(companyId);
      if (res?.data?.candidates) {
        setCandidates(res.data.candidates);
      }
    } catch (err) {
      toast.error('Failed to load candidate onboarding records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    try {
      await hrmLifecycleService.createCandidate({
        ...formData,
        companyId,
        ctc: Number(formData.ctc),
        departmentId: formData.departmentId || undefined,
      });
      toast.success('Candidate created & Offer Letter token generated!');
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: '',
        departmentId: '',
        ctc: 600000,
        expectedJoiningDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      });
      loadCandidates();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create candidate');
    }
  };

  const handleConvert = async (candidateId) => {
    try {
      setConvertingId(candidateId);
      const res = await hrmLifecycleService.convertToEmployee(candidateId);
      toast.success('Candidate successfully converted to Active Employee!');
      loadCandidates();
      if (onEmployeeConverted) onEmployeeConverted();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to convert candidate to employee');
    } finally {
      setConvertingId(null);
    }
  };

  const activeOnboardingCandidates = candidates.filter(c => c.offerStatus !== 'JOINED');

  const openJoiningModal = (cand) => {
    setSelectedCandidateForJoining(cand);
    setJoiningForm({
      employeeNum: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      designation: cand.designation || '',
      joiningDate: cand.expectedJoiningDate ? new Date(cand.expectedJoiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      managerId: '',
      roleName: 'EMPLOYEE',
    });
    setShowJoiningModal(true);
  };

  const handleConfirmJoining = async (e) => {
    e.preventDefault();
    if (!selectedCandidateForJoining) return;
    try {
      setConvertingId(selectedCandidateForJoining.id);
      await hrmLifecycleService.convertToEmployee(selectedCandidateForJoining.id, joiningForm);
      toast.success('Candidate successfully joined & added to Staff Directory!');
      setShowJoiningModal(false);
      setSelectedCandidateForJoining(null);
      loadCandidates();
      if (onEmployeeConverted) onEmployeeConverted();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to complete joining setup');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', borderRadius: '16px', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <UserPlus size={24} color="#6366f1" /> Candidate Onboarding & Offers
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Issue offer letters, track candidate acceptance, and fill official joining details to add candidates to staff.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#6366f1',
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
          + Add New Candidate
        </button>
      </div>

      {/* Candidates List Table (Excludes Joined Candidates) */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading candidates...</div>
      ) : activeOnboardingCandidates.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#1e293b', borderRadius: '12px', color: '#94a3b8' }}>
          No active onboarding candidates. Click "+ Add New Candidate" to send an employment offer.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#334155', color: '#cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Candidate Name</th>
                <th style={{ padding: '12px 16px' }}>Designation / Dept</th>
                <th style={{ padding: '12px 16px' }}>CTC & Joining</th>
                <th style={{ padding: '12px 16px' }}>Offer Status</th>
                <th style={{ padding: '12px 16px' }}>Onboarding Tasks</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeOnboardingCandidates.map((cand) => {
                const completedCount = cand.onboardingTasks?.filter(t => t.status === 'COMPLETED').length || 0;
                const totalTasks = cand.onboardingTasks?.length || 0;

                return (
                  <tr key={cand.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{cand.firstName} {cand.lastName}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{cand.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#e2e8f0' }}>{cand.designation}</div>
                      <div style={{ fontSize: '12px', color: '#818cf8' }}>{cand.department?.name || 'General'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#34d399', fontWeight: '600' }}>₹{cand.ctc.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(cand.expectedJoiningDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: cand.offerStatus === 'ACCEPTED' ? '#059669' : cand.offerStatus === 'JOINED' ? '#4f46e5' : cand.offerStatus === 'REJECTED' ? '#dc2626' : '#d97706',
                        color: '#fff'
                      }}>
                        {cand.offerStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{completedCount} / {totalTasks} Done</div>
                      <div style={{ width: '100px', height: '6px', background: '#0f172a', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${totalTasks > 0 ? (completedCount/totalTasks)*100 : 0}%`, height: '100%', background: '#10b981' }}></div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <a
                          href={`http://localhost:5000/api/v1/candidates/${cand.id}/offer-letter`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ExternalLink size={14} /> Offer Letter
                        </a>

                        <a
                          href={`/candidate-portal/${cand.offerToken}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ background: '#0284c7', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Portal Link
                        </a>

                        {cand.offerStatus === 'ACCEPTED' && (
                          <button
                            disabled={convertingId === cand.id}
                            onClick={() => openJoiningModal(cand)}
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <ArrowRight size={14} /> Fill Joining Details & Join Staff
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

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '500px', padding: '28px', borderRadius: '16px', border: '1px solid #334155', color: '#fff' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Create Candidate & Issue Offer</h3>
            <form onSubmit={handleCreateCandidate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>First Name</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Last Name</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Designation</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Annual CTC (₹)</label>
                  <input
                    required
                    type="number"
                    value={formData.ctc}
                    onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Joining Date</label>
                  <input
                    required
                    type="date"
                    value={formData.expectedJoiningDate}
                    onChange={(e) => setFormData({ ...formData, expectedJoiningDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 18px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Generate Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Candidate Joining Details Modal */}
      {showJoiningModal && selectedCandidateForJoining && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '520px', padding: '28px', borderRadius: '16px', border: '1px solid #334155', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} /> Official Joining & Employee Provisioning
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#94a3b8' }}>
              Candidate <strong>{selectedCandidateForJoining.firstName} {selectedCandidateForJoining.lastName}</strong> accepted the offer. Fill official joining fields to create their staff profile.
            </p>

            <form onSubmit={handleConfirmJoining} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Official Employee ID</label>
                  <input
                    required
                    type="text"
                    value={joiningForm.employeeNum}
                    onChange={(e) => setJoiningForm({ ...joiningForm, employeeNum: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Official Role Assignment</label>
                  <select
                    value={joiningForm.roleName}
                    onChange={(e) => setJoiningForm({ ...joiningForm, roleName: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  >
                    <option value="EMPLOYEE">Standard Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR">HR Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Official Designation Title</label>
                <input
                  required
                  type="text"
                  value={joiningForm.designation}
                  onChange={(e) => setJoiningForm({ ...joiningForm, designation: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Actual Date of Joining</label>
                  <input
                    required
                    type="date"
                    value={joiningForm.joiningDate}
                    onChange={(e) => setJoiningForm({ ...joiningForm, joiningDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Reporting Manager</label>
                  <select
                    value={joiningForm.managerId}
                    onChange={(e) => setJoiningForm({ ...joiningForm, managerId: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginTop: '4px' }}
                  >
                    <option value="">No Direct Manager</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.firstName} {emp.user?.lastName} ({emp.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowJoiningModal(false)}
                  style={{ padding: '10px 18px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertingId === selectedCandidateForJoining.id}
                  style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {convertingId === selectedCandidateForJoining.id ? 'Joining Employee...' : 'Confirm Joining & Provision Staff Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
