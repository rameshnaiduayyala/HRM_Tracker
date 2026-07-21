import React, { useState } from 'react';
import Input from '../Input';
import Button from '../Button';

export default function ConfigurationsTab({ onCreateCompany, loading }) {
  const [newCompanyName, setNewCompanyName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    const success = await onCreateCompany(newCompanyName);
    if (success) setNewCompanyName('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Create Company Form */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Create New Company Division</h3>
        <p className="text-sm text-gray-400 mb-6">Introduce an independent business office or subsidiary unit under your tenant account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Division Name"
            required
            placeholder="e.g. Acme Marketing"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
          />
          <Button
            type="submit"
            loading={loading}
            className="w-full py-2.5"
          >
            Register Division
          </Button>
        </form>
      </div>
    </div>
  );
}
