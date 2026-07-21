import React, { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, X, Building2 } from 'lucide-react';
import { teamApi, departmentApi } from '../../services';
import { toast } from 'react-hot-toast';

export default function TeamsTab({ companyId, employees = [] }) {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', departmentId: '' });

  useEffect(() => {
    if (companyId) {
      fetchTeams();
      fetchDepartments();
    }
  }, [companyId]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await teamApi.list(companyId);
      setTeams(res.data?.teams || res.teams || []);
    } catch {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentApi.list(companyId);
      setDepartments(res.data?.departments || res.departments || []);
    } catch {
      // silently ignore — teams still show
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', departmentId: departments[0]?.id || '' });
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, departmentId: t.departmentId || t.department?.id || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.departmentId) {
      toast.error('Please select a department');
      return;
    }
    try {
      if (editing) {
        await teamApi.update(editing.id, { name: form.name, departmentId: form.departmentId });
        toast.success('Team updated!');
      } else {
        await teamApi.create({ name: form.name, departmentId: form.departmentId });
        toast.success('Team created!');
      }
      setShowForm(false);
      fetchTeams();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id, departmentId) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await teamApi.delete(id, departmentId);
      toast.success('Team deleted');
      fetchTeams();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const TEAM_COLORS = [
    'from-violet-950/60 border-violet-500/20',
    'from-cyan-950/60 border-cyan-500/20',
    'from-rose-950/60 border-rose-500/20',
    'from-amber-950/60 border-amber-500/20',
    'from-emerald-950/60 border-emerald-500/20',
  ];
  const ICON_COLORS = ['text-violet-400', 'text-cyan-400', 'text-rose-400', 'text-amber-400', 'text-emerald-400'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Teams</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage cross-functional teams within departments</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> New Team
        </button>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111827] border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-white">{editing ? 'Edit Team' : 'New Team'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Department selector — required by backend */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Department <span className="text-red-400">*</span>
                </label>
                {departments.length === 0 ? (
                  <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/30 rounded-lg px-3 py-2">
                    No departments found. Create a department first.
                  </p>
                ) : (
                  <select
                    required
                    value={form.departmentId}
                    onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="">— Select Department —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Team Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Alpha Squad"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={departments.length === 0}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No teams yet. Create a department first, then add teams.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team, idx) => {
            const memberCount = team._count?.employees ?? 0;
            const colorIdx = idx % TEAM_COLORS.length;
            const deptName = team.department?.name;
            return (
              <div
                key={team.id}
                className={`bg-gradient-to-br ${TEAM_COLORS[colorIdx]} to-gray-900/60 border rounded-2xl p-5 hover:scale-[1.01] transition-all group`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                    <Users className={`w-5 h-5 ${ICON_COLORS[colorIdx]}`} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => openEdit(team)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(team.id, team.departmentId)}
                      className="p-1.5 rounded-lg hover:bg-red-950/60 text-gray-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-white text-sm">{team.name}</h3>
                {deptName && (
                  <div className="flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3 text-gray-500" />
                    <span className="text-[11px] text-gray-500">{deptName}</span>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-400">
                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
