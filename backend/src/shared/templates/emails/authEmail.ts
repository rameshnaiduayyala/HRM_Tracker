import { generateEnterpriseEmailLayout } from './baseLayout';

export function generateForgotPasswordEmailHTML(params: {
  userName: string;
  resetUrl: string;
  companyName: string;
  companyLogo?: string;
}): string {
  return generateEnterpriseEmailLayout({
    companyName: params.companyName,
    companyLogo: params.companyLogo,
    headerTitle: 'Password Reset Request',
    bodyHtml: `
      <p>Hi <strong>${params.userName}</strong>,</p>
      <p>You recently requested to reset your password for your <strong>${params.companyName}</strong> workspace account. Click the button below to complete the reset. This link is valid for <strong>1 hour</strong>.</p>
    `,
    actionButton: {
      text: 'Reset Password',
      url: params.resetUrl,
    },
    footerNote: 'If you did not request a password reset, please ignore this email or contact your workspace administrator.',
  });
}

export function generatePasswordUpdatedEmailHTML(params: {
  userName: string;
  companyName: string;
  companyLogo?: string;
}): string {
  return generateEnterpriseEmailLayout({
    companyName: params.companyName,
    companyLogo: params.companyLogo,
    headerTitle: 'Password Updated Successfully',
    bodyHtml: `
      <p>Hi <strong>${params.userName}</strong>,</p>
      <p>Your account password for <strong>${params.companyName}</strong> has been successfully updated.</p>
      <p style="font-size: 12px; color: #64748b; margin-top: 16px;">If you did not perform this change, please contact your company administrator immediately.</p>
    `,
    footerNote: 'Security alert sent from FocusTrack Enterprise Account Protection.',
  });
}
