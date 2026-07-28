export interface OfferLetterParams {
  candidateName: string;
  designation: string;
  department: string;
  companyName: string;
  companyLogo?: string;
  ctc: number;
  expectedJoiningDate: string;
  offerToken: string;
  customHeader?: string;
  customTerms?: string;
  customSignatory?: string;
}

export interface RelievingLetterParams {
  employeeName: string;
  employeeNum: string;
  designation: string;
  department: string;
  companyName: string;
  companyLogo?: string;
  joiningDate: string;
  lastWorkingDay: string;
  resignationDate: string;
}

export interface PayslipParams {
  employeeName: string;
  employeeNum: string;
  designation: string;
  department: string;
  companyName: string;
  companyLogo?: string;
  month: string;
  baseSalary: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  netPay: number;
  paymentMethod?: string;
  paymentDate?: string;
}

export function generateOfferLetterHTML(params: OfferLetterParams): string {
  const annualBasic = params.ctc * 0.5;
  const monthlyBasic = Math.round(annualBasic / 12);
  const annualHRA = params.ctc * 0.2;
  const monthlyHRA = Math.round(annualHRA / 12);
  const annualSpecial = params.ctc * 0.3;
  const monthlySpecial = Math.round(annualSpecial / 12);

  const formattedDate = new Date(params.expectedJoiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Interpolate dynamic template placeholders if custom text is configured by HR
  const interpolate = (text?: string) => {
    if (!text) return null;
    return text
      .replace(/\{\{candidateName\}\}/g, params.candidateName)
      .replace(/\{\{designation\}\}/g, params.designation)
      .replace(/\{\{department\}\}/g, params.department)
      .replace(/\{\{companyName\}\}/g, params.companyName)
      .replace(/\{\{joiningDate\}\}/g, formattedDate)
      .replace(/\{\{ctc\}\}/g, `₹${params.ctc.toLocaleString('en-IN')}`);
  };

  let customBlocksHtml: string | null = null;
  if (params.customHeader) {
    try {
      const parsed = JSON.parse(params.customHeader);
      if (Array.isArray(parsed) && parsed.length > 0) {
        customBlocksHtml = parsed.map((b: { type: string; content: string }) => {
          if (b.type === 'heading') {
            return `<h3 style="color:#4338ca; border-bottom: 1px solid #e0e7ff; padding-bottom:6px; margin-top:20px;">${interpolate(b.content)}</h3>`;
          }
          if (b.type === 'salary_table') {
            return `
              <h3>Compensation & Salary Structure</h3>
              <p>Your Total Annual Cost to Company (CTC) will be <strong>₹${params.ctc.toLocaleString('en-IN')}</strong> per annum. The detailed breakdown is provided below:</p>
              <table class="salary-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Monthly (₹)</th>
                    <th>Annual (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Salary</td>
                    <td>₹${monthlyBasic.toLocaleString('en-IN')}</td>
                    <td>₹${Math.round(annualBasic).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>House Rent Allowance (HRA)</td>
                    <td>₹${monthlyHRA.toLocaleString('en-IN')}</td>
                    <td>₹${Math.round(annualHRA).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Special Allowance</td>
                    <td>₹${monthlySpecial.toLocaleString('en-IN')}</td>
                    <td>₹${Math.round(annualSpecial).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style="font-weight: bold; background: #f8fafc;">
                    <td>Total Gross Compensation (CTC)</td>
                    <td>₹${(monthlyBasic + monthlyHRA + monthlySpecial).toLocaleString('en-IN')}</td>
                    <td>₹${params.ctc.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            `;
          }
          if (b.type === 'checklist') {
            return `<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:8px; margin:16px 0; white-space:pre-line;">${interpolate(b.content)}</div>`;
          }
          if (b.type === 'signatory') {
            return '';
          }
          return `<div>${interpolate(b.content)}</div>`;
        }).join('\n');
      }
    } catch (e) {
      // Not JSON array, fallback to normal interpolation
    }
  }

  const headerContent = customBlocksHtml || interpolate(params.customHeader) || `
    <p>Dear <strong>${params.candidateName}</strong>,</p>
    <p>We are pleased to offer you the position of <span class="highlight">${params.designation}</span> in the <strong>${params.department}</strong> department at <strong>${params.companyName}</strong>.</p>
    <p>Your expected date of joining will be <strong>${formattedDate}</strong>.</p>
  `;

  const termsContent = interpolate(params.customTerms) || `
    <p>By accepting this offer, you confirm your availability to join on the mentioned date and agree to complete the background verification and onboarding process.</p>
  `;

  const signatoryContent = params.customSignatory || `Authorized HR Signatory<br/><small>${params.companyName}</small>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Offer Letter - ${params.candidateName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; color: #4338ca; }
    .doc-title { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e1b4b; text-align: center; margin: 20px 0; }
    .content { font-size: 14px; line-height: 1.6; }
    .highlight { font-weight: 600; color: #4338ca; }
    .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    .salary-table th { background: #e0e7ff; color: #3730a3; padding: 10px; border: 1px solid #c7d2fe; text-align: left; }
    .salary-table td { padding: 10px; border: 1px solid #e2e8f0; }
    .footer { margin-top: 50px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    .signature-section { display: flex; justify-content: space-between; margin-top: 60px; }
    .signature-box { width: 240px; border-top: 1px dashed #94a3b8; text-align: center; padding-top: 8px; font-weight: 600; }
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${params.companyName}</div>
    <div>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="doc-title">Employment Offer Letter</div>

  <div class="content">
    ${headerContent}

    <h3>Compensation & Salary Structure</h3>
    <p>Your Total Annual Cost to Company (CTC) will be <strong>₹${params.ctc.toLocaleString('en-IN')}</strong> per annum. The detailed breakdown is provided below:</p>

    <table class="salary-table">
      <thead>
        <tr>
          <th>Component</th>
          <th>Monthly (₹)</th>
          <th>Annual (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Basic Salary</td>
          <td>₹${monthlyBasic.toLocaleString('en-IN')}</td>
          <td>₹${Math.round(annualBasic).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>House Rent Allowance (HRA)</td>
          <td>₹${monthlyHRA.toLocaleString('en-IN')}</td>
          <td>₹${Math.round(annualHRA).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>Special Allowance</td>
          <td>₹${monthlySpecial.toLocaleString('en-IN')}</td>
          <td>₹${Math.round(annualSpecial).toLocaleString('en-IN')}</td>
        </tr>
        <tr style="font-weight: bold; background: #f8fafc;">
          <td>Total Gross Compensation (CTC)</td>
          <td>₹${(monthlyBasic + monthlyHRA + monthlySpecial).toLocaleString('en-IN')}</td>
          <td>₹${params.ctc.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    ${termsContent}
  </div>

  <div class="signature-section">
    <div class="signature-box">
      ${signatoryContent}
    </div>
    <div class="signature-box">
      Candidate Acceptance Signature<br/>
      <small>${params.candidateName}</small>
    </div>
  </div>

  <div class="footer">
    This document is an officially generated Offer Letter issued by ${params.companyName}.
  </div>
</body>
</html>
  `;
}

export function generateRelievingLetterHTML(params: RelievingLetterParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relieving Letter - ${params.employeeName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; color: #0369a1; }
    .doc-title { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0c4a6e; text-align: center; margin: 20px 0; }
    .content { font-size: 14px; line-height: 1.8; }
    .highlight { font-weight: 600; color: #0369a1; }
    .footer { margin-top: 50px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    .signature-box { width: 220px; border-top: 1px dashed #94a3b8; text-align: center; padding-top: 8px; font-weight: 600; margin-top: 60px; }
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${params.companyName}</div>
    <div>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="doc-title">Relieving & Experience Certificate</div>

  <div class="content">
    <p>To Whomsoever It May Concern,</p>
    <p>This is to certify that <strong>${params.employeeName}</strong> (Employee ID: <strong>${params.employeeNum}</strong>) was employed with <strong>${params.companyName}</strong> as <span class="highlight">${params.designation}</span> in the <strong>${params.department}</strong> department from <strong>${new Date(params.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> to <strong>${new Date(params.lastWorkingDay).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
    
    <p>Following their resignation dated <strong>${new Date(params.resignationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>, they have successfully completed all necessary exit formalities and clearings across IT, Human Resources, and Finance departments.</p>

    <p>During their tenure with us, we found them to be sincere, dedicated, and professional. We appreciate their contributions to our organization and wish them all the success in their future endeavors.</p>
  </div>

  <div class="signature-box">
    Authorized Signatory<br/>
    <small>Human Resources, ${params.companyName}</small>
  </div>

  <div class="footer">
    This document serves as an official Relieving and Service Certificate generated by ${params.companyName}.
  </div>
</body>
</html>
  `;
}

export function generatePayslipHTML(params: PayslipParams): string {
  const totalEarnings = params.baseSalary + params.hra + params.specialAllowance + params.conveyance;
  const totalDeductions = params.pfDeduction + params.taxDeduction + params.otherDeductions;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payslip - ${params.employeeName} (${params.month})</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
    .company-name { font-size: 22px; font-weight: bold; color: #047857; }
    .doc-title { font-size: 18px; font-weight: 700; text-transform: uppercase; color: #065f46; text-align: center; margin: 10px 0 20px 0; }
    
    .emp-details { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    .emp-details td { padding: 6px 10px; border: 1px solid #e2e8f0; }
    .emp-details td.label { background: #f1f5f9; font-weight: 600; color: #475569; width: 20%; }

    .pay-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    .pay-table th { background: #d1fae5; color: #065f46; padding: 8px 10px; border: 1px solid #a7f3d0; text-align: left; }
    .pay-table td { padding: 8px 10px; border: 1px solid #e2e8f0; }

    .summary-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
    .net-pay { font-size: 20px; font-weight: bold; color: #047857; }

    .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; }
    @media print {
      body { margin: 0; padding: 15px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${params.companyName}</div>
    <div>Pay Period: <strong>${params.month}</strong></div>
  </div>

  <div class="doc-title">Salary Payslip</div>

  <table class="emp-details">
    <tr>
      <td class="label">Employee Name</td>
      <td>${params.employeeName}</td>
      <td class="label">Employee ID</td>
      <td>${params.employeeNum}</td>
    </tr>
    <tr>
      <td class="label">Designation</td>
      <td>${params.designation}</td>
      <td class="label">Department</td>
      <td>${params.department}</td>
    </tr>
    <tr>
      <td class="label">Payment Method</td>
      <td>${params.paymentMethod || 'Bank Transfer'}</td>
      <td class="label">Payment Date</td>
      <td>${params.paymentDate ? new Date(params.paymentDate).toLocaleDateString() : 'End of Month'}</td>
    </tr>
  </table>

  <table class="pay-table">
    <thead>
      <tr>
        <th>Earnings Component</th>
        <th style="text-align: right;">Amount (₹)</th>
        <th>Deduction Component</th>
        <th style="text-align: right;">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Basic Salary</td>
        <td style="text-align: right;">₹${params.baseSalary.toLocaleString('en-IN')}</td>
        <td>Provident Fund (PF)</td>
        <td style="text-align: right;">₹${params.pfDeduction.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>House Rent Allowance (HRA)</td>
        <td style="text-align: right;">₹${params.hra.toLocaleString('en-IN')}</td>
        <td>Income Tax (TDS)</td>
        <td style="text-align: right;">₹${params.taxDeduction.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Special Allowance</td>
        <td style="text-align: right;">₹${params.specialAllowance.toLocaleString('en-IN')}</td>
        <td>Other Deductions</td>
        <td style="text-align: right;">₹${params.otherDeductions.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Conveyance / Other</td>
        <td style="text-align: right;">₹${params.conveyance.toLocaleString('en-IN')}</td>
        <td>-</td>
        <td style="text-align: right;">-</td>
      </tr>
      <tr style="font-weight: bold; background: #f8fafc;">
        <td>Total Gross Earnings</td>
        <td style="text-align: right;">₹${totalEarnings.toLocaleString('en-IN')}</td>
        <td>Total Deductions</td>
        <td style="text-align: right;">₹${totalDeductions.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <div class="summary-box">
    <div>
      <span style="color: #065f46; font-weight: 600;">Net Salary Payable:</span>
    </div>
    <div class="net-pay">₹${params.netPay.toLocaleString('en-IN')}</div>
  </div>

  <div class="footer">
    This is a computer-generated payslip and does not require a physical signature. Confidential.
  </div>
</body>
</html>
  `;
}
