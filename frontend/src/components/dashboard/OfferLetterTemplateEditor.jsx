import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../services';
import { FileText, Save, RefreshCw, Eye, Sparkles, Code } from 'lucide-react';

const DEFAULT_OFFER_HEADER = `<p>Dear <strong>{{candidateName}}</strong>,</p>
<p>We are delighted to offer you the position of <strong style="color: #4338ca;">{{designation}}</strong> in the <strong>{{department}}</strong> team at <strong>{{companyName}}</strong>.</p>
<p>Your scheduled date of joining is <strong>{{joiningDate}}</strong>.</p>`;

const DEFAULT_OFFER_TERMS = `<p><strong>Terms & Conditions of Employment:</strong></p>
<ul>
  <li>This offer is contingent upon successful background verification and document submission.</li>
  <li>You will be under a probation period of 90 days from your joining date.</li>
  <li>Please accept this offer within 5 business days to confirm your joining.</li>
</ul>`;

const DEFAULT_SIGNATORY = `<strong>Authorized HR Signatory</strong><br/><small>{{companyName}} - Talent Acquisition</small>`;

export default function OfferLetterTemplateEditor({ companyId }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [headerHtml, setHeaderHtml] = useState(DEFAULT_OFFER_HEADER);
  const [termsHtml, setTermsHtml] = useState(DEFAULT_OFFER_TERMS);
  const [signatoryText, setSignatoryText] = useState(DEFAULT_SIGNATORY);

  useEffect(() => {
    if (companyId) {
      loadSettings();
    }
  }, [companyId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.get(companyId);
      const s = res.data?.data?.settings || res.data?.settings || res.settings;
      if (s) {
        setHeaderHtml(s.customOfferHeader || DEFAULT_OFFER_HEADER);
        setTermsHtml(s.customOfferTerms || DEFAULT_OFFER_TERMS);
        setSignatoryText(s.customOfferSignatory || DEFAULT_SIGNATORY);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update(companyId, {
        customOfferHeader: headerHtml,
        customOfferTerms: termsHtml,
        customOfferSignatory: signatoryText,
      });
      toast.success('Offer Letter Template saved successfully!');
    } catch (err) {
      toast.error('Failed to save Offer Letter template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset template to standard enterprise default?')) {
      setHeaderHtml(DEFAULT_OFFER_HEADER);
      setTermsHtml(DEFAULT_OFFER_TERMS);
      setSignatoryText(DEFAULT_SIGNATORY);
      toast.success('Template reset to default');
    }
  };

  const insertVariable = (varName, targetSetter, currentVal) => {
    targetSetter(currentVal + ` ${varName}`);
    toast.success(`Inserted ${varName}`);
  };

  // Preview interpolation
  const getInterpolatedPreview = (htmlText) => {
    return htmlText
      .replace(/\{\{candidateName\}\}/g, 'Alex Rivera')
      .replace(/\{\{designation\}\}/g, 'Lead Fullstack Architect')
      .replace(/\{\{department\}\}/g, 'Software Engineering')
      .replace(/\{\{companyName\}\}/g, 'Acme Corporation')
      .replace(/\{\{joiningDate\}\}/g, 'August 15, 2026')
      .replace(/\{\{ctc\}\}/g, '₹1,500,000');
  };

  return (
    <div style={{ background: '#0f172a', padding: '28px', borderRadius: '16px', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
            <FileText size={24} color="#6366f1" /> Offer Letter Template Customizer & Editor
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Design and customize company employment offer templates with dynamic candidate fields.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: previewMode ? '#6366f1' : '#1e293b',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={16} /> {previewMode ? 'Edit Mode' : 'Live Preview'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#cbd5e1',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} /> Reset Default
          </button>
        </div>
      </div>

      {/* Dynamic Placeholder Insertion Toolbox */}
      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#a5b4fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} /> Click to Insert Dynamic Candidate Placeholder:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            '{{candidateName}}',
            '{{designation}}',
            '{{department}}',
            '{{companyName}}',
            '{{joiningDate}}',
            '{{ctc}}',
          ].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v, setHeaderHtml, headerHtml)}
              style={{
                background: '#0f172a',
                border: '1px solid #475569',
                color: '#818cf8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                cursor: 'pointer'
              }}
            >
              + {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading template configuration...</div>
      ) : previewMode ? (
        /* ── Live Rendered Preview ── */
        <div style={{ background: '#fff', color: '#1e293b', padding: '40px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ borderBottom: '2px solid #6366f1', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4338ca' }}>Acme Corporation</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Date: August 15, 2026</div>
          </div>

          <div style={{ textTransform: 'uppercase', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', margin: '20px 0', color: '#1e1b4b' }}>
            Employment Offer Letter
          </div>

          {/* Interpolated Header */}
          <div dangerouslySetInnerHTML={{ __html: getInterpolatedPreview(headerHtml) }} style={{ fontSize: '14px', lineHeight: '1.6' }} />

          {/* Mock Salary Table */}
          <h3 style={{ fontSize: '15px', marginTop: '24px', color: '#334155' }}>Compensation & Salary Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#e0e7ff', color: '#3730a3' }}>
                <th style={{ padding: '8px 12px', border: '1px solid #c7d2fe', textAlign: 'left' }}>Component</th>
                <th style={{ padding: '8px 12px', border: '1px solid #c7d2fe', textAlign: 'left' }}>Monthly</th>
                <th style={{ padding: '8px 12px', border: '1px solid #c7d2fe', textAlign: 'left' }}>Annual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Basic Salary</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>₹62,500</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>₹750,000</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>House Rent Allowance (HRA)</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>₹25,000</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>₹300,000</td>
              </tr>
              <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Total Cost to Company (CTC)</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>₹125,000</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>₹1,500,000</td>
              </tr>
            </tbody>
          </table>

          {/* Interpolated Terms */}
          <div dangerouslySetInnerHTML={{ __html: getInterpolatedPreview(termsHtml) }} style={{ fontSize: '14px', lineHeight: '1.6' }} />

          {/* Signatory Box */}
          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '220px', borderTop: '1px dashed #94a3b8', paddingTop: '8px', fontSize: '13px' }} dangerouslySetInnerHTML={{ __html: getInterpolatedPreview(signatoryText) }} />
            <div style={{ width: '220px', borderTop: '1px dashed #94a3b8', paddingTop: '8px', fontSize: '13px', textAlign: 'center' }}>
              Candidate Acceptance Signature<br/><small>Alex Rivera</small>
            </div>
          </div>
        </div>
      ) : (
        /* ── Editor Mode ── */
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>
              1. Offer Opening Paragraph (HTML Allowed)
            </label>
            <textarea
              rows={5}
              value={headerHtml}
              onChange={(e) => setHeaderHtml(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>
              2. Terms & Conditions Section (HTML Allowed)
            </label>
            <textarea
              rows={4}
              value={termsHtml}
              onChange={(e) => setTermsHtml(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>
              3. Signatory Footer Block (HTML Allowed)
            </label>
            <textarea
              rows={2}
              value={signatoryText}
              onChange={(e) => setSignatoryText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={18} /> {saving ? 'Saving Template...' : 'Save Template Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
