import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import FocusTrackLogo from '../../assets/focustrack-logo.png';

export default function EnterpriseIDCard({ employee, companyLogo }) {
  const cardRef = useRef(null);
  const reduxCompany = useSelector((state) => state.auth.company);

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `Staff_ID_${employee?.employeeNum || 'Card'}`,
  });

  if (!employee) return null;

  const company = employee.company || reduxCompany;
  const rawLogo = companyLogo || company?.logoUrl || company?.logo;
  const logoSrc = rawLogo
    ? rawLogo.startsWith('http') || rawLogo.startsWith('data:')
      ? rawLogo
      : `http://localhost:5000${rawLogo}`
    : FocusTrackLogo;

  const photoSrc = employee.profilePic
    ? employee.profilePic.startsWith('http') || employee.profilePic.startsWith('data:')
      ? employee.profilePic
      : `http://localhost:5000${employee.profilePic}`
    : null;

  const initials = `${employee.user?.firstName?.[0] || ''}${employee.user?.lastName?.[0] || ''}`.toUpperCase();
  const companyName = company?.name || 'Corporate HQ';

  const qrData = JSON.stringify({
    id: employee.id,
    empNum: employee.employeeNum,
    name: `${employee.user?.firstName} ${employee.user?.lastName}`,
    company: companyName,
  });

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Top Header & Print Action Button */}
      <div className="flex items-center justify-between no-print border-b border-slate-700/50 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Official Printable Staff ID Badge</h3>
          <p className="text-xs text-slate-400">Clean white enterprise design (Front & Back Printable)</p>
        </div>
        <button
          type="button"
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition uppercase tracking-wider cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print ID Card
        </button>
      </div>

      {/* Outer wrapper to center cards */}
      <div className="flex justify-center py-4 bg-slate-950/40 rounded-2xl border border-slate-800">
        <div
          ref={cardRef}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px',
            justify: 'center',
            padding: '16px',
            background: '#ffffff',
          }}
        >
          {/* Global print styles embedded for clean paper output */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .printable-card-side, .printable-card-side * {
                visibility: visible !important;
              }
              .printable-card-side {
                page-break-inside: avoid;
              }
            }
          `}</style>

          {/* ── FRONT SIDE (Clean Balanced White Design) ── */}
          <div
            className="printable-card-side"
            style={{
              width: '260px',
              height: '380px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              alignItems: 'center',
              boxSizing: 'border-box',
              color: '#0f172a',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Top Company Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '42px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <img
                src={logoSrc}
                alt="Company Logo"
                style={{ maxHeight: '34px', maxWidth: '180px', objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.src = FocusTrackLogo; }}
              />
            </div>

            {/* Employee Photo or Initials */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto 0' }}>
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt="Employee"
                  style={{
                    width: '85px',
                    height: '85px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #4f46e5',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '85px',
                    height: '85px',
                    borderRadius: '50%',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    fontSize: '28px',
                    fontWeight: '800',
                    border: '3px solid #6366f1',
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  {initials}
                </div>
              )}

              {/* Employee Name & ID & Designation */}
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <h2 style={{ margin: '0 0 3px 0', fontSize: '17px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
                  {employee.user?.firstName} {employee.user?.lastName}
                </h2>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '600', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {employee.designation || 'Staff Member'}
                </p>
                
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 12px', display: 'inline-block' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginRight: '6px' }}>ID:</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>{employee.employeeNum || 'EMP-1001'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Color Stripe Accent */}
            <div style={{ width: '100%', height: '4px', backgroundColor: '#4f46e5', borderRadius: '2px', marginTop: 'auto' }} />
          </div>

          {/* ── BACK SIDE (QR Code & Address & Signature) ── */}
          <div
            className="printable-card-side"
            style={{
              width: '260px',
              height: '380px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              alignItems: 'center',
              boxSizing: 'border-box',
              color: '#0f172a',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Top Back Label */}
            <div style={{ width: '100%', textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                OFFICIAL IDENTITY CARD
              </span>
            </div>

            {/* QR Code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto 0' }}>
              <div style={{ border: '1px solid #e2e8f0', padding: '6px', borderRadius: '10px', backgroundColor: '#ffffff' }}>
                <QRCodeSVG value={qrData} size={82} level="H" includeMargin={false} />
              </div>
              <span style={{ fontSize: '9px', fontWeight: '600', color: '#94a3b8', marginTop: '4px' }}>Scan for Authentication</span>
            </div>

            {/* Company Address & Return Notice */}
            <div style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 10px', fontSize: '9.5px', textAlign: 'center', color: '#334155', lineHeight: '1.35', marginBottom: '8px' }}>
              <p style={{ margin: '0 0 3px 0', fontWeight: '800', color: '#0f172a' }}>{companyName}</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '8.5px' }}>
                {company?.address ? `${company.address} • ` : ''}
                HR Contact: {company?.email || `hr@${companyName.toLowerCase().replace(/\s+/g, '')}.com`}
                {company?.phone ? ` • Tel: ${company.phone}` : ''}
              </p>
            </div>

            {/* Authorized HR Signature */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto' }}>
              <div style={{ width: '110px', borderTop: '1.5px solid #94a3b8', marginTop: '4px' }} />
              <span style={{ fontSize: '8.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginTop: '3px' }}>
                Authorized HR Signature
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
