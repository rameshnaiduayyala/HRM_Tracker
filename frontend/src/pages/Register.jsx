import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantApi, planApi } from '../services/api';
import { UserPlus, ArrowLeft, CheckCircle, ShieldCheck, Eye, EyeOff, Building, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [newTenantName, setNewTenantName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [companySize, setCompanySize] = useState('11-50');
  const [industry, setIndustry] = useState('Technology');
  const [companyAddress, setCompanyAddress] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const validateStep1 = () => {
    const errors = {};
    if (!newTenantName.trim()) {
      errors.newTenantName = 'Workspace / Company Name is required.';
    } else if (newTenantName.trim().length < 2) {
      errors.newTenantName = 'Company name must be at least 2 characters.';
    }
    if (!companyAddress.trim()) {
      errors.companyAddress = 'Company Office Address is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!adminFirstName.trim()) {
      errors.adminFirstName = 'First Name is required.';
    }
    if (!adminLastName.trim()) {
      errors.adminLastName = 'Last Name is required.';
    }
    if (!adminEmail.trim()) {
      errors.adminEmail = 'Admin Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      errors.adminEmail = 'Please enter a valid email address.';
    }
    if (!adminPhone.trim()) {
      errors.adminPhone = 'Mobile Number is required.';
    }
    if (!adminPassword) {
      errors.adminPassword = 'Admin Password is required.';
    } else if (adminPassword.length < 8) {
      errors.adminPassword = 'Password must be at least 8 characters long.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError(null);
    if (validateStep1()) {
      setCurrentStep(2);
    } else {
      setError('Please fix the highlighted errors before continuing.');
    }
  };

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
    
    if (!validateStep1()) {
      setCurrentStep(1);
      setError('Please fix the errors in Step 1 before submitting.');
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      setError('Please fix the errors in Step 2 before submitting.');
      return;
    }

    setLoading(true);
    try {
      const pwd = adminPassword || 'admin123';
      const computedSubdomain = newTenantName.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'workspace';

      // Extract fallback first name from email if empty
      const emailPrefix = adminEmail.split('@')[0] || 'Admin';
      const fallbackFirstName = adminFirstName.trim() || emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      const fallbackLastName = adminLastName.trim() || 'Admin';

      await tenantApi.create({
        name: newTenantName,
        subdomain: computedSubdomain,
        adminEmail,
        adminPassword: pwd,
        adminFirstName: fallbackFirstName,
        adminLastName: fallbackLastName,
        adminPhone,
        companyAddress,
        companySize,
        industry,
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
      console.error('Workspace creation error:', err);
      let errMsg = err.response?.data?.message || err.message || 'Workspace creation failed.';
      if (err.response?.data?.errors) {
        const details = typeof err.response.data.errors === 'object'
          ? JSON.stringify(err.response.data.errors)
          : err.response.data.errors;
        errMsg += ` (${details})`;
      }
      setError(errMsg);
      toast.error(errMsg);
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

        {/* LEFT COLUMN: Registration Form Wizard */}
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
              <div className="space-y-6">
                {/* Stepper Navigation Badges */}
                <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${currentStep === 1 ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-transparent text-slate-400 border-slate-700/50'}`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>1. Organization</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep === 1 && (!newTenantName.trim() || !companyAddress.trim())) {
                        setError('Please complete Organization & Location details first.');
                        return;
                      }
                      setError(null);
                      setCurrentStep(2);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${currentStep === 2 ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-transparent text-slate-400 border-slate-700/50'}`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>2. Credentials</span>
                  </button>
                </div>

                <form onSubmit={handleCreateTenant} id="signupForm" className="space-y-4">
                  {/* ── STEP 1: Organization & Location Details ── */}
                  {currentStep === 1 && (
                    <div className="p-4 rounded-2xl border space-y-4" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                        <Building className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                          Step 1 of 2: Organization & Location Details
                        </h3>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Workspace / Company Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Acme Corporation"
                          value={newTenantName}
                          onChange={(e) => {
                            setNewTenantName(e.target.value);
                            if (fieldErrors.newTenantName) setFieldErrors(prev => ({ ...prev, newTenantName: null }));
                          }}
                          className={`w-full px-3 py-2 rounded-xl focus:outline-none transition text-sm ${fieldErrors.newTenantName ? 'border-rose-500 bg-rose-500/10' : 'focus:border-indigo-500'}`}
                          style={{
                            background: fieldErrors.newTenantName ? 'rgba(244,63,94,0.08)' : 'var(--bg-canvas)',
                            border: fieldErrors.newTenantName ? '1px solid #f43f5e' : '1px solid var(--border-muted)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        {fieldErrors.newTenantName && (
                          <span className="text-[11px] text-rose-400 font-semibold mt-1 block">
                            ⚠️ {fieldErrors.newTenantName}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Company Size</label>
                          <select
                            value={companySize}
                            onChange={(e) => setCompanySize(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition text-xs"
                            style={{
                              background: 'var(--bg-canvas)',
                              border: '1px solid var(--border-muted)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <option value="1-10">1-10 Employees</option>
                            <option value="11-50">11-50 Employees</option>
                            <option value="51-200">51-200 Employees</option>
                            <option value="201-500">201-500 Employees</option>
                            <option value="500+">500+ Enterprise</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Industry</label>
                          <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition text-xs"
                            style={{
                              background: 'var(--bg-canvas)',
                              border: '1px solid var(--border-muted)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <option value="Technology">Software / IT</option>
                            <option value="Finance">Financial Services</option>
                            <option value="Healthcare">Healthcare & Bio</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retail">Retail & E-commerce</option>
                            <option value="Services">Professional Services</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Company Office Address</label>
                        <input
                          type="text"
                          required
                          placeholder="123 Tech Park, Suite 400, Hyderabad, TS, India"
                          value={companyAddress}
                          onChange={(e) => {
                            setCompanyAddress(e.target.value);
                            if (fieldErrors.companyAddress) setFieldErrors(prev => ({ ...prev, companyAddress: null }));
                          }}
                          className={`w-full px-3 py-2 rounded-xl focus:outline-none transition text-sm ${fieldErrors.companyAddress ? 'border-rose-500 bg-rose-500/10' : 'focus:border-indigo-500'}`}
                          style={{
                            background: fieldErrors.companyAddress ? 'rgba(244,63,94,0.08)' : 'var(--bg-canvas)',
                            border: fieldErrors.companyAddress ? '1px solid #f43f5e' : '1px solid var(--border-muted)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        {fieldErrors.companyAddress && (
                          <span className="text-[11px] text-rose-400 font-semibold mt-1 block">
                            ⚠️ {fieldErrors.companyAddress}
                          </span>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition uppercase tracking-wider shadow-lg shadow-indigo-600/20"
                        >
                          Continue to Security Credentials →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 2: Security Credentials ── */}
                  {currentStep === 2 && (
                    <div className="p-4 rounded-2xl border space-y-4" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Step 2 of 2: Security Credentials & Admin Details
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>First Name</label>
                          <input
                            type="text"
                            required
                            placeholder="John"
                            value={adminFirstName}
                            onChange={(e) => {
                              setAdminFirstName(e.target.value);
                              if (fieldErrors.adminFirstName) setFieldErrors(prev => ({ ...prev, adminFirstName: null }));
                            }}
                            className={`w-full px-3 py-2 rounded-xl focus:outline-none transition text-sm ${fieldErrors.adminFirstName ? 'border-rose-500 bg-rose-500/10' : 'focus:border-indigo-500'}`}
                            style={{
                              background: fieldErrors.adminFirstName ? 'rgba(244,63,94,0.08)' : 'var(--bg-canvas)',
                              border: fieldErrors.adminFirstName ? '1px solid #f43f5e' : '1px solid var(--border-muted)',
                              color: 'var(--text-primary)',
                            }}
                          />
                          {fieldErrors.adminFirstName && (
                            <span className="text-[11px] text-rose-400 font-semibold mt-1 block">
                              ⚠️ {fieldErrors.adminFirstName}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Last Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Doe"
                            value={adminLastName}
                            onChange={(e) => {
                              setAdminLastName(e.target.value);
                              if (fieldErrors.adminLastName) setFieldErrors(prev => ({ ...prev, adminLastName: null }));
                            }}
                            className={`w-full px-3 py-2 rounded-xl focus:outline-none transition text-sm ${fieldErrors.adminLastName ? 'border-rose-500 bg-rose-500/10' : 'focus:border-indigo-500'}`}
                            style={{
                              background: fieldErrors.adminLastName ? 'rgba(244,63,94,0.08)' : 'var(--bg-canvas)',
                              border: fieldErrors.adminLastName ? '1px solid #f43f5e' : '1px solid var(--border-muted)',
                              color: 'var(--text-primary)',
                            }}
                          />
                          {fieldErrors.adminLastName && (
                            <span className="text-[11px] text-rose-400 font-semibold mt-1 block">
                              ⚠️ {fieldErrors.adminLastName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Admin Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="admin@acme.com"
                            value={adminEmail}
                            onChange={(e) => {
                              setAdminEmail(e.target.value);
                              if (fieldErrors.adminEmail) setFieldErrors(prev => ({ ...prev, adminEmail: null }));
                            }}
                            className={`w-full px-3 py-2 rounded-xl focus:outline-none transition text-sm ${fieldErrors.adminEmail ? 'border-rose-500 bg-rose-500/10' : 'focus:border-indigo-500'}`}
                            style={{
                              background: fieldErrors.adminEmail ? 'rgba(244,63,94,0.08)' : 'var(--bg-canvas)',
                              border: fieldErrors.adminEmail ? '1px solid #f43f5e' : '1px solid var(--border-muted)',
                              color: 'var(--text-primary)',
                            }}
                          />
                          {fieldErrors.adminEmail && (
                            <span className="text-[11px] text-rose-400 font-semibold mt-1 block">
                              ⚠️ {fieldErrors.adminEmail}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Mobile Number</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98765 43210"
                            value={adminPhone}
                            onChange={(e) => {
                              setAdminPhone(e.target.value);
                              if (fieldErrors.adminPhone) setFieldErrors(prev => ({ ...prev, adminPhone: null }));
                            }}
                            className={`w-full px-3 py-2 rounded-xl focus:outline-none transition text-sm ${fieldErrors.adminPhone ? 'border-rose-500 bg-rose-500/10' : 'focus:border-indigo-500'}`}
                            style={{
                              background: fieldErrors.adminPhone ? 'rgba(244,63,94,0.08)' : 'var(--bg-canvas)',
                              border: fieldErrors.adminPhone ? '1px solid #f43f5e' : '1px solid var(--border-muted)',
                              color: 'var(--text-primary)',
                            }}
                          />
                          {fieldErrors.adminPhone && (
                            <span className="text-[11px] text-rose-400 font-semibold mt-1 block">
                              ⚠️ {fieldErrors.adminPhone}
                            </span>
                          )}
                        </div>
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
                            onChange={(e) => {
                              setAdminPassword(e.target.value);
                              if (fieldErrors.adminPassword) setFieldErrors(prev => ({ ...prev, adminPassword: null }));
                            }}
                            className={`w-full px-3 pr-11 py-2 rounded-xl focus:outline-none transition text-sm ${fieldErrors.adminPassword ? 'border-rose-500 bg-rose-500/10' : 'focus:border-indigo-500'}`}
                            style={{
                              background: fieldErrors.adminPassword ? 'rgba(244,63,94,0.08)' : 'var(--bg-canvas)',
                              border: fieldErrors.adminPassword ? '1px solid #f43f5e' : '1px solid var(--border-muted)',
                              color: 'var(--text-primary)',
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
                        {fieldErrors.adminPassword && (
                          <span className="text-[11px] text-rose-400 font-semibold mt-1 block">
                            ⚠️ {fieldErrors.adminPassword}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition uppercase tracking-wider"
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-emerald-600/20"
                        >
                          <UserPlus className="w-4 h-4" />
                          {loading ? 'Submitting Registration...' : 'Complete Workspace Registration'}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Subscription Plan Selection */}
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
                          <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                            {formatCurrency(p.pricePerUser || p.price || 0)}
                          </span>
                          <span className="text-[9px] block leading-none" style={{ color: 'var(--text-muted)' }}>/ user / mo</span>
                        </div>
                      </div>

                      {p.modules && p.modules.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {p.modules.map((m) => (
                            <span key={m} className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                              style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', borderColor: 'rgba(16,185,129,0.25)' }}>
                              {m === 'PROJECTS_TASKS' ? 'Projects & Tasks' : m === 'WORK_TRACKER' ? 'Work Tracker' : m}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3.5 flex items-baseline gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border"
                        style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#6366f1' }} />
                        <span>Max <strong>{p.employeeLimit} employees</strong> limit</span>
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
