import React, { useState, useEffect } from 'react';
import { useTracking } from '../contexts/TrackingContext';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: '#464555' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'var(--primary)' },
  { id: 'REVIEW', title: 'In Review', color: '#ea580c' },
  { id: 'DONE', title: 'Done', color: '#16a34a' }
];

export const TasksPage = () => {
  const {
    tasks,
    activeTask,
    selectTask,
    updateTaskStatus,
    fetchTasks
  } = useTracking();
  const { user } = useAuth();

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [activeOverColumn, setActiveOverColumn] = useState(null);

  // Jira-like Task Details modal states
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'timelogs'

  // Comments and Time Log form inputs
  const [newComment, setNewComment] = useState('');
  const [logMinutes, setLogMinutes] = useState('');
  const [logNote, setLogNote] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    setTimeout(() => {
      const card = document.getElementById(`card-${taskId}`);
      if (card) card.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (taskId) => {
    setDraggedTaskId(null);
    setActiveOverColumn(null);
    const card = document.getElementById(`card-${taskId}`);
    if (card) card.classList.remove('dragging');
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    if (activeOverColumn !== columnId) {
      setActiveOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setActiveOverColumn(null);
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setActiveOverColumn(null);
    if (taskId) {
      await updateTaskStatus(taskId, targetColumnId);
      // If modal is open for this task, sync its status
      if (selectedTaskDetails && selectedTaskDetails.id === taskId) {
        setSelectedTaskDetails(prev => ({ ...prev, status: targetColumnId }));
      }
    }
  };

  // Fetch full details of a clicked task
  const handleCardClick = async (task) => {
    setLoadingDetails(true);
    setSelectedTaskDetails(task); // Show shallow cache data first
    setDescValue(task.description || '');
    setIsEditingDesc(false);
    setActiveTab('comments');
    
    try {
      const res = await apiClient.get(`/tasks/${task.id}`);
      const fullTask = res.data?.data?.task;
      if (fullTask) {
        setSelectedTaskDetails(fullTask);
        setDescValue(fullTask.description || '');
      }
    } catch (e) {
      console.error('Failed to load task details:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Edit Description
  const handleSaveDescription = async () => {
    if (!selectedTaskDetails) return;
    try {
      const res = await apiClient.put(`/tasks/${selectedTaskDetails.id}`, { description: descValue });
      setSelectedTaskDetails(prev => ({ ...prev, description: descValue }));
      setIsEditingDesc(false);
      // Reload overall board tasks quietly
      fetchTasks();
    } catch (e) {
      console.error('Failed to update task description:', e);
    }
  };

  // Change status from modal
  const handleStatusChange = async (newStatus) => {
    if (!selectedTaskDetails) return;
    try {
      await updateTaskStatus(selectedTaskDetails.id, newStatus);
      setSelectedTaskDetails(prev => ({ ...prev, status: newStatus }));
    } catch (e) {
      console.error('Failed to update status from modal:', e);
    }
  };

  // Change priority from modal
  const handlePriorityChange = async (newPriority) => {
    if (!selectedTaskDetails) return;
    try {
      await apiClient.put(`/tasks/${selectedTaskDetails.id}`, { priority: newPriority });
      setSelectedTaskDetails(prev => ({ ...prev, priority: newPriority }));
      fetchTasks();
    } catch (e) {
      console.error('Failed to update priority:', e);
    }
  };

  // Post comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTaskDetails) return;
    try {
      await apiClient.post(`/tasks/${selectedTaskDetails.id}/comments`, { body: newComment });
      setNewComment('');
      
      // Refresh task details to load comments with author info
      const res = await apiClient.get(`/tasks/${selectedTaskDetails.id}`);
      if (res.data?.data?.task) {
        setSelectedTaskDetails(res.data.data.task);
      }
    } catch (e) {
      console.error('Failed to post comment:', e);
    }
  };

  // Log time spent
  const handleLogTime = async () => {
    const mins = parseInt(logMinutes);
    if (isNaN(mins) || mins <= 0 || !selectedTaskDetails) return;
    try {
      await apiClient.post(`/tasks/${selectedTaskDetails.id}/time-logs`, {
        minutes: mins,
        note: logNote || 'Logged from Desktop Board'
      });
      setLogMinutes('');
      setLogNote('');
      
      // Refresh task details to reload the time log sheets
      const res = await apiClient.get(`/tasks/${selectedTaskDetails.id}`);
      if (res.data?.data?.task) {
        setSelectedTaskDetails(res.data.data.task);
      }
    } catch (e) {
      console.error('Failed to log time:', e);
    }
  };

  // Format minutes into clean hours/minutes text (e.g. 1h 45m)
  const formatLoggedMinutes = (mins) => {
    if (!mins) return '0m';
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hrs > 0 ? `${hrs}h ${remainingMins}m` : `${remainingMins}m`;
  };

  // Calculate total minutes logged on the task
  const totalMinutesLogged = selectedTaskDetails?.timeLogs?.reduce((sum, log) => sum + log.minutes, 0) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', position: 'relative' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Task Board
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
            Drag and drop cards to update status, or click to open task details, add comments, and log work hours.
          </p>
        </div>

        {activeTask && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--sidebar-active-bg)', border: '1.5px solid var(--primary)', padding: '6px 12px', borderRadius: '8px' }}>
            <span className="status-dot animate-pulse" style={{ background: 'var(--primary)', width: '6px', height: '6px', borderRadius: '50%' }} />
            <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--primary)' }}>
              Working On: <span style={{ color: 'var(--text-primary)' }}>{activeTask.title.split(':')[0]}</span>
            </div>
            <button
              onClick={() => selectTask(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-red)',
                cursor: 'pointer',
                fontSize: '10.5px',
                fontWeight: 'bold',
                padding: '0 0 0 8px',
                borderLeft: '1px solid var(--sidebar-border)'
              }}
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Kanban Board Layout */}
      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          const isOver = activeOverColumn === col.id;

          return (
            <div
              key={col.id}
              className={`kanban-column ${isOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="kanban-column-header">
                <span className="kanban-column-title" style={{ color: col.color }}>
                  {col.title}
                </span>
                <span className="kanban-column-count">{columnTasks.length}</span>
              </div>

              <div className="kanban-card-list">
                {columnTasks.map((task) => {
                  const isActive = activeTask && activeTask.id === task.id;
                  const isUrgent = task.priority === 'URGENT';
                  
                  return (
                    <div
                      key={task.id}
                      id={`card-${task.id}`}
                      className="kanban-card"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={() => handleDragEnd(task.id)}
                      onClick={() => handleCardClick(task)}
                      style={{
                        borderColor: isActive ? 'var(--primary)' : 'var(--sidebar-border)',
                        borderWidth: isActive ? '1.5px' : '1px',
                        background: isActive ? 'var(--sidebar-active-bg)' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.25' }}>
                        {task.title}
                      </div>
                      
                      {task.description && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: '2', WebKitBoxOrient: 'vertical', lineHeight: '1.3', marginTop: '4px' }}>
                          {task.description}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '9px', padding: '1.5px 5px', borderRadius: '4px', background: isUrgent ? 'var(--brand-red-glow)' : '#f1f5f9', color: isUrgent ? 'var(--brand-red)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                          {task.priority}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering details modal
                            selectTask(task);
                          }}
                          disabled={isActive}
                          className="btn-ent btn-start"
                          style={{
                            width: 'auto',
                            padding: '3px 8px',
                            fontSize: '9.5px',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            margin: 0
                          }}
                        >
                          {isActive ? 'Tracking' : 'Track'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '10.5px', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                    Empty Column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Jira-like Task Details Modal Drawer ── */}
      {selectedTaskDetails && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedTaskDetails(null)}
        >
          {/* Modal Container */}
          <div
            style={{
              background: '#ffffff',
              width: '800px',
              maxWidth: '92%',
              height: '620px',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInUp 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()} // Stop propagation
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', fontFamily: 'var(--text-mono)' }}>
                  TASK DETAILS · {selectedTaskDetails.id.split('-')[0].toUpperCase()}
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {selectedTaskDetails.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskDetails(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  padding: '4px'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body (2-Column Layout) */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left Column: Description & Activity Logs */}
              <div style={{ width: '62%', padding: '20px', overflowY: 'auto', borderRight: '1px solid var(--sidebar-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Description Box */}
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Description
                  </span>
                  
                  {isEditingDesc ? (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <textarea
                        value={descValue}
                        onChange={(e) => setDescValue(e.target.value)}
                        placeholder="Add a detailed description for this task..."
                        style={{
                          width: '100%',
                          height: '80px',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--primary)',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                          outline: 'none',
                          resize: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={handleSaveDescription}
                          className="btn-ent btn-start"
                          style={{ width: 'auto', margin: 0, padding: '4px 12px', fontSize: '11px', fontWeight: 'bold' }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsEditingDesc(false); setDescValue(selectedTaskDetails.description || ''); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '11.5px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingDesc(true)}
                      style={{
                        marginTop: '8px',
                        padding: '10px',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        border: '1px solid transparent',
                        fontSize: '12px',
                        color: descValue ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        lineHeight: '1.45',
                        minHeight: '40px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--sidebar-border)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      {descValue || 'No description provided. Click here to write a description...'}
                    </div>
                  )}
                </div>

                {/* Tabs selection: Comments vs Time Logs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--sidebar-border)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('comments')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: activeTab === 'comments' ? 'var(--primary)' : 'var(--text-secondary)',
                      borderBottom: activeTab === 'comments' ? '2px solid var(--primary)' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    Comments
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('timelogs')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: activeTab === 'timelogs' ? 'var(--primary)' : 'var(--text-secondary)',
                      borderBottom: activeTab === 'timelogs' ? '2px solid var(--primary)' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    Work Logs
                  </button>
                </div>

                {/* Tab content 1: Comments section */}
                {activeTab === 'comments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    {/* Add Comment Input */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        style={{
                          flex: 1,
                          height: '50px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--sidebar-border)',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                          outline: 'none',
                          resize: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddComment}
                        className="btn-ent btn-start"
                        style={{ width: '80px', height: '50px', margin: 0, padding: 0, fontSize: '11px', fontWeight: 'bold' }}
                      >
                        Comment
                      </button>
                    </div>

                    {/* Comments List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '200px', marginTop: '6px' }}>
                      {selectedTaskDetails.comments && selectedTaskDetails.comments.length > 0 ? (
                        selectedTaskDetails.comments.map((comment) => {
                          const authorInitials = `${comment.author?.firstName?.[0] || 'T'}${comment.author?.lastName?.[0] || 'M'}`.toUpperCase();
                          return (
                            <div key={comment.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                              <div style={{ width: '26px', height: '26px', fontSize: '9.5px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', flexShrink: 0 }}>
                                {authorInitials}
                              </div>
                              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                  <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                                    {comment.author?.firstName} {comment.author?.lastName}
                                  </strong>
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                    {new Date(comment.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                  {comment.body}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
                          No comments posted yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab content 2: Time Logs history sheet */}
                {activeTab === 'timelogs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', maxHeight: '270px' }}>
                    {selectedTaskDetails.timeLogs && selectedTaskDetails.timeLogs.length > 0 ? (
                      selectedTaskDetails.timeLogs.map((log) => {
                        const loggerInitials = `${log.employee?.user?.firstName?.[0] || 'E'}${log.employee?.user?.lastName?.[0] || 'M'}`.toUpperCase();
                        return (
                          <div key={log.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                            <div style={{ width: '24px', height: '24px', fontSize: '9px', background: '#e2e8f0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', flexShrink: 0 }}>
                              {loggerInitials}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {log.employee?.user?.firstName} {log.employee?.user?.lastName}
                              </span>
                              {log.note && (
                                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '1px' }}>
                                  "{log.note}"
                                </span>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="brand-version" style={{ fontSize: '10px', background: 'var(--status-working-glow)', color: 'var(--status-working)', border: 'none', fontWeight: 'bold' }}>
                                {formatLoggedMinutes(log.minutes)}
                              </span>
                              <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {new Date(log.loggedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
                        No work hours logged yet.
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Right Column: Parameters and Actions */}
              <div style={{ width: '38%', padding: '20px', background: '#f8fafc', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Status Dropdown */}
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Status
                  </span>
                  <select
                    value={selectedTaskDetails.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--sidebar-border)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                {/* Priority Dropdown */}
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Priority
                  </span>
                  <select
                    value={selectedTaskDetails.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--sidebar-border)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Assignee Details */}
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Assignee
                  </span>
                  {selectedTaskDetails.employee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', fontSize: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {`${selectedTaskDetails.employee.user?.firstName?.[0] || 'U'}${selectedTaskDetails.employee.user?.lastName?.[0] || 'A'}`.toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {selectedTaskDetails.employee.user?.firstName} {selectedTaskDetails.employee.user?.lastName}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          {selectedTaskDetails.employee.designation || 'Engineer'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                  )}
                </div>

                <div style={{ height: '1px', background: 'var(--sidebar-border)' }} />

                {/* Time Logs / Log Form Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Time Tracking
                    </span>
                    <strong style={{ fontSize: '12px', color: 'var(--primary)' }}>
                      {formatLoggedMinutes(totalMinutesLogged)} Logged
                    </strong>
                  </div>

                  {/* Log Time Mini Form */}
                  <div style={{ background: '#ffffff', border: '1px solid var(--sidebar-border)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <input
                        type="number"
                        placeholder="Minutes spent (e.g. 45)"
                        value={logMinutes}
                        onChange={(e) => setLogMinutes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--sidebar-border)',
                          fontSize: '11.5px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="What did you work on? (Note)"
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--sidebar-border)',
                          fontSize: '11.5px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLogTime}
                      className="btn-ent btn-start"
                      style={{
                        width: '100%',
                        padding: '5px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        margin: 0
                      }}
                    >
                      Log Work Time
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
