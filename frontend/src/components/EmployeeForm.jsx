import React, { useState, useEffect } from 'react';
import { UserPlus, Save } from 'lucide-react';

export default function EmployeeForm({ initialData, managersList = [], onSubmit, loading }) {
  const isEdit = !!initialData;

  const [employeeNum, setEmployeeNum] = useState('');
  const [designation, setDesignation] = useState('');
  const [managerId, setManagerId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  
  // User account fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleName, setRoleName] = useState('EMPLOYEE');

  useEffect(() => {
    if (initialData) {
      setEmployeeNum(initialData.employeeNum || '');
      setDesignation(initialData.designation || '');
      setManagerId(initialData.managerId || '');
      setStatus(initialData.status || 'ACTIVE');
      setFirstName(initialData.user?.firstName || '');
      setLastName(initialData.user?.lastName || '');
      setEmail(initialData.user?.email || '');
      setRoleName(initialData.user?.role?.name || 'EMPLOYEE');
      setPassword(''); // keep blank by default in edit mode
    } else {
      setEmployeeNum('');
      setDesignation('');
      setManagerId('');
      setStatus('ACTIVE');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRoleName('EMPLOYEE');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      employeeNum,
      designation,
      managerId: managerId === '' ? null : managerId,
      status,
      firstName,
      lastName,
      email,
      roleName,
      ...(password && { password }), // only send password if provided
    };
    onSubmit(payload);
  };

  // Filter out the current employee from the manager selection list to prevent self-assignment loops
  const filteredManagers = managersList.filter(mgr => !isEdit || mgr.id !== initialData.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-gray-300">
      
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Company Directory Info</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Employee ID Number</label>
          <input
            type="text"
            required
            placeholder="e.g. EMP-2030"
            value={employeeNum}
            onChange={(e) => setEmployeeNum(e.target.value)}
            className="w-full px-3 py-2 bg-[#1f2937] border border-gray-800 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Designation / Role</label>
          <input
            type="text"
            required
            placeholder="e.g. Software Engineer"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="w-full px-3 py-2 bg-[#1f2937] border border-gray-800 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Reporting Manager</label>
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full px-3 py-2 bg-[#1f2937] border border-gray-800 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="">None (Top Level)</option>
            {filteredManagers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.user.firstName} {mgr.user.lastName} ({mgr.designation || 'Staff'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">System Role</label>
          <select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="w-full px-3 py-2 bg-[#1f2937] border border-gray-800 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="EMPLOYEE">Standard Employee</option>
            <option value="MANAGER">Manager / Lead</option>
          </select>
        </div>
      </div>

      {isEdit && (
        <div>
          <label className="block text-xs font-medium mb-1">Employee Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-[#1f2937] border border-gray-800 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="ACTIVE">ACTIVE (On-Duty)</option>
            <option value="INACTIVE">INACTIVE (Terminated/Suspended)</option>
            <option value="LEAVE">LEAVE (Vacation/Sick)</option>
          </select>
        </div>
      )}

      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2 mb-2">User Account Credentials</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">First Name</label>
          <input
            type="text"
            required
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 bg-[#1f2937] border border-gray-800 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Last Name</label>
          <input
            type="text"
            required
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 bg-[#1f2937] border border-gray-800 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Email Address</label>
        <input
          type="email"
          required
          placeholder="employee@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-[#1f2937] border border-gray-800 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          {isEdit ? 'Reset Password (optional)' : 'Password'}
        </label>
        <input
          type="password"
          required={!isEdit}
          placeholder={isEdit ? '•••••••• (Leave blank to keep current)' : '•••••••• (Min 8 characters)'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-[#1f2937] border border-gray-800 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
      >
        {isEdit ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        {loading ? 'Processing...' : isEdit ? 'Save Changes' : 'Hire Employee'}
      </button>
    </form>
  );
}
