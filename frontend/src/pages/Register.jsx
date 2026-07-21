import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantApi, planApi } from '../services/api';
import { UserPlus, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Plans List
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Tenant/Workspace Info Form State
  const [newTenantName, setNewTenantName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');

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
      
      // Reset form states
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
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden font-sans text-gray-200">
      {/* Background decoration glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl bg-[#111827] border border-gray-800 rounded-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT COLUMN: Signup Credentials */}
        <div className="w-full md:w-5/12 p-8 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => navigate('/login')}
                className="p-2 hover:bg-gray-850 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition"
                title="Back to login"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">Onboard Workspace</h1>
                <p className="text-xs text-gray-500">Register your organization workspace</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-4 bg-red-955/40 border border-red-900 text-red-400 rounded-xl text-xs max-h-32 overflow-y-auto">
                {error}
              </div>
            )}

            {success ? (
              <div className="space-y-6 py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registration Completed</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
                    {success}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition uppercase tracking-wider"
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTenant} id="signupForm" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Workspace / Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Corporation"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#1f2937]/50 border border-gray-800 text-white text-sm rounded-xl focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John"
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1f2937]/50 border border-gray-800 text-white text-sm rounded-xl focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1f2937]/50 border border-gray-800 text-white text-sm rounded-xl focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@acme.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#1f2937]/50 border border-gray-800 text-white text-sm rounded-xl focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Admin Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#1f2937]/50 border border-gray-800 text-white text-sm rounded-xl focus:outline-none focus:border-indigo-500 transition"
                  />
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-755 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-indigo-600/10"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Submitting Registration...' : 'Register Workspace'}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Premium Plans & Benefits Grid */}
        <div className="w-full md:w-7/12 p-8 bg-gray-950/20 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Subscription Plan</h3>
            <p className="text-[11px] text-gray-400">Choose the workspace scale that matches your business needs</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-h-[60vh] overflow-y-auto pr-1">
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`bg-[#111827] border rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between hover:shadow-xl ${
                      isSelected
                        ? 'border-indigo-500 ring-1 ring-indigo-500/50'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">{p.name}</h4>
                          <span className="text-[9px] bg-indigo-950 text-indigo-400 font-bold px-1.5 py-0.5 rounded mt-1 inline-block uppercase tracking-wider border border-indigo-800/30">
                            {p.billingCycle}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-white">${Number(p.price)}</span>
                          <span className="text-[9px] text-gray-500 block leading-none">/ mo</span>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-baseline gap-1 text-[11px] text-gray-300 bg-gray-900/50 px-2.5 py-1.5 rounded-lg border border-gray-850">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Up to <strong>{p.employeeLimit} employees</strong></span>
                      </div>

                      {/* Benefits list */}
                      <ul className="mt-4 space-y-2 text-[10px] text-gray-400 border-t border-gray-900 pt-3">
                        {(p.features || []).map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-indigo-500 font-bold shrink-0">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
              {plans.length === 0 && (
                <div className="col-span-full py-16 text-center text-xs text-gray-500 italic">
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
