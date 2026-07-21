import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantApi, planApi } from '../services/api';
import { UserPlus, ArrowLeft, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [newTenantName, setNewTenantName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await planApi.list();
      const planList = res.data?.plans || res.plans || [];
      setPlans(planList);
      if (planList.length > 0) {
        setSelectedPlanId(planList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch pricing plans', err);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const pwd = adminPassword || 'admin123';
      const computedSubdomain = newTenantName.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'workspace';

      await tenantApi.create({
        name: newTenantName,
        subdomain: computedSubdomain,
        adminEmail,
        adminPassword: pwd,
        adminFirstName,
        adminLastName,
        planId: selectedPlanId || undefined,
      });

      toast.success(`Workspace registered! Awaiting super admin approval.`);
      setSuccess("Your company workspace has been successfully registered with your chosen billing subscription plan. Once the super administrator approves, your workspace will be fully active and ready to log in.");

      setNewTenantName('');
      setAdminEmail('');
      setAdminPassword('');
      setAdminFirstName('');
      setAdminLastName('');
    } catch (err) {
      setError(err.message || 'Workspace creation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-12 relative overflow-hidden font-sans" style={{ background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl border rounded-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col md:flex-row"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-muted)' }}>

        <div className="w-full md:w-5/12 p-8 border-b md:border-b-0 md:border-r flex flex-col justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => navigate('/login')}
                className="p-2 border rounded-xl transition"
                style={{ borderColor: 'var(--border-muted)', color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-alt)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Back to login"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Onboard Workspace</h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Register your organization workspace</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-4 border rounded-xl text-xs max-h-32 overflow-y-auto"
                style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.22)', color: '#fda4af' }}>
                {error}
              </div>
            )}

            {success ? (
              <div className="space-y-6 py-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(16,185,129,0.10)', color: '#10b981' }}>
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Registration Completed</h3>
                  <p className="text-xs leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                    {success}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 text-white text-xs font-bold rounded-xl transition uppercase tracking-wider"
                  style={{ background: '#6366f1' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTenant} id="signupForm" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Workspace / Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Corporation"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm"
                    style={{
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-muted)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John"
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm"
                      style={{
                        background: 'var(--bg-canvas)',
                        border: '1px solid var(--border-muted)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm"
                      style={{
                        background: 'var(--bg-canvas)',
                        border: '1px solid var(--border-muted)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Admin Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@acme.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm"
                    style={{
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-muted)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold mb-1 uppercase"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Admin Password
                  </label>

                  <div className="relative">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 pr-11 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm"
                      style={{
                        background: "var(--bg-canvas)",
                        border: "1px solid var(--border-muted)",
                        color: "var(--text-primary)",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-5 h-5 hover:text-indigo-500 transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 hover:text-indigo-500 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {!success && (
            <div className="pt-6">
              <button
                type="submit"
                form="signupForm"
                disabled={loading}
                className="w-full py-3 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
                style={{ background: '#6366f1' }}
                onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
                onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Submitting Registration...' : 'Register Workspace'}
              </button>
            </div>
          )}
        </div>

        <div className="w-full md:w-7/12 p-8 flex flex-col justify-between space-y-6" style={{ background: 'var(--bg-card-alt)' }}>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Select Subscription Plan</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Choose the workspace scale that matches your business needs</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-h-[60vh] overflow-y-auto pr-1">
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className="border rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between hover:shadow-xl"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-muted)',
                      boxShadow: isSelected ? '0 0 0 1px var(--accent-primary-glow)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = isSelected ? 'var(--accent-primary)' : 'var(--border-base)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = isSelected ? 'var(--accent-primary)' : 'var(--border-muted)'}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>{p.name}</h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block uppercase tracking-wider"
                            style={{ background: 'rgba(99,102,241,0.10)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.20)' }}>
                            {p.billingCycle}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>${Number(p.price)}</span>
                          <span className="text-[9px] block leading-none" style={{ color: 'var(--text-muted)' }}>/ mo</span>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-baseline gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border"
                        style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#6366f1' }} />
                        <span>Up to <strong>{p.employeeLimit} employees</strong></span>
                      </div>

                      <ul className="mt-4 space-y-2 text-[10px] border-t pt-3" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        {(p.features || []).map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5 leading-snug">
                            <span className="font-bold shrink-0" style={{ color: '#6366f1' }}>✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
              {plans.length === 0 && (
                <div className="col-span-full py-16 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  Loading available billing plans...
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
