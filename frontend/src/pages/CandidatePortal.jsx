import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { hrmLifecycleService } from '../services/hrmLifecycle.service';

export function CandidatePortal() {
  const { token } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  useEffect(() => {
    fetchCandidateOffer();
  }, [token]);

  const fetchCandidateOffer = async () => {
    try {
      setLoading(true);
      const res = await hrmLifecycleService.getOfferByToken(token);
      if (res?.data?.candidate) {
        setCandidate(res.data.candidate);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load offer details');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action) => {
    try {
      setResponding(true);
      const res = await hrmLifecycleService.respondToOffer(token, action);
      if (res?.data?.candidate) {
        setCandidate(res.data.candidate);
        toast.success(`Offer successfully ${action === 'ACCEPT' ? 'Accepted' : 'Declined'}!`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit response');
    } finally {
      setResponding(false);
    }
  };

  const handleTaskToggle = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await hrmLifecycleService.updateOnboardingTask(taskId, newStatus);
      toast.success('Task status updated');
      fetchCandidateOffer();
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#fff' }}>
        <div style={{ fontSize: '18px' }}>Loading Employment Offer Portal...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#ef4444' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: '#1e293b', borderRadius: '12px' }}>
          <h2>Invalid or Expired Offer Token</h2>
          <p style={{ color: '#94a3b8' }}>Please verify your offer link or contact Human Resources.</p>
        </div>
      </div>
    );
  }

  const annualBasic = candidate.ctc * 0.5;
  const monthlyBasic = Math.round(annualBasic / 12);
  const annualHRA = candidate.ctc * 0.2;
  const monthlyHRA = Math.round(annualHRA / 12);
  const annualSpecial = candidate.ctc * 0.3;
  const monthlySpecial = Math.round(annualSpecial / 12);

  const completedTasks = candidate.onboardingTasks?.filter(t => t.status === 'COMPLETED').length || 0;
  const totalTasks = candidate.onboardingTasks?.length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '40px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Company Header */}
        <div style={{ background: '#1e293b', padding: '24px 32px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#818cf8', fontWeight: 'bold' }}>Career Portal</span>
            <h1 style={{ margin: '4px 0 0 0', fontSize: '24px', color: '#fff' }}>{candidate.company?.name || 'Enterprise Workspace'}</h1>
          </div>
          <div>
            <span style={{ 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '13px', 
              fontWeight: '600',
              background: candidate.offerStatus === 'ACCEPTED' ? '#059669' : candidate.offerStatus === 'REJECTED' ? '#dc2626' : '#d97706',
              color: '#fff'
            }}>
              Status: {candidate.offerStatus}
            </span>
          </div>
        </div>

        {/* Offer Summary Card */}
        <div style={{ background: '#1e293b', padding: '32px', borderRadius: '16px', border: '1px solid #334155', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#a5b4fc' }}>Congratulations, {candidate.firstName}!</h2>
          <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
            We are excited to present you with this official employment offer for the position of <strong style={{ color: '#818cf8' }}>{candidate.designation}</strong> in our <strong>{candidate.department?.name || 'Engineering'}</strong> department.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '24px 0' }}>
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Annual CTC</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}>₹{candidate.ctc.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Joining Date</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginTop: '6px' }}>
                {new Date(candidate.expectedJoiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Offer Ref / Token</div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#a5b4fc', marginTop: '8px', wordBreak: 'break-all' }}>{candidate.offerToken.substring(0, 13)}...</div>
            </div>
          </div>

          {/* Salary Breakdown Table */}
          <h3 style={{ fontSize: '16px', marginTop: '28px', color: '#e2e8f0' }}>Salary & Allowance Breakdown</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#0f172a', textAlign: 'left' }}>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155', color: '#94a3b8' }}>Salary Head</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155', color: '#94a3b8' }}>Monthly</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155', color: '#94a3b8' }}>Annual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #334155' }}>Basic Salary (50%)</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #334155' }}>₹{monthlyBasic.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #334155' }}>₹{Math.round(annualBasic).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #334155' }}>House Rent Allowance (HRA 20%)</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #334155' }}>₹{monthlyHRA.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #334155' }}>₹{Math.round(annualHRA).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #334155' }}>Special Allowance (30%)</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #334155' }}>₹{monthlySpecial.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #334155' }}>₹{Math.round(annualSpecial).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', flexWrap: 'wrap' }}>
            <a 
              href={`http://localhost:5000/api/v1/candidates/${candidate.id}/offer-letter`} 
              target="_blank" 
              rel="noreferrer"
              style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', display: 'inline-block' }}
            >
              📄 View & Print Official Offer Letter
            </a>

            {candidate.offerStatus === 'OFFER_SENT' && (
              <>
                <button
                  disabled={responding}
                  onClick={() => handleResponse('ACCEPT')}
                  style={{ padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {responding ? 'Submitting...' : '✓ Accept Offer'}
                </button>
                <button
                  disabled={responding}
                  onClick={() => handleResponse('REJECT')}
                  style={{ padding: '12px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Declining Offer
                </button>
              </>
            )}
          </div>
        </div>

        {/* Onboarding Tasks Progress */}
        {(candidate.offerStatus === 'ACCEPTED' || candidate.offerStatus === 'JOINED') && (
          <div style={{ background: '#1e293b', padding: '32px', borderRadius: '16px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>🚀 Your Pre-Onboarding Task Checklist</h3>
              <span style={{ fontSize: '14px', color: '#818cf8', fontWeight: 'bold' }}>{progressPercent}% Completed</span>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: '#6366f1', transition: 'width 0.3s ease' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {candidate.onboardingTasks?.map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => handleTaskToggle(task.id, task.status)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={task.status === 'COMPLETED'} 
                      readOnly
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: '500', textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none', color: task.status === 'COMPLETED' ? '#94a3b8' : '#f8fafc' }}>
                        {task.title}
                      </div>
                      <span style={{ fontSize: '11px', background: '#334155', color: '#cbd5e1', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                        {task.category}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: task.status === 'COMPLETED' ? '#34d399' : '#fbbf24', fontWeight: '600' }}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidatePortal;
