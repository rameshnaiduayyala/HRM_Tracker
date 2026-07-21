import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, MessageSquare, Clock, X, UserCheck, AlertTriangle } from 'lucide-react';
import { tasksEnhancedApi, projectApi } from '../../services';
import { toast } from 'react-hot-toast';

export default function TasksTab({ companyId, employees = [], employeeId }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  const [commentText, setCommentText] = useState('');

  // Interactive filters
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchData(filterAssignee, filterProject, filterPriority);
    }
  }, [companyId, filterAssignee, filterProject, filterPriority]);

  const fetchData = async (assigneeFilter = filterAssignee, projectFilter = filterProject, priorityFilter = filterPriority) => {
    setLoading(true);
    try {
      const empQueryParam = employeeId || assigneeFilter || undefined;
      const [tasksRes, projRes] = await Promise.all([
        tasksEnhancedApi.list({ 
          companyId, 
          employeeId: empQueryParam,
          projectId: projectFilter || undefined,
          priority: priorityFilter || undefined
        }),
        projectApi.list(companyId),
      ]);
      setTasks(tasksRes.data?.tasks || tasksRes.tasks || []);
      setProjects(projRes.data?.projects || projRes.projects || []);
    } catch (err) {
      toast.error('Failed to load task board data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics directly from the filtered list returned by the API
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const reviewCount = tasks.filter((t) => t.status === 'REVIEW').length;
  const pendingCount = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await tasksEnhancedApi.create({
        title: taskForm.title,
        description: taskForm.description,
        projectId: taskForm.projectId,
        employeeId: taskForm.assigneeId || undefined,
        priority: taskForm.priority,
        companyId,
      });
      toast.success('Task created successfully!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', projectId: '', assigneeId: '', priority: 'MEDIUM', dueDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await tasksEnhancedApi.update(taskId, { status });
      toast.success(`Task status moved to ${status.replace('_', ' ')}`);
      fetchData();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status });
      }
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    try {
      await tasksEnhancedApi.addComment(selectedTask.id, { content: commentText });
      toast.success('Comment added');
      setCommentText('');
      const updated = await tasksEnhancedApi.get(selectedTask.id);
      setSelectedTask(updated.data?.task || updated.task || selectedTask);
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'border-blue-500/30 bg-blue-950/10' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-amber-500/30 bg-amber-950/10' },
    { id: 'REVIEW', title: 'In Review', color: 'border-purple-500/30 bg-purple-950/10' },
    { id: 'DONE', title: 'Completed', color: 'border-emerald-500/30 bg-emerald-950/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Task Board & Workflows</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Assign tasks, track work status, and log employee task completion</p>
        </div>
        {!employeeId && (
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Create Task
          </button>
        )}
      </div>

      {/* Enterprise KPI Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Total Tasks</span>
          <span className="text-2xl font-black text-white mt-1">{totalCount}</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Active Pending</span>
          <span className="text-2xl font-black text-white mt-1">{pendingCount}</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Awaiting Review</span>
          <span className="text-2xl font-black text-white mt-1">{reviewCount}</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-xl p-4">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Completion Rate</span>
            <span className="text-xs text-[var(--text-secondary)] font-bold">{completionRate}%</span>
          </div>
          <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Premium Filter Controls Bar */}
      {!employeeId && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-xl p-4 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Assignee Filter</label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="bg-[var(--bg-card-alt)] border border-[var(--border-base)] text-xs text-[var(--text-primary)] rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.user?.firstName || emp.firstName} {emp.user?.lastName || emp.lastName}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Project Board</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="bg-[var(--bg-card-alt)] border border-[var(--border-base)] text-xs text-[var(--text-primary)] rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-[var(--bg-card-alt)] border border-[var(--border-base)] text-xs text-[var(--text-primary)] rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFilterAssignee('');
              setFilterProject('');
              setFilterPriority('');
            }}
            className="self-end px-4 py-2 border border-[var(--border-base)] hover:border-[var(--border-muted)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white rounded-lg transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Kanban Board Layout */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[var(--text-muted)]">Loading task boards...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => (t.status || 'TODO') === col.id);
            return (
              <div key={col.id} className={`border rounded-2xl p-4 flex flex-col min-h-[500px] ${col.color}`}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-base)]">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{col.title}</h3>
                  <span className="text-[10px] bg-gray-800 text-[var(--text-primary)] font-bold px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[var(--text-muted)] italic">No tasks here</div>
                  ) : (
                    colTasks.map((t) => {
                      const assignee = employees.find((e) => e.id === t.employeeId) || t.employee;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          className="bg-[var(--bg-card)] border border-[var(--border-base)] hover:border-[var(--border-muted)] rounded-xl p-3 shadow-md cursor-pointer transition group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                t.priority === 'URGENT'
                                  ? 'bg-red-950 text-red-400 border border-red-800/40'
                                  : t.priority === 'HIGH'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                                  : 'bg-blue-950 text-blue-400 border border-blue-800/40'
                              }`}
                            >
                              {t.priority}
                            </span>
                            {t.dueDate && (
                              <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(t.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition">{t.title}</h4>
                          {t.description && <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">{t.description}</p>}

                          <div className="mt-3 pt-2 border-t border-[var(--border-base)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                            {assignee ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-full bg-indigo-600 text-[8px] font-bold text-white flex items-center justify-center">
                                  {(assignee.user?.firstName || assignee.firstName)?.[0]}
                                </div>
                                <span className="truncate">{assignee.user?.firstName || assignee.firstName}</span>
                              </div>
                            ) : (
                              <span>Unassigned</span>
                            )}
                            <select
                              value={t.status || 'TODO'}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                              className="bg-[var(--bg-card-alt)] border border-[var(--border-base)] text-[9px] text-[var(--text-primary)] rounded px-1 py-0.5"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="REVIEW">In Review</option>
                              <option value="DONE">Done</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-white">Create New Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-[var(--text-secondary)] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Task Title</label>
                <input
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Implement OAuth Flow"
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Project Board</label>
                <select
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                >
                  <option value="">Select Project (Optional)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Assignee</label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.user?.firstName || emp.firstName} {emp.user?.lastName || emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">Description</label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Task specifications..."
                  className="w-full px-3 py-2 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-sm rounded-lg resize-none"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-2 border border-[var(--border-muted)] text-[var(--text-primary)] text-sm rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Task Detail & Comments */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">
                  {selectedTask.status}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-[var(--text-secondary)] hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {selectedTask.description && (
              <p className="text-xs text-[var(--text-primary)] bg-[var(--bg-card-alt)] p-3 rounded-lg border border-[var(--border-base)]">
                {selectedTask.description}
              </p>
            )}

            {/* Comments Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Activity Comments
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {(selectedTask.comments || []).length === 0 ? (
                  <p className="text-[11px] text-[var(--text-muted)] italic">No comments logged yet.</p>
                ) : (
                  (selectedTask.comments || []).map((c, i) => (
                    <div key={i} className="bg-[var(--bg-card-alt)] p-2.5 rounded-lg border border-[var(--border-base)] text-xs">
                      <p className="text-[var(--text-primary)]">{c.content}</p>
                      <span className="text-[9px] text-[var(--text-muted)] mt-1 block">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-1.5 bg-[var(--bg-card-alt)] border border-[var(--border-muted)] text-white text-xs rounded-lg"
                />
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg">
                  Comment
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




