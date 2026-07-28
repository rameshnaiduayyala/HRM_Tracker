import { generateEnterpriseEmailLayout } from './baseLayout';
import { OfferLetterParams } from '../../utils/documentTemplates';

export function generateOfferLetterEmailHTML(params: OfferLetterParams): string {
  const frontendUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173';
  const offerUrl = `${frontendUrl}/candidate-portal/${params.offerToken}`;
  return generateEnterpriseEmailLayout({
    companyName: params.companyName,
    companyLogo: params.companyLogo,
    headerTitle: `Job Offer: ${params.designation}`,
    bodyHtml: `
      <p>Dear <strong>${params.candidateName}</strong>,</p>
      <p>We are delighted to extend a formal offer of employment for the position of <strong>${params.designation}</strong> in our <strong>${params.department}</strong> department at <strong>${params.companyName}</strong>.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Total CTC:</td>
            <td style="padding: 6px 0; color: #4338ca; font-weight: 800;">₹${params.ctc.toLocaleString('en-IN')} per annum</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Expected Joining Date:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${new Date(params.expectedJoiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
        </table>
      </div>

      <p>Please click the button below to review your detailed offer letter, compensation breakdown, and accept your offer online.</p>
    `,
    actionButton: {
      text: 'Review & Accept Job Offer',
      url: offerUrl,
    },
    footerNote: 'This offer is subject to reference checks and credential verification.',
  });
}
