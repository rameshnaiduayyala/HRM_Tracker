import React, { useState } from 'react';
import { useTracking } from '../contexts/TrackingContext';

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
    updateTaskStatus
  } = useTracking();

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [activeOverColumn, setActiveOverColumn] = useState(null);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    
    // Add dragging styling class shortly after to avoid visual drag image issues
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
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Task Board
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
            Drag and drop tasks between columns to update status, or select a task to track session time.
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

      {/* Kanban Board Container */}
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
                      style={{
                        borderColor: isActive ? 'var(--primary)' : 'var(--sidebar-border)',
                        borderWidth: isActive ? '1.5px' : '1px',
                        background: isActive ? 'var(--sidebar-active-bg)' : '#ffffff'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.25' }}>
                        {task.title}
                      </div>
                      
                      {task.description && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: '2', WebKitBoxOrient: 'vertical', lineHeight: '1.3' }}>
                          {task.description}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '9px', padding: '1.5px 5px', borderRadius: '4px', background: isUrgent ? 'var(--brand-red-glow)' : '#f1f5f9', color: isUrgent ? 'var(--brand-red)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                          {task.priority}
                        </span>

                        <button
                          type="button"
                          onClick={() => selectTask(task)}
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
    </div>
  );
};

export default TasksPage;
