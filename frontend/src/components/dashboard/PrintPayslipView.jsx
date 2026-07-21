import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, ArrowLeft, Building2, Calendar, FileText, Landmark } from 'lucide-react';
import Button from '../Button';

// Utility to convert numbers to words (simplified English dollars)
function numberToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Dollars Only' : 'Dollars Only';
  return str;
}

export default function PrintPayslipView({ payslip, onBack }) {
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  if (!payslip) return null;

  const emp = payslip.employee;
  const companyName = emp?.company?.name || 'TaskTracky Enterprise';
  const employeeName = `${emp?.user?.firstName || ''} ${emp?.user?.lastName || ''}`;

  // Computations
  const basic = Math.round(payslip.baseSalary * 0.50);
  const hra = Math.round(payslip.baseSalary * 0.30);
  const splAllowance = Math.round(payslip.baseSalary * 0.20 + (payslip.allowance || 0));
  const grossEarnings = basic + hra + splAllowance;

  const pf = Math.round(basic * 0.12);
  const profTax = 150;
  const healthInsurance = Math.round((payslip.deductions || 0) * 0.30);
  const incomeTax = Math.round(grossEarnings * 0.08);
  const totalDeductions = pf + profTax + healthInsurance + incomeTax;
  
  const netPay = grossEarnings - totalDeductions;
  const netPayInWords = numberToWords(netPay);

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-gray-200">
      {/* Top action controls bar */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-5 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Payroll
        </button>
        <Button
          onClick={() => handlePrint()}
          className="flex items-center gap-2 text-xs py-2 px-5 font-bold bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl uppercase tracking-wider shadow-lg shadow-indigo-600/10"
        >
          <Printer className="w-4 h-4" /> Print Payslip
        </Button>
      </div>

      {/* A4 Printable Payslip Sheet */}
      <div
        ref={printRef}
        id="print-section"
        className="bg-white text-gray-900 border border-gray-300 rounded-3xl p-8 sm:p-12 shadow-2xl relative space-y-8 print:p-0 print:border-0 print:shadow-none print:rounded-none"
        style={{ color: '#111827', backgroundColor: '#ffffff' }}
      >
        {/* Decorative corner seal */}
        <div className="absolute top-8 right-8 border-4 border-indigo-600/10 rounded-full w-20 h-20 flex items-center justify-center pointer-events-none print:top-0 print:right-0">
          <span className="text-[8px] font-black text-indigo-600/35 uppercase tracking-widest text-center">Payroll<br />Verified</span>
        </div>

        {/* Corporate Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1">
              <Building2 className="w-6 h-6 text-indigo-600 shrink-0" />
              {companyName}
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Corporate Headquarters & Workspaces</p>
          </div>
          <div className="text-right">
            <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Salary Statement</h3>
            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1.5 inline-block">
              {payslip.month}
            </span>
          </div>
        </div>

        {/* Employee Profile Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs bg-gray-50 p-6 rounded-2xl border border-gray-200 print:bg-white print:border print:p-4">
          <div className="space-y-2 border-r border-gray-200 pr-6 print:pr-2">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" /> Personnel Information
            </h4>
            <div className="grid grid-cols-2 gap-y-1.5 pt-1">
              <span className="text-gray-500">Employee Name:</span>
              <strong className="text-gray-900">{employeeName}</strong>
              <span className="text-gray-500">Employee ID:</span>
              <strong className="text-gray-900">{emp?.employeeNum}</strong>
              <span className="text-gray-500">Designation:</span>
              <strong className="text-gray-900">{emp?.designation || 'Staff'}</strong>
              <span className="text-gray-500">Department:</span>
              <strong className="text-gray-900">{emp?.department?.name || 'General Operations'}</strong>
            </div>
          </div>

          <div className="space-y-2 pl-2">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-indigo-500" /> Disbursal Accounts & Work
            </h4>
            <div className="grid grid-cols-2 gap-y-1.5 pt-1">
              <span className="text-gray-500">Bank Name:</span>
              <strong className="text-gray-900">Chase National Bank</strong>
              <span className="text-gray-500">Account Number:</span>
              <strong className="text-gray-900">•••• •••• 9840</strong>
              <span className="text-gray-500">Total Working Days:</span>
              <strong className="text-gray-900">26 Days</strong>
              <span className="text-gray-500">Present Days:</span>
              <strong className="text-gray-900">25 Days</strong>
            </div>
          </div>
        </div>

        {/* Salary Breakdown Tables (Earnings & Deductions side-by-side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-gray-300 rounded-3xl overflow-hidden print:border">
          {/* Earnings Column */}
          <div className="border-r border-gray-300 flex flex-col justify-between">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-300">
              <h5 className="text-[10px] font-black text-gray-800 uppercase tracking-wider">Earnings Structure</h5>
            </div>
            <div className="p-5 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Basic Salary</span>
                <span className="font-mono text-gray-900">${basic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">House Rent Allowance (HRA)</span>
                <span className="font-mono text-gray-900">${hra.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Special Allowances</span>
                <span className="font-mono text-gray-900">${splAllowance.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-300 flex justify-between text-xs font-black text-gray-900">
              <span>Gross Earnings</span>
              <span className="font-mono">${grossEarnings.toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="flex flex-col justify-between">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-300">
              <h5 className="text-[10px] font-black text-gray-800 uppercase tracking-wider">Deductions & Taxes</h5>
            </div>
            <div className="p-5 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Provident Fund (PF)</span>
                <span className="font-mono text-gray-900">${pf.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Professional Tax (PT)</span>
                <span className="font-mono text-gray-900">${profTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Medical Insurance Contribution</span>
                <span className="font-mono text-gray-900">${healthInsurance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax Deducted at Source (TDS)</span>
                <span className="font-mono text-gray-900">${incomeTax.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-300 flex justify-between text-xs font-black text-gray-900">
              <span>Total Deductions</span>
              <span className="font-mono">${totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Net Salary Summary Block */}
        <div className="border-2 border-indigo-600 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-50/20 print:bg-white print:border-2">
          <div className="text-center sm:text-left">
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">Net Take-Home Salary</span>
            <span className="text-xs text-gray-500 italic mt-1 block capitalize">{netPayInWords}</span>
          </div>
          <div className="text-center sm:text-right shrink-0">
            <span className="text-3xl font-black text-indigo-700 font-mono">${netPay.toLocaleString()}</span>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="grid grid-cols-2 gap-8 pt-12 text-xs">
          <div className="text-center border-t border-gray-300 pt-3">
            <span className="text-gray-500 block">Employee Signature</span>
            <span className="text-[10px] text-gray-400 block mt-1">Date: ____/____/________</span>
          </div>
          <div className="text-center border-t border-gray-300 pt-3">
            <strong className="text-gray-900 block font-semibold">Authorized HR Director</strong>
            <span className="text-gray-500 block">For {companyName}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[9px] text-gray-400 border-t border-gray-200 pt-6">
          This salary document is system generated and signed electronically. Retain for tax reporting purposes.
        </div>

      </div>
    </div>
  );
}
