import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import Input from '../Input';
import Button from '../Button';

export default function ProjectsTab({ projects = [], onCreateProject, loading }) {
  const [newProjectName, setNewProjectName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const success = await onCreateProject(newProjectName);
    if (success) setNewProjectName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Projects</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">Configure active project boards for your company office departments.</p>
        </div>
        <span className="text-xs text-[var(--text-secondary)] font-medium">{projects.length} active projects</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-950 text-indigo-400 rounded-md uppercase tracking-wider mb-3 inline-block">Project</span>
              <h3 className="text-lg font-bold text-white mb-2">{proj.name}</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">UUID: <span className="font-mono text-xs">{proj.id}</span></p>
            </div>
            <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] border-t border-[var(--border-base)]/80 pt-4">
              <span>Status: <strong className="text-indigo-400 uppercase">{proj.status}</strong></span>
              <span>Tasks: <strong className="text-white">{proj._count?.tasks || 0}</strong></span>
            </div>
          </div>
        ))}

        {/* Quick Create Project Card */}
        <div className="bg-[var(--bg-card)]/40 border border-dashed border-[var(--border-base)] rounded-2xl p-6 flex flex-col justify-center">
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 text-center">Add New Project</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Project name"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <Button
              type="submit"
              loading={loading}
              className="w-full py-2"
            >
              <PlusCircle className="w-4 h-4" /> Create Project
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}




