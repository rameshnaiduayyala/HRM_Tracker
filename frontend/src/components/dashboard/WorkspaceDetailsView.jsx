import React from 'react';
import { ArrowLeft, Building2, MapPin, Users, DollarSign, Calendar, ShieldCheck, Layers, Award, FileText, CheckCircle2, Server, Globe } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function WorkspaceDetailsView({ workspace, onBack, onToggleStatus, onEdit }) {
  if (!workspace) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>No workspace selected.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">
          Back to Workspaces
        </button>
      </div>
    );
  }

  const companies = workspace.companies || [];
  const primaryCompany = companies[0] || {};
  const activeSub = primaryCompany.subscriptions?.find(s => s.status === 'ACTIVE') || primaryCompany.subscriptions?.[0];
  const plan = activeSub?.plan;

  // Extract Primary Admin User Contact Info
  const adminEmployee = primaryCompany.employees?.[0];
  const adminUser = adminEmployee?.user || workspace.users?.[0];

  // Aggregate stats across all companies/branches
  const totalEmployees = companies.reduce((acc, c) => acc + (c._count?.employees || c.employees?.length || 0), 0);
  const priceRate = Number(plan?.pricePerUser || plan?.price || 0);
  const monthlyRevenue = totalEmployees * priceRate;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans">
      {/* Top Action Bar & Header */}
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border hover:bg-white/5 transition text-slate-300"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {workspace.name}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${workspace.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {workspace.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>Subdomain: <code className="text-indigo-400">{workspace.subdomain}.tasktracky.com</code></span>
              <span>•</span>
              <span>Tenant ID: <code>{workspace.id}</code></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(workspace)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 uppercase tracking-wider"
          >
            Edit Tenant Profile
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border flex flex-col justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Company Locations</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-black font-mono text-emerald-400">{companies.length}</span>
          <span className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>Active Branches & Entities</span>
        </div>

        <div className="p-5 rounded-2xl border flex flex-col justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Staff Seat Usage</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-3xl font-black font-mono text-indigo-400">{totalEmployees}</span>
          <span className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>Registered Active Seats</span>
        </div>

        <div className="p-5 rounded-2xl border flex flex-col justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Monthly Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-black font-mono text-emerald-400">{formatCurrency(monthlyRevenue)}</span>
          <span className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>Recurring / Month</span>
        </div>

        <div className="p-5 rounded-2xl border flex flex-col justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Subscription Plan</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-lg font-black truncate text-indigo-400">{plan?.name || 'Unassigned'}</span>
          <span className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>{plan?.billingCycle || 'N/A'} Billing</span>
        </div>
      </div>

      {/* Main Grid: Company Locations Breakdown & Plan Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Registered Companies & Locations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Registered Companies & Location Branches ({companies.length})
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {companies.map((c) => {
                const empCount = c._count?.employees || c.employees?.length || 0;
                const companySub = c.subscriptions?.[0];
                return (
                  <div key={c.id} className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.name}</h3>
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Company ID: {c.id}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold rounded-lg font-mono">
                        {empCount} Active Staff
                      </span>
                    </div>

                    {companySub?.plan && (
                      <div className="flex items-center justify-between pt-2 border-t text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <span>Assigned Tier: <strong className="text-indigo-400">{companySub.plan.name}</strong></span>
                        <span>Rate: <strong className="font-mono text-emerald-400">{formatCurrency(companySub.plan.pricePerUser || companySub.plan.price || 0)} / seat</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
              {companies.length === 0 && (
                <div className="py-12 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  No company location entities registered under this tenant.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Plan Features & Admin Credentials */}
        <div className="space-y-6">
          {/* Subscription Tier Details */}
          <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Subscription Plan Tier
              </h2>
            </div>

            {plan ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Plan Name:</span>
                  <span className="font-bold text-indigo-400">{plan.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Price Rate:</span>
                  <span className="font-bold font-mono text-emerald-400">{formatCurrency(plan.pricePerUser || plan.price || 0)} / seat</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Billing Cycle:</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.billingCycle}</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Capacity Limit:</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.employeeLimit} Seats</span>
                </div>

                <div className="pt-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Included Feature Modules
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.features?.map((f, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border"
                        style={{ background: 'var(--bg-card-alt)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No subscription tier assigned.</p>
            )}
          </div>

          {/* Primary Administrator Details & Contact Card */}
          <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Primary Admin Account & Contact Details
              </h2>
            </div>

            {adminUser ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-xl border mb-2" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)' }}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 shrink-0 text-sm">
                    {adminUser.firstName?.[0] || 'A'}{adminUser.lastName?.[0] || 'D'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {adminUser.firstName} {adminUser.lastName}
                    </h3>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      Company Administrator
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
                  <a href={`mailto:${adminUser.email}`} className="font-semibold text-indigo-400 hover:underline">{adminUser.email}</a>
                </div>

                {adminEmployee?.employeeNum && (
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Employee ID:</span>
                    <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{adminEmployee.employeeNum}</span>
                  </div>
                )}

                {adminEmployee?.designation && (
                  <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Designation / Title:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{adminEmployee.designation}</span>
                  </div>
                )}

                <div className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account Access Status:</span>
                  <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-500/20">
                    {adminEmployee?.status || 'ACTIVE'}
                  </span>
                </div>

                {workspace.users?.[0]?.createdAt && (
                  <div className="flex justify-between py-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>Admin Registered:</span>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(workspace.users[0].createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl border bg-white/5 border-white/10">
                  <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>Default System Tenant Account</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Subdomain: {workspace.subdomain}.tasktracky.com</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
