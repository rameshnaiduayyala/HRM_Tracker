import { generateEnterpriseEmailLayout } from './baseLayout';

export function generateWorkspaceApprovedEmailHTML(params: {
  adminName: string;
  workspaceName: string;
  subdomain: string;
  companyLogo?: string;
}): string {
  const loginUrl = `http://localhost:5173/login`;

  return generateEnterpriseEmailLayout({
    companyName: params.workspaceName,
    companyLogo: params.companyLogo,
    headerTitle: 'Workspace Registration Approved 🎉',
    bodyHtml: `
      <p>Hi <strong>${params.adminName}</strong>,</p>
      <p>Great news! Your company workspace registration for <strong>${params.workspaceName}</strong> has been approved by the platform administrator.</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #10b981; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Workspace Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Workspace Name:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 800;">${params.workspaceName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Subdomain Handle:</td>
            <td style="padding: 6px 0; color: #4338ca; font-weight: 800; font-family: monospace;">${params.subdomain}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Registration Status:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: 800;">ACTIVE / APPROVED</td>
          </tr>
        </table>
      </div>

      <p>You can now sign into your administrative portal, choose your subscription plan, and onboard staff members.</p>
    `,
    actionButton: {
      text: 'Log In To Workspace',
      url: loginUrl,
    },
    footerNote: 'Welcome to FocusTrack Enterprise! If you need assistance, please contact platform support.',
  });
}

export function generateWorkspaceRejectedEmailHTML(params: {
  adminName: string;
  workspaceName: string;
  reason?: string;
  companyLogo?: string;
}): string {
  return generateEnterpriseEmailLayout({
    companyName: params.workspaceName,
    companyLogo: params.companyLogo,
    headerTitle: 'Workspace Registration Status Update',
    bodyHtml: `
      <p>Hi <strong>${params.adminName}</strong>,</p>
      <p>Thank you for submitting a registration request for <strong>${params.workspaceName}</strong>.</p>
      <p>After review, your company workspace application has been <strong>rejected</strong> or set to <strong>INACTIVE</strong> by the platform administrator.</p>

      ${params.reason ? `
        <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 18px; margin: 20px 0; color: #9f1239;">
          <strong>Decision Details:</strong> ${params.reason}
        </div>
      ` : ''}

      <p style="font-size: 13px; color: #64748b;">If you believe this decision was made in error or wish to provide updated verification documentation, please contact our support team.</p>
    `,
    footerNote: 'FocusTrack Platform Administration & Compliance Team.',
  });
}
