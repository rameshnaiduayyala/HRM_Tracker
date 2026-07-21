import React, { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Trash2, Users, X, Check } from 'lucide-react';
import { departmentApi } from '../../services';
import { toast } from 'react-hot-toast';

export default function DepartmentsTab({ companyId, employees = [] }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', headId: '' });

  useEffect(() => {
    if (companyId) fetchDepartments();
  }, [companyId]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentApi.list(companyId);
      setDepartments(res.data?.departments || res.departments || []);
    } catch (e) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', headId: '' });
    setShowForm(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || '', headId: dept.headId || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await departmentApi.update(editing.id, { ...form, companyId });
        toast.success('Department updated!');
      } else {
        await departmentApi.create({ ...form, companyId });
        toast.success('Department created!');
      }
      setShowForm(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await departmentApi.delete(id, companyId);
      toast.success('Department deleted');
      fetchDepartments();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Departments</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage organizational units and department heads</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> New Department
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111827] border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-white">{editing ? 'Edit Department' : 'New Department'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Engineering"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Department Head</label>
                <select
                  value={form.headId}
                  onChange={e => setForm(f => ({ ...f, headId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="">— No Head —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
          <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No departments yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map(dept => {
            const head = employees.find(e => e.id === dept.headId);
            const memberCount = dept._count?.employees || 0;
            return (
              <div key={dept.id} className="bg-[#111827] border border-gray-800 rounded-2xl p-5 hover:border-indigo-500/30 transition group">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="p-1.5 rounded-lg hover:bg-red-950 text-gray-400 hover:text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-white text-sm">{dept.name}</h3>
                {dept.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dept.description}</p>}
                <div className="mt-4 pt-4 border-t border-gray-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                  </div>
                  {head && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
                        {head.firstName?.[0]}{head.lastName?.[0]}
                      </div>
                      <span className="text-[11px] text-gray-400">{head.firstName} {head.lastName}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
