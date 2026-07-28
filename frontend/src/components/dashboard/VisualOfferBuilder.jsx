import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { settingsApi } from '../../services';
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  Eye,
  Type,
  FileText,
  DollarSign,
  CheckSquare,
  Sparkles,
  AlignLeft,
  RefreshCw,
  Edit2
} from 'lucide-react';

const BLOCK_TYPES = [
  { id: 'heading', label: 'Section Heading', icon: Type, defaultText: 'Employment Terms & Details' },
  { id: 'paragraph', label: 'Text Paragraph', icon: AlignLeft, defaultText: 'We are pleased to offer you the position of {{designation}} at {{companyName}}.' },
  { id: 'candidate_info', label: 'Candidate Info Grid', icon: FileText, defaultText: 'Info Grid: {{candidateName}} - {{joiningDate}}' },
  { id: 'salary_table', label: 'Salary Breakdown Table', icon: DollarSign, defaultText: 'Automated Compensation Table (CTC: {{ctc}})' },
  { id: 'checklist', label: 'Terms Checklist', icon: CheckSquare, defaultText: '• Subject to 90 days probation period.\n• Background verification checks apply.' },
  { id: 'signatory', label: 'Signatory Block', icon: FileText, defaultText: 'Authorized Signatory - {{companyName}} HR' },
];

const DEFAULT_BLOCKS = [
  {
    id: 'block-1',
    type: 'paragraph',
    content: 'Dear <strong>{{candidateName}}</strong>,<br/><br/>We are delighted to extend an offer of employment for the position of <strong style="color:#6366f1">{{designation}}</strong> in the <strong>{{department}}</strong> team at <strong>{{companyName}}</strong>.',
  },
  {
    id: 'block-2',
    type: 'heading',
    content: 'Joining Details & Schedule',
  },
  {
    id: 'block-3',
    type: 'candidate_info',
    content: 'Expected Date of Joining: <strong>{{joiningDate}}</strong>',
  },
  {
    id: 'block-4',
    type: 'salary_table',
    content: 'Detailed Annual Compensation Breakdown (Total Annual CTC: <strong>{{ctc}}</strong>)',
  },
  {
    id: 'block-5',
    type: 'checklist',
    content: '• Probation Period: 90 days from Date of Joining.\n• Verification: Employment offer is subject to background verification.\n• Acceptance: Please sign & accept this offer within 5 business days.',
  },
  {
    id: 'block-6',
    type: 'signatory',
    content: 'Authorized HR Signatory<br/><small>{{companyName}} - Talent Acquisition Division</small>',
  },
];

export default function VisualOfferBuilder({ companyId }) {
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeEditingId, setActiveEditingId] = useState(null);

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
      if (s && s.customOfferHeader) {
        try {
          const parsed = JSON.parse(s.customOfferHeader);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBlocks(parsed);
          }
        } catch (e) {
          // If stored as raw string, fallback gracefully
        }
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save blocks structured JSON string in customOfferHeader
      await settingsApi.update(companyId, {
        customOfferHeader: JSON.stringify(blocks),
      });
      toast.success('Visual Drag & Drop Offer Template Saved!');
    } catch (err) {
      toast.error('Failed to save template layout');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setBlocks(items);
  };

  const addBlock = (typeObj) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type: typeObj.id,
      content: typeObj.defaultText,
    };
    setBlocks([...blocks, newBlock]);
    setActiveEditingId(newBlock.id);
    toast.success(`Added ${typeObj.label} block`);
  };

  const removeBlock = (id) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    toast.success('Block removed');
  };

  const updateBlockContent = (id, newContent) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content: newContent } : b)));
  };

  const insertVariableToBlock = (id, variable) => {
    setBlocks(
      blocks.map((b) => (b.id === id ? { ...b, content: b.content + ` ${variable}` } : b))
    );
    toast.success(`Inserted ${variable}`);
  };

  // Preview interpolation helper
  const interpolate = (text) => {
    if (!text) return '';
    return text
      .replace(/\{\{candidateName\}\}/g, 'Alex Rivera')
      .replace(/\{\{designation\}\}/g, 'Lead Fullstack Architect')
      .replace(/\{\{department\}\}/g, 'Engineering')
      .replace(/\{\{companyName\}\}/g, 'Acme Corporation')
      .replace(/\{\{joiningDate\}\}/g, 'August 15, 2026')
      .replace(/\{\{ctc\}\}/g, '₹1,500,000');
  };

  return (
    <div style={{ background: '#0f172a', padding: '28px', borderRadius: '16px', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
            <Sparkles size={24} color="#6366f1" /> Visual Drag & Drop Offer Letter Builder
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Reorder, add text blocks, salary tables, and checklists visually.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              padding: '10px 18px',
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
            <Eye size={16} /> {previewMode ? 'Edit Layout' : 'Live Document Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#10b981',
              color: '#fff',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {previewMode ? (
        /* ── Live Rendered Offer Letter Canvas ── */
        <div style={{ background: '#fff', color: '#1e293b', padding: '48px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ borderBottom: '3px solid #6366f1', paddingBottom: '16px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#4338ca' }}>Acme Corporation</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Date: August 15, 2026</div>
          </div>

          <div style={{ textTransform: 'uppercase', fontSize: '20px', fontWeight: '800', textAlign: 'center', margin: '24px 0', color: '#1e1b4b', letterSpacing: '1px' }}>
            Employment Offer Letter
          </div>

          {/* Render Dynamic Dragged Blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {blocks.map((b) => {
              if (b.type === 'heading') {
                return (
                  <h3 key={b.id} style={{ margin: '12px 0 4px 0', fontSize: '16px', color: '#4338ca', borderBottom: '1px solid #e0e7ff', paddingBottom: '6px' }}>
                    {interpolate(b.content)}
                  </h3>
                );
              }

              if (b.type === 'salary_table') {
                return (
                  <div key={b.id} style={{ margin: '12px 0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>{interpolate(b.content)}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#e0e7ff', color: '#3730a3' }}>
                          <th style={{ padding: '8px 12px', border: '1px solid #c7d2fe', textAlign: 'left' }}>Salary Component</th>
                          <th style={{ padding: '8px 12px', border: '1px solid #c7d2fe', textAlign: 'right' }}>Monthly (₹)</th>
                          <th style={{ padding: '8px 12px', border: '1px solid #c7d2fe', textAlign: 'right' }}>Annual (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Basic Salary (50%)</td>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹62,500</td>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹750,000</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>House Rent Allowance (HRA 20%)</td>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹25,000</td>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹300,000</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Special Allowance (30%)</td>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹37,500</td>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹450,000</td>
                        </tr>
                        <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Total Cost to Company (CTC)</td>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹125,000</td>
                          <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹1,500,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              }

              if (b.type === 'checklist') {
                return (
                  <div key={b.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                    {interpolate(b.content)}
                  </div>
                );
              }

              if (b.type === 'signatory') {
                return (
                  <div key={b.id} style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ width: '220px', borderTop: '1px dashed #94a3b8', paddingTop: '8px', fontSize: '13px' }} dangerouslySetInnerHTML={{ __html: interpolate(b.content) }} />
                    <div style={{ width: '220px', borderTop: '1px dashed #94a3b8', paddingTop: '8px', fontSize: '13px', textAlign: 'center' }}>
                      Candidate Acceptance Signature<br /><small>Alex Rivera</small>
                    </div>
                  </div>
                );
              }

              return (
                <div key={b.id} style={{ fontSize: '14px', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: interpolate(b.content) }} />
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Drag and Drop Interactive Canvas ── */
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
          {/* Add Component Palette Sidebar */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', height: 'fit-content' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Add UI Elements
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {BLOCK_TYPES.map((bt) => {
                const IconComp = bt.icon;
                return (
                  <button
                    key={bt.id}
                    onClick={() => addBlock(bt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <IconComp size={16} color="#818cf8" />
                    <span>{bt.label}</span>
                    <Plus size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Insert Dynamic Tag:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['{{candidateName}}', '{{designation}}', '{{joiningDate}}', '{{ctc}}'].map(tag => (
                  <span key={tag} style={{ fontSize: '11px', fontFamily: 'monospace', background: '#0f172a', color: '#818cf8', padding: '3px 6px', borderRadius: '4px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Drag & Drop Canvas Area */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="offer-blocks-canvas">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#0f172a', minHeight: '400px' }}
                >
                  {blocks.map((block, index) => (
                    <Draggable key={block.id} draggableId={block.id} index={index}>
                      {(draggableProvided, snapshot) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          style={{
                            background: '#1e293b',
                            borderRadius: '12px',
                            border: activeEditingId === block.id ? '2px solid #6366f1' : '1px solid #334155',
                            padding: '16px',
                            boxShadow: snapshot.isDragging ? '0 20px 25px -5px rgba(0,0,0,0.5)' : 'none',
                            ...draggableProvided.draggableProps.style,
                          }}
                        >
                          {/* Block Card Bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                            <div {...draggableProvided.dragHandleProps} style={{ cursor: 'grab', color: '#64748b' }}>
                              <GripVertical size={20} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#818cf8', letterSpacing: '1px' }}>
                              {block.type.replace('_', ' ')} Block #{index + 1}
                            </span>

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setActiveEditingId(activeEditingId === block.id ? null : block.id)}
                                style={{ background: '#334155', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                              >
                                <Edit2 size={12} /> {activeEditingId === block.id ? 'Done' : 'Edit'}
                              </button>
                              <button
                                onClick={() => removeBlock(block.id)}
                                style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>

                          {/* Block Content Editor */}
                          {activeEditingId === block.id ? (
                            <div>
                              <textarea
                                rows={3}
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '10px',
                                  background: '#0f172a',
                                  border: '1px solid #334155',
                                  borderRadius: '6px',
                                  color: '#fff',
                                  fontSize: '13px',
                                  fontFamily: 'sans-serif',
                                  resize: 'vertical'
                                }}
                              />
                              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                {['{{candidateName}}', '{{designation}}', '{{department}}', '{{companyName}}', '{{joiningDate}}', '{{ctc}}'].map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => insertVariableToBlock(block.id, tag)}
                                    style={{ fontSize: '11px', background: '#0f172a', border: '1px solid #334155', color: '#a5b4fc', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    + {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => setActiveEditingId(block.id)}
                              style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer', padding: '8px', background: '#0f172a', borderRadius: '6px' }}
                              dangerouslySetInnerHTML={{ __html: block.content }}
                            />
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}
